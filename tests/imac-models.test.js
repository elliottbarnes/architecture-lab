import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createIMacModel } from '../src/imac-models.js';
import { GENERATIONS } from '../src/machine-generations.js';

const generations = GENERATIONS.filter(({ id }) => id.startsWith('imac-'));
const finiteVector = vector => vector.isVector3 && vector.toArray().every(Number.isFinite);
const worldBounds = object => new THREE.Box3().setFromObject(object);
function descendants(object) {
  const objects = [];
  object.traverse(child => objects.push(child));
  return objects;
}
function assertVisibleBounds(object, description) {
  const bounds = worldBounds(object);
  assert.equal(bounds.isEmpty(), false, `${description}: nonempty visible geometry`);
  assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite), `${description}: finite bounds`);
  assert.ok(bounds.getSize(new THREE.Vector3()).length() > 0, `${description}: nonzero extent`);
}

for (const generation of generations) {
  test(`${generation.name}: every documented component is reachable, selectable, and focusable`, () => {
    const model = createIMacModel({ generation: generation.id });
    assert.deepEqual([...model.parts.keys()].sort(), generation.parts.map(({ id }) => id).sort());
    const reachable = new Set(descendants(model.root));
    const targets = new Set();
    for (const { id } of generation.parts) {
      const objects = model.parts.get(id), target = model.focusTargets.get(id);
      assert.ok(objects.length > 0, `${id} has physical selectable objects`);
      assert.ok(objects.includes(target), `${id} focuses its own object`);
      assert.equal(targets.has(target), false, `${id} does not reuse a different component's target`);
      targets.add(target);
      for (const object of objects) {
        assert.ok(reachable.has(object), `${id} is actually attached to the model`);
        assert.equal(object.userData.part, id, `${id} supports the renderer's hit-test contract`);
      }
      assertVisibleBounds(target, id);
    }
    for (const object of reachable) {
      if (object.userData.part) assert.ok(model.parts.has(object.userData.part), 'raycast metadata cannot select an undocumented part');
    }
    assert.ok(model.shell.isGroup);
    assert.ok(model.shellObjects.includes(model.shell));
    assert.equal(model.shell.userData.isShell, true);
  });

  test(`${generation.name}: geometry and full explosion motion remain finite and bounded`, () => {
    const model = createIMacModel({ generation: generation.id });
    const geometries = new Set();
    let meshes = 0, repeatedMeshes = 0;
    model.root.traverse(object => {
      if (!object.isMesh) return;
      meshes += 1;
      const geometry = object.geometry;
      if (!geometries.has(geometry)) {
        geometries.add(geometry);
        const vertices = geometry.getAttribute('position');
        assert.ok(vertices && vertices.count > 0);
        assert.ok([...vertices.array].every(Number.isFinite), 'no invalid vertex positions');
        const normals = geometry.getAttribute('normal');
        if (normals) assert.ok([...normals.array].every(Number.isFinite), 'no invalid lighting normals');
        if (geometry.index) assert.ok([...geometry.index.array].every(index => Number.isInteger(index) && index >= 0 && index < vertices.count), 'indices reference existing vertices');
      }
      if (object.isInstancedMesh) {
        repeatedMeshes += 1;
        assert.ok(object.count > 0);
        assert.ok([...object.instanceMatrix.array].every(Number.isFinite), 'every repeated part has a valid transform');
      }
    });
    assert.ok(repeatedMeshes > 0, 'repeated circuitry uses instancing');
    assert.ok(meshes < 1000, 'procedural detail stays within the intended browser draw-call budget');
    assert.deepEqual(model.layers.map(({ name }) => name).sort(), ['analog', 'display', 'front', 'logic', 'shell', 'storage']);
    assert.equal(new Set(model.layers.map(({ object }) => object)).size, model.layers.length, 'no layer is moved twice');
    for (const layer of model.layers) {
      assert.ok(finiteVector(layer.assembled) && finiteVector(layer.exploded));
      assert.ok(layer.object.position.equals(layer.assembled), 'the initial scene is assembled');
      assert.notEqual(layer.assembled, layer.object.position, 'animation does not mutate its saved home position');
      assert.ok(layer.assembled.distanceTo(layer.exploded) > 0, 'the layer has a distinct open pose');
    }
    for (const amount of [0, 0.25, 0.5, 0.75, 1]) {
      for (const layer of model.layers) layer.object.position.lerpVectors(layer.assembled, layer.exploded, amount);
      model.root.updateMatrixWorld(true);
      model.root.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite), `finite world transform at explosion ${amount}`));
      for (const [id, target] of model.focusTargets) assertVisibleBounds(target, `${id} at explosion ${amount}`);
    }
  });

  test(`${generation.name}: the supplied screen texture preserves its documented aspect ratio`, () => {
    const texture = new THREE.Texture();
    const model = createIMacModel({ generation: generation.id, screenTexture: texture });
    assert.equal(model.screen.material, model.screenMaterial);
    assert.equal(model.screenMaterial.map, texture);
    assert.equal(model.screenMaterial.toneMapped, false, 'renderer exposure does not wash out the live screen');
    model.screen.geometry.computeBoundingBox();
    const size = model.screen.geometry.boundingBox.getSize(new THREE.Vector3());
    const display = generation.parts.find(({ id }) => id === 'display');
    const mode = display.specs.find(({ label }) => label === (generation.id === 'imac-g3' ? 'Maximum mode' : 'Native resolution')).value;
    const [width, height] = mode.match(/\d+/g).map(Number);
    assert.ok(Math.abs(size.x / size.y - width / height) < 0.00001, `${mode} is not stretched to another generation's aspect ratio`);
    assert.equal(size.z, 0, 'pixels are drawn on the visible screen plane');
  });

  test(`${generation.name}: keys and mouse animate independently and keep rest positions`, () => {
    const model = createIMacModel({ generation: generation.id });
    const keyboard = model.focusTargets.get('keyboard'), mouse = model.focusTargets.get('mouse');
    assert.ok(model.keys.length > 50);
    assert.equal(new Set(model.keys).size, model.keys.length);
    const values = new Set(model.keys.map(key => key.userData.key));
    for (const key of model.keys) {
      assert.ok(key.isMesh);
      assert.equal(key.parent, keyboard);
      assert.equal(key.userData.part, 'keyboard');
      assert.equal(typeof key.userData.key, 'string');
      assert.ok(Number.isFinite(key.userData.homeY));
      assert.equal(key.position.y, key.userData.homeY);
    }
    for (const value of ['h', 'e', 'l', 'o', ' ', 'Enter', 'Backspace', 'Shift']) assert.ok(values.has(value), `interactive typing can address ${JSON.stringify(value)}`);
    const keyboardHome = keyboard.position.clone(), mouseHome = mouse.position.clone();
    const key = model.keys.find(key => key.userData.key === 'h');
    key.position.y -= 0.02;
    assert.ok(keyboard.position.equals(keyboardHome), 'depressing a key does not move the whole keyboard');
    key.position.y = key.userData.homeY;
    assert.equal(model.mouseButton.parent, mouse);
    assert.ok(Number.isFinite(model.mouseButton.userData.homeY));
    model.mouseButton.position.y -= 0.01;
    assert.ok(mouse.position.equals(mouseHome), 'pressing the button does not move the whole mouse');
    model.mouseButton.position.y = model.mouseButton.userData.homeY;
    assert.equal(model.mouseButton.userData.part, 'mouse');
  });
}

