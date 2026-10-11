import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMacintoshModel } from './macintosh-model.js';
import { createIMacModel } from './imac-models.js';

const PART_LABELS = { cpu: '68000', ram: 'RAM', rom: 'ROM', display: 'CRT', floppy: 'Floppy', analog: 'Power', via: 'VIA', scc: 'SCC', iwm: 'IWM', keyboard: 'Keyboard', mouse: 'Mouse', sound: 'Speaker', gpu: 'Graphics', storage: 'Storage', optical: 'CD-ROM', io: 'I/O', camera: 'Camera' };
const EXTERNAL = new Set(['display', 'floppy', 'keyboard', 'mouse']);
const VIEWS = { front: [0, 2.2, 9], rear: [-4.5, 3.6, -8], board: [0.1, 10, 3.3], isometric: [5.2, 4.3, 8.4] };

/** Interactive rendering only; electrical transfers and time are explanatory. */
export function createMacintoshRenderer(host, { screenCanvas, generation = 'macintosh', onSelect, onStatus = () => {} }) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'machine-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Rotatable 3D Macintosh. Drag to orbit; scroll or pinch to zoom. Arrow keys rotate, plus and minus zoom, Home resets. Select components with the labelled buttons or component menu.');
  const viewport = document.createElement('div');
  viewport.className = 'machine-viewport';
  viewport.append(canvas);
  const labels = document.createElement('div');
  labels.className = 'machine-labels';
  labels.setAttribute('aria-label', '3D component labels');
  viewport.append(labels);
  host.append(viewport);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5efe2');
  const camera = new THREE.PerspectiveCamera(36, 1, .05, 70);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = .085;
  controls.minDistance = 2.1;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * .49;
  controls.minPolarAngle = .07;
  controls.enablePan = true;
  controls.autoRotateSpeed = .6;
  controls.target.set(0, 1.6, .25);
  camera.position.set(...VIEWS.isometric);
  controls.update();
  scene.add(new THREE.HemisphereLight(0xfffbef, 0x7b807b, 1.7));
  const keyLight = new THREE.DirectionalLight(0xfff3dc, 2.5);
  keyLight.position.set(-4, 8, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 25 });
  keyLight.shadow.bias = -.0008;
  keyLight.shadow.normalBias = .035;
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xd8eafa, 1.1);
  rim.position.set(5, 5, -6); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#f5efe2', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.08; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(18, 36, 0xd7cbb7, 0xe5dac7);
  grid.position.y = -.075; grid.material.transparent = true; grid.material.opacity = .45; scene.add(grid);
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.magFilter = THREE.NearestFilter;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.generateMipmaps = false;
  const machine = generation === 'macintosh' ? createMacintoshModel({ screenTexture }) : createIMacModel({ screenTexture, generation });
  scene.add(machine.root);
  machine.root.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  let selected = 'display', explosion = 0, targetExplosion = 0, labelsOn = true, xray = false;
  let disposed = false, visible = true, dirty = true, frameId = 0, lastTime = 0;
  let rotateEnabled = false;
  let cameraMove = null, pointerDown = null, diskInserted = false, trayOpen = false, readingUntil = 0, keyUntil = 0, keyMesh = null;
  let activeLinks = [], transientUntil = 0, transientTimer = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const selectionBox = new THREE.Box3();
  const selection = new THREE.Box3Helper(selectionBox, 0x9851a8);
  selection.material.depthTest = false; selection.material.transparent = true; selection.material.opacity = .68;
  selection.renderOrder = 20; scene.add(selection);
  const partCenter = id => {
    const objects = machine.parts.get(id);
    if (!objects?.length) return new THREE.Vector3();
    const box = new THREE.Box3();
    box.expandByObject(machine.focusTargets?.get(id) || objects[0]);
    return box.getCenter(new THREE.Vector3());
  };
  const labelNodes = new Map();
  for (const [id, name] of Object.entries(PART_LABELS)) {
    if (!machine.parts.has(id)) continue;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'machine-label'; button.dataset.partLabel = id;
    const label = id === 'cpu' ? ({macintosh:'68000','imac-g3':'PowerPC G3','imac-m4':'M4'}[generation]) : id === 'display' && generation === 'imac-m4' ? 'Retina display' : name;
    button.textContent = label; button.setAttribute('aria-label', `Inspect ${label}`);
    button.addEventListener('click', () => onSelect(id));
    labels.append(button); labelNodes.set(id, button);
  }
  const streams = new THREE.Group(); scene.add(streams);
  let streamObjects = [];
  function clearStreams() {
    for (const stream of streamObjects) { stream.line.geometry.dispose(); stream.line.material.dispose(); stream.dot.geometry.dispose(); stream.dot.material.dispose(); }
    streams.clear(); streamObjects = [];
  }
  function setSignals(links, { transient = false } = {}) {
    clearTimeout(transientTimer);
    if (transient) transientTimer = setTimeout(() => { if (!disposed) setSignals([]); }, 1950);
    if (JSON.stringify(links || []) === JSON.stringify(activeLinks)) { transientUntil = transient ? performance.now() + 1900 : 0; dirty = true; requestFrame(); return; }
    clearStreams(); activeLinks = links || []; transientUntil = transient ? performance.now() + 1900 : 0;
    activeLinks.forEach(([from, to], index) => {
      const color = index % 2 ? 0xc56b23 : 0x1688b3;
      const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .7, depthTest: false }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.042, 8, 6), new THREE.MeshBasicMaterial({ color, depthTest: false }));
      line.renderOrder = 8; dot.renderOrder = 9; streams.add(line, dot);
      streamObjects.push({ from, to, line, dot, phase: index * .3 });
    });
    dirty = true; requestFrame();
  }
  function updateStreams(now) {
    if (transientUntil && now > transientUntil) { clearStreams(); activeLinks = []; transientUntil = 0; }
    for (const stream of streamObjects) {
      const a = partCenter(stream.from), b = partCenter(stream.to);
      const mid = a.clone().lerp(b, .5); mid.y += .55;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const points = curve.getPoints(32);
      stream.line.geometry.setFromPoints(points);
      stream.dot.position.copy(curve.getPoint(reducedMotion ? .5 : (now / 2000 + stream.phase) % 1));
    }
  }
  const shellMaterials = new Map(), replacedMaterials = new Set();
  const shellObjects = machine.shellObjects || (machine.shell ? [machine.shell] : machine.layers.filter(layer => layer.name === 'shell').map(layer => layer.object));
  for (const object of shellObjects) object.traverse(mesh => {
    if (!mesh.isMesh || !mesh.material) return;
    // Clone so translucent shell changes never leak into the bezel or keyboard.
    if (Array.isArray(mesh.material)) return;
    replacedMaterials.add(mesh.material);
    mesh.material = mesh.material.clone();
    shellMaterials.set(mesh.material, { opacity: mesh.material.opacity, transparent: mesh.material.transparent, depthWrite: mesh.material.depthWrite });
  });
  function applyShell() {
    for (const [material, original] of shellMaterials) {
      material.transparent = xray || original.transparent;
      material.opacity = xray ? .13 : original.opacity;
      material.depthWrite = xray ? false : original.depthWrite;
      material.needsUpdate = true;
    }
    dirty = true; requestFrame();
  }
  function updateLayers() {
    for (const layer of machine.layers) layer.object.position.lerpVectors(layer.assembled, layer.exploded, explosion);
    machine.root.updateMatrixWorld(true);
  }
  function updateLabels() {
    const rect = viewport.getBoundingClientRect();
    const used = [];
    const order = [selected, ...Object.keys(PART_LABELS).filter(id => id !== selected)];
    for (const id of order) {
      const button = labelNodes.get(id);
      if (!button) continue;
      const show = labelsOn && (explosion > .3 || xray || EXTERNAL.has(id));
      const point = partCenter(id).project(camera);
      const px = (point.x + 1) * rect.width / 2, py = (1 - point.y) * rect.height / 2;
      let y = py - 24;
      const x = THREE.MathUtils.clamp(px, 35, rect.width - 35);
      for (let tries = 0; tries < 5 && used.some(other => Math.abs(other.x - x) < 63 && Math.abs(other.y - y) < 25); tries++) y += 25;
      const inView = point.z > -1 && point.z < 1 && px > 12 && px < rect.width - 12 && y > 15 && y < rect.height - 20;
      button.hidden = !show || !inView;
      if (!button.hidden) { button.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; used.push({ x, y }); }
      button.classList.toggle('selected', id === selected);
      button.classList.toggle('signal-active', activeLinks.some(link => link.includes(id)));
      button.setAttribute('aria-pressed', String(id === selected));
    }
  }
  function updateSelection() {
    selectionBox.makeEmpty();
    const object = machine.focusTargets?.get(selected) || machine.parts.get(selected)?.[0];
    if (object) selectionBox.expandByObject(object);
    selection.visible = !selectionBox.isEmpty() && (explosion > .3 || EXTERNAL.has(selected) || xray);
    selectionBox.expandByScalar(.045);
  }
  function animatePeripherals(now, dt) {
    if (machine.disk) {
      const home = machine.disk.userData.homePosition || new THREE.Vector3();
      const targetZ = home.z + (diskInserted ? 0 : 1.05);
      machine.disk.position.z = THREE.MathUtils.damp(machine.disk.position.z, targetZ, 8, dt);
      machine.disk.visible = diskInserted || explosion > .2;
    }
    if (machine.opticalTray) {
      const target = !trayOpen ? machine.opticalTray.userData.homePosition : machine.opticalTray.userData.ejectedPosition;
      machine.opticalTray.position.lerp(target, reducedMotion ? 1 : 1 - Math.exp(-8 * dt));
    }
    if (machine.spindle && readingUntil > now && !reducedMotion) machine.spindle.rotation.y += dt * 12;
    if (keyMesh) {
      keyMesh.position.y = (keyMesh.userData.homeY ?? .2) - (now < keyUntil ? .035 : 0);
      if (now >= keyUntil) keyMesh = null;
    }
  }
  function requestFrame() { if (!frameId && !disposed && visible && !document.hidden) frameId = requestAnimationFrame(render); }
  function render(now) {
    frameId = 0;
    if (disposed || !visible || document.hidden) return;
    const dt = Math.min(.05, (now - (lastTime || now)) / 1000); lastTime = now;
    const wasExploding = Math.abs(explosion - targetExplosion) > .0005;
    if (wasExploding) { explosion = reducedMotion ? targetExplosion : THREE.MathUtils.damp(explosion, targetExplosion, 7, dt); if (Math.abs(explosion - targetExplosion) < .0005) explosion = targetExplosion; updateLayers(); dirty = true; }
    if (cameraMove) {
      const mix = reducedMotion ? 1 : 1 - Math.exp(-7 * dt);
      camera.position.lerp(cameraMove.position, mix); controls.target.lerp(cameraMove.target, mix);
      if (camera.position.distanceTo(cameraMove.position) < .015) { camera.position.copy(cameraMove.position); controls.target.copy(cameraMove.target); cameraMove = null; }
      dirty = true;
    }
    controls.autoRotate = rotateEnabled && !cameraMove;
    const changed = controls.update(dt);
    const animate = (!reducedMotion && streamObjects.length > 0) || readingUntil > now || keyMesh || (machine.opticalTray && machine.opticalTray.position.distanceTo(!trayOpen ? machine.opticalTray.userData.homePosition : machine.opticalTray.userData.ejectedPosition) > .001) || (machine.disk && Math.abs(machine.disk.position.z - ((machine.disk.userData.homePosition?.z || 0) + (diskInserted ? 0 : 1.05))) > .001);
    if (dirty || changed || animate || controls.autoRotate) {
      animatePeripherals(now, dt); machine.root.updateMatrixWorld(true); updateSelection(); updateStreams(now); updateLabels(); renderer.render(scene, camera); dirty = false;
    }
    if (wasExploding || cameraMove || changed || animate || controls.autoRotate) requestFrame();
  }
  controls.addEventListener('change', () => { dirty = true; requestFrame(); });
  controls.addEventListener('start', () => { cameraMove = null; });
  function resize() {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height; camera.zoom = Math.min(1, camera.aspect / 1.05); camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false); dirty = true; requestFrame();
  }
  const observer = new ResizeObserver(resize); observer.observe(viewport);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) { lastTime = 0; dirty = true; requestFrame(); } }, { rootMargin: '120px' });
  intersection.observe(viewport);
  const onVisibility = () => { lastTime = 0; requestFrame(); };
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY }; });
  canvas.addEventListener('pointerup', event => {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) { pointerDown = null; return; }
    pointerDown = null;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObject(machine.root, true)) {
      let ancestor = hit.object, hidden = false;
      while (ancestor) { if (!ancestor.visible) { hidden = true; break; } ancestor = ancestor.parent; }
      if (hidden) continue;
      const id = hit.object.userData.part;
      if (id) { onSelect(id); break; }
      if (!xray && targetExplosion < .25) break;
    }
  });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(event.key)) return;
    event.preventDefault(); cameraMove = null;
    if (event.key === 'Home') { setView('isometric'); return; }
    const offset = camera.position.clone().sub(controls.target), spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === 'ArrowLeft') spherical.theta -= .14;
    if (event.key === 'ArrowRight') spherical.theta += .14;
    if (event.key === 'ArrowUp') spherical.phi = Math.max(.1, spherical.phi - .12);
    if (event.key === 'ArrowDown') spherical.phi = Math.min(Math.PI * .49, spherical.phi + .12);
    if (event.key === '+' || event.key === '=') spherical.radius = Math.max(controls.minDistance, spherical.radius * .88);
    if (event.key === '-') spherical.radius = Math.min(controls.maxDistance, spherical.radius * 1.12);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update(); dirty = true; requestFrame();
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); if (disposed) return; onStatus('The 3D view paused. Reload to restore it; component controls and the bitmap lab remain available.'); });
  function setView(name = 'isometric') {
    const position = new THREE.Vector3(...(VIEWS[name] || VIEWS.isometric));
    const target = new THREE.Vector3(0, 1.6 + targetExplosion * .3, .25);
    if (name === 'board') { target.copy(partCenter('cpu')); position.copy(target).add(new THREE.Vector3(.05, 5.2, 2.0)); }
    else position.sub(new THREE.Vector3(0, 1.6, .25)).multiplyScalar(1 + targetExplosion * .48).add(target);
    cameraMove = { position, target }; requestFrame();
  }
  function setExplode(value, immediate = false) {
    targetExplosion = THREE.MathUtils.clamp(value, 0, 1);
    if (immediate || reducedMotion) { explosion = targetExplosion; updateLayers(); }
    dirty = true; requestFrame();
  }
  function activity(event) {
    const now = performance.now();
    const io = generation === 'macintosh' ? 'via' : 'io';
    const graphics = generation === 'macintosh' ? 'ram' : 'gpu';
    if (event.type === 'mouse') {
      if (machine.mouseButton) machine.mouseButton.position.y = (machine.mouseButton.userData.homeY || 0) - (event.pressed ? .035 : 0);
      if (event.visible) setSignals(generation === 'macintosh' ? [['mouse','scc'],['mouse','via'],['scc','cpu'],['cpu','ram'],['ram','display']] : [['mouse',io],[io,'cpu'],['cpu',graphics],[graphics,'display']], { transient: true });
    }
    if (event.type === 'keyboard') {
      if (keyMesh) keyMesh.position.y = keyMesh.userData.homeY;
      keyMesh = machine.keys.find(key => key.userData.key?.toUpperCase() === event.text?.slice(-1).toUpperCase()) || machine.keys[0];
      keyUntil = now + 170;
      setSignals([['keyboard', io], [io, 'cpu'], ['cpu', graphics], [graphics, 'display']], { transient: true });
    }
    if (event.type === 'disk') {
      diskInserted = event.inserted;
      if (event.source === 'optical') trayOpen = !event.inserted;
      if (event.reading) { readingUntil = now + 1800; setSignals(generation === 'macintosh' ? [['floppy','iwm'],['iwm','cpu'],['cpu','ram'],['ram','display']] : [[event.source || 'storage', generation === 'imac-g3' ? 'io' : 'cpu'], ...(generation === 'imac-g3' ? [['io','cpu']] : []), ['cpu','ram'],['ram','gpu'],['gpu','display']], { transient: true }); }
      else readingUntil = 0;
    }
    dirty = true; requestFrame();
  }
  updateLayers(); resize(); requestFrame();
  return {
    setExplode, setView, activity, setSignals,
    select(id) { selected = id; dirty = true; requestFrame(); },
    setLabels(value) { labelsOn = value; dirty = true; requestFrame(); },
    setXray(value) { xray = value; applyShell(); },
    setRotate(value) { rotateEnabled = value; controls.autoRotate = value && !cameraMove; requestFrame(); },
    refreshScreen() { screenTexture.needsUpdate = true; dirty = true; requestFrame(); },
    zoom(factor) { cameraMove = null; const offset = camera.position.clone().sub(controls.target); offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)); camera.position.copy(controls.target).add(offset); controls.update(); requestFrame(); },
    focus(id) { const target = partCenter(id); const offset = camera.position.clone().sub(controls.target).normalize().multiplyScalar(['keyboard', 'ram', 'display', 'analog'].includes(id) ? 3.6 : 2.3); cameraMove = { target, position: target.clone().add(offset) }; requestFrame(); },
    dispose() { disposed = true; cancelAnimationFrame(frameId); clearTimeout(transientTimer); observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', onVisibility); controls.dispose(); clearStreams(); const geometries = new Set(), materials = new Set(replacedMaterials), textures = new Set([screenTexture]); scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); for (const material of [object.material].flat().filter(Boolean)) { materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); } }); for (const geometry of geometries) geometry.dispose(); for (const texture of textures) texture.dispose(); for (const material of materials) material.dispose(); keyLight.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss(); viewport.remove(); }
  };
}
