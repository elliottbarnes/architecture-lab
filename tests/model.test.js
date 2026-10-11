import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createMacintoshModel } from '../src/macintosh-model.js';
import { PARTS } from '../src/macintosh-data.js';
import { WIDTH, HEIGHT } from '../src/framebuffer.js';

function instancesInside(object) {
  const instances = [];
  object.traverse(child => { if (child.isInstancedMesh) instances.push(child); });
  return instances;
}

function instancePositions(mesh) {
  const matrix = new THREE.Matrix4();
  return Array.from({ length: mesh.count }, (_, index) => {
    mesh.getMatrixAt(index, matrix);
    return new THREE.Vector3().setFromMatrixPosition(matrix);
  });
}

function assertFiniteBounds(object, message) {
  const bounds = new THREE.Box3().setFromObject(object);
  assert.ok(!bounds.isEmpty(), `${message}: nonempty bounds`);
  assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite), `${message}: finite bounds`);
  assert.ok(bounds.getSize(new THREE.Vector3()).length() > 0, `${message}: visible extent`);
}

test('all twelve documented hardware components have distinct reachable focus targets', () => {
  const model = createMacintoshModel();
  assert.deepEqual([...model.parts.keys()].sort(), PARTS.map(part => part.id).sort());
  assert.equal(model.parts.size, 12);
  const reachable = new Set();
  model.root.traverse(object => reachable.add(object));
  model.root.updateMatrixWorld(true);
  const targets = new Set();
  for (const { id } of PARTS) {
    const members = model.parts.get(id), target = model.focusTargets.get(id);
    assert.ok(members.length > 0, `${id} has selectable objects`);
    assert.ok(members.includes(target), `${id} focuses a member of that component`);
    assert.ok(!targets.has(target), `${id} does not reuse another component's focus target`);
    targets.add(target);
    for (const object of members) {
      assert.ok(reachable.has(object), `${id} is attached to the rendered hierarchy`);
      assert.equal(object.userData.part, id, `${id} supports click identification`);
    }
    assertFiniteBounds(target, id);
  }
  // The registry describes the original system, not additional modern hardware.
  assert.equal(model.parts.has('gpu'), false);
  assert.equal(model.parts.has('fan'), false);
});

test('the 128 KiB memory bank contains sixteen separate 64 Kbit DIP packages', () => {
  const model = createMacintoshModel();
  const bank = model.focusTargets.get('ram');
  const packages = bank.children.filter(object => object.userData.part === 'ram' && instancesInside(object).some(mesh => mesh.count === 16));
  assert.equal(packages.length, 16);
  assert.equal(new Set(packages).size, 16, 'packages are separate objects rather than duplicate references');
  model.root.updateMatrixWorld(true);
  const centers = packages.map(object => object.getWorldPosition(new THREE.Vector3()).toArray().map(value => value.toFixed(6)).join(','));
  assert.equal(new Set(centers).size, 16, 'all packages occupy distinct positions');
  for (const object of packages) {
    const pins = instancesInside(object).find(mesh => mesh.count === 16);
    assert.equal(new Set(instancePositions(pins).map(position => position.toArray().join(','))).size, 16, 'all sixteen terminals are distinct');
  }
  assert.equal(16 * 65536 / 8, 128 * 1024, 'sixteen one-bit-wide 64K chips provide 128 KiB');
});

test('the MC68000 package has sixty-four distinct pins in two rows', () => {
  const model = createMacintoshModel();
  const cpu = model.focusTargets.get('cpu');
  const pins = instancesInside(cpu).find(mesh => mesh.count === 64);
  assert.ok(pins, 'processor terminal geometry contains 64 instances');
  const positions = instancePositions(pins);
  assert.equal(new Set(positions.map(position => position.toArray().join(','))).size, 64);
  assert.equal(positions.filter(position => position.z < 0).length, 32);
  assert.equal(positions.filter(position => position.z > 0).length, 32);
  assert.equal(new Set(positions.map(position => position.x.toFixed(6))).size, 32, 'opposite terminals share thirty-two package positions');
});

test('all mesh vertices, indices, instance transforms, and exploded poses remain finite', () => {
  const model = createMacintoshModel();
  const checked = new Set();
  model.root.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry;
    if (!checked.has(geometry)) {
      checked.add(geometry);
      const positions = geometry.getAttribute('position');
      assert.ok(positions && positions.count > 0, `${object.name || object.type} has vertices`);
      assert.ok([...positions.array].every(Number.isFinite), 'vertex positions cannot contain NaN or infinity');
      const normals = geometry.getAttribute('normal');
      if (normals) assert.ok([...normals.array].every(Number.isFinite), 'normals cannot contain NaN or infinity');
      if (geometry.index) assert.ok([...geometry.index.array].every(index => index >= 0 && index < positions.count), 'triangle indices reference existing vertices');
    }
    if (object.isInstancedMesh) assert.ok([...object.instanceMatrix.array].every(Number.isFinite), 'instance matrices remain finite');
  });
  assert.ok(checked.size > 0);
  for (const amount of [0, 0.5, 1]) {
    for (const layer of model.layers) {
      assert.ok([...layer.assembled.toArray(), ...layer.exploded.toArray()].every(Number.isFinite));
      layer.object.position.lerpVectors(layer.assembled, layer.exploded, amount);
    }
    model.root.updateMatrixWorld(true);
    model.root.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite), `${object.name || object.type}: finite transform at ${amount}`));
    for (const [id, target] of model.focusTargets) assertFiniteBounds(target, `${id} at explosion ${amount}`);
  }
});

test('the display uses the supplied framebuffer texture with an undistorted pixel aspect', () => {
  const texture = new THREE.Texture();
  const model = createMacintoshModel({ screenTexture: texture });
  assert.equal(model.screen.material, model.screenMaterial);
  assert.equal(model.screenMaterial.map, texture, 'live screen texture reaches the visible screen material');
  const geometry = model.screen.geometry;
  geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  // The authored physical dimensions are rounded. Allow less than half a source
  // pixel of ratio error, while rejecting a stretched 4:3 or widescreen display.
  assert.ok(Math.abs(size.x / size.y - WIDTH / HEIGHT) < 0.5 / HEIGHT);
  assert.equal(size.z, 0, 'the texture is applied to a screen plane');
  assert.equal(model.screenMaterial.toneMapped, false, 'lighting exposure does not remap monochrome pixel values');
});

test('peripheral references support motion without moving whole device assemblies', () => {
  const model = createMacintoshModel();
  assert.ok(model.keys.length > 40);
  const keyboard = model.focusTargets.get('keyboard');
  for (const key of model.keys) {
    assert.equal(key.parent, keyboard);
    assert.ok(Number.isFinite(key.userData.homeY));
    assert.equal(typeof key.userData.key, 'string');
    assert.ok(!/^Arrow|^F\d+$/.test(key.userData.key), 'original compact keyboard has no arrow or function keys');
  }
  assert.equal(model.mouseButton.parent, model.focusTargets.get('mouse'));
  assert.ok(Number.isFinite(model.mouseButton.userData.homeY));
  assert.equal(model.disk.parent, model.focusTargets.get('floppy'));
  assert.ok(model.disk.userData.homePosition.distanceTo(model.disk.userData.ejectedPosition) > 0, 'inserted and ejected disk positions differ');
  assert.ok(model.spindle.isMesh);
});