test('G3 graphics, video memory, and main SDRAM remain physically separate from its CPU module', () => {
  const model = createIMacModel({ generation: 'imac-g3' });
  const cpu = model.focusTargets.get('cpu'), gpu = model.focusTargets.get('gpu'), ram = model.focusTargets.get('ram');
  assert.equal(worldBounds(cpu).intersectsBox(worldBounds(gpu)), false, 'the ATI controller is not drawn inside the PowerPC package');
  assert.equal(worldBounds(ram).intersectsBox(worldBounds(gpu)), false, 'main SDRAM modules are not used as the GPU memory drawing');
  const videoMemory = descendants(gpu).filter(object => object.name === 'VRAM');
  assert.ok(videoMemory.length > 0, 'dedicated graphics memory is visibly attached to the graphics assembly');
  for (const memory of videoMemory) {
    assert.equal(memory.userData.part, 'gpu');
    assert.equal(descendants(ram).includes(memory), false, 'dedicated video memory is not counted as main RAM');
  }
  assert.equal(ram.children.filter(object => object.name === 'SDRAM module').length, 2, 'both documented SO-DIMM positions are represented');
});

test('M4 graphics are an explicitly illustrative region of its package beside unified memory', () => {
  const model = createIMacModel({ generation: 'imac-m4' });
  const cpu = model.focusTargets.get('cpu'), gpu = model.focusTargets.get('gpu'), ram = model.focusTargets.get('ram');
  assert.equal(cpu.parent, gpu.parent, 'CPU and GPU belong to one M4 package substrate');
  assert.equal(cpu.parent, ram.parent, 'unified memory is on that package assembly');
  assert.equal(gpu.userData.illustrativeDieRegion, true, 'the small GPU tile is marked schematic rather than an exact die floorplan');
  const cpuBox = worldBounds(cpu), gpuBox = worldBounds(gpu);
  assert.ok(gpuBox.min.x >= cpuBox.min.x && gpuBox.max.x <= cpuBox.max.x, 'GPU lies within the drawn SoC face horizontally');
  assert.ok(gpuBox.min.y >= cpuBox.min.y && gpuBox.max.y <= cpuBox.max.y, 'GPU lies within the drawn SoC face vertically');
  assert.match(ram.userData.description, /not replaceable memory sticks/);
  assert.equal(descendants(gpu).some(object => object.name === 'VRAM'), false, 'the M4 GPU has no separate G3-style VRAM bank');
  assert.equal(descendants(ram).some(object => object.name === 'SDRAM module'), false, 'the M4 model does not invent replaceable RAM slots');
  assert.notEqual(model.focusTargets.get('storage').parent, ram.parent, 'SSD storage is distinct from unified memory');
});

test('the G3 optical tray has an independent insertion path; the M4 has no optical-drive animation', () => {
  const g3 = createIMacModel({ generation: 'imac-g3' });
  const tray = g3.opticalTray;
  assert.ok(tray.isGroup);
  assert.equal(tray.parent, g3.focusTargets.get('optical'));
  assert.equal(tray.userData.part, 'optical');
  assert.ok(finiteVector(tray.userData.homePosition) && finiteVector(tray.userData.ejectedPosition));
  assert.ok(tray.position.equals(tray.userData.homePosition));
  assert.ok(tray.userData.ejectedPosition.z > tray.userData.homePosition.z, 'the tray ejects toward the user at positive Z');
  const driveHome = tray.parent.position.clone();
  tray.position.lerpVectors(tray.userData.homePosition, tray.userData.ejectedPosition, 0.5);
  assert.ok(tray.parent.position.equals(driveHome), 'opening a tray does not displace the drive mechanism');
  assert.ok(g3.spindle.isMesh);
  assert.ok(descendants(tray).includes(g3.spindle), 'the spinning disc stays attached to the tray');
  const m4 = createIMacModel({ generation: 'imac-m4' });
  assert.equal(m4.parts.has('optical'), false);
  assert.equal(m4.opticalTray, undefined);
  assert.equal(m4.spindle, undefined);
});

test('generation construction is isolated and rejects unsupported model identifiers', () => {
  const a = createIMacModel({ generation: 'imac-m4' });
  const b = createIMacModel({ generation: 'imac-m4' });
  assert.notEqual(a.root, b.root);
  assert.notEqual(a.keys[0], b.keys[0]);
  const home = b.layers[0].object.position.clone();
  a.layers[0].object.position.copy(a.layers[0].exploded);
  a.keys[0].position.y -= 0.01;
  assert.ok(b.layers[0].object.position.equals(home));
  assert.equal(b.keys[0].position.y, b.keys[0].userData.homeY);
  assert.throws(() => createIMacModel({ generation: 'latest' }), RangeError);
});
