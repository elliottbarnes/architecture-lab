import { macintoshScene } from './macintosh-scene.js';
import { PARTS, JOURNEYS } from './macintosh-data.js';
import { WIDTH, HEIGHT, FRAME_BYTES, getPixel, togglePixel, byteLocation, fillPattern, drawFramebuffer } from './framebuffer.js';

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const hex = (value, width = 4) => value.toString(16).toUpperCase().padStart(width, '0');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const visited = new Set();
const edits = [];
const HISTORY_LIMIT = 40;
let selected = PARTS.some(part => part.id === location.hash.slice(1)) ? location.hash.slice(1) : 'cpu';
let mode = 'explore', isOpen = true, screenOn = true;
let journey = JOURNEYS[0], step = 0, timer = null;
let patchX = 240, patchY = 160, pixelX = 0, pixelY = 0, currentPattern = 'desktop';
let openTimer, resizeTimer;
const ram = new Uint8Array(128 * 1024);
const screenBase = 0x1A700;
const frame = ram.subarray(screenBase, screenBase + FRAME_BYTES);
fillPattern(frame, 'desktop');

$('mac-scene').innerHTML = macintoshScene();
$('part-select').innerHTML = PARTS.map(part => `<option value="${part.id}">${escapeHTML(part.title)}</option>`).join('');
$('component-rail').innerHTML = PARTS.map((part, index) => `<button type="button" data-select="${part.id}" data-visited="false" aria-pressed="false"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHTML(part.title)}</button>`).join('');
const customOption = document.createElement('option');
customOption.value = 'custom'; customOption.textContent = 'Custom edits'; customOption.disabled = true;
$('screen-pattern').append(customOption);

function rememberFocus(container) {
  const active = document.activeElement;
  if (!container.contains(active)) return null;
  if (active.id) return { id: active.id };
  for (const attribute of ['data-journey', 'data-step', 'data-bit']) {
    if (active.hasAttribute(attribute)) return { attribute, value: active.getAttribute(attribute) };
  }
  return null;
}
function restoreFocus(container, key) {
  if (!key) return;
  let target = key.id ? $(key.id) : [...container.querySelectorAll(`[${key.attribute}]`)].find(element => element.getAttribute(key.attribute) === key.value);
  if (target?.disabled && key.id === 'story-prev') target = $('story-next');
  if (target && !target.disabled && container.contains(target)) target.focus({ preventScroll: true });
}
function updateProgress() {
  if ($('explore-progress')) $('explore-progress').textContent = `${visited.size} / ${PARTS.length} parts explored`;
  document.querySelectorAll('[data-select]').forEach(button => {
    button.dataset.visited = String(visited.has(button.dataset.select));
    button.setAttribute('aria-pressed', String(button.dataset.select === selected));
  });
}
function partAction(part) {
  if (['ram', 'display', 'sound'].includes(part.id)) return { label: 'Turn memory into pixels →', pixels: true };
  if (['mouse', 'scc', 'via', 'keyboard'].includes(part.id)) return { label: 'Follow mouse input →', journey: 'mouse' };
  if (['floppy', 'iwm'].includes(part.id)) return { label: 'Follow a disk read →', journey: 'disk' };
  return { label: 'Follow the startup sequence →', journey: 'poweron' };
}
function selectPart(id, { updateHash = true, markVisited = true } = {}) {
  const part = PARTS.find(candidate => candidate.id === id);
  if (!part) return;
  selected = id;
  if (markVisited) visited.add(id);
  if (!isOpen && !['display', 'floppy', 'keyboard', 'mouse'].includes(id)) setOpen(true);
  document.querySelectorAll('[data-part]').forEach(element => {
    element.classList.toggle('selected', element.dataset.part === id);
    element.setAttribute('aria-pressed', String(element.dataset.part === id));
  });
  updateProgress();
  $('part-select').value = id;
  $('part-position').textContent = `${String(PARTS.indexOf(part) + 1).padStart(2, '0')} / ${PARTS.length}`;
  const action = partAction(part);
  $('part-detail').innerHTML = `<p class="eyebrow accent part-category">${escapeHTML(part.category)}</p><h2>${escapeHTML(part.title)}</h2><p class="part-subtitle">${escapeHTML(part.subtitle)}</p><p class="part-summary">${escapeHTML(part.summary)}</p><dl class="part-specs">${part.specs.map(spec => `<div><dt>${escapeHTML(spec.label)}</dt><dd>${escapeHTML(spec.value)}</dd></div>`).join('')}</dl><button type="button" class="button primary part-action" id="part-action">${escapeHTML(action.label)}</button><details class="architecture-details"><summary>Architecture notes</summary><p class="part-role">${escapeHTML(part.role)}</p><div class="part-fact"><span class="eyebrow">Look a little closer</span><p>${escapeHTML(part.fact)}</p></div><h3 class="connections-title">Connected to</h3><div class="connections">${part.connections.map(connection => `<button type="button" data-connect="${connection}">${escapeHTML(PARTS.find(candidate => candidate.id === connection)?.title || connection)} <span>↗</span></button>`).join('')}</div><a class="source-link" href="${escapeHTML(part.source)}" target="_blank" rel="noopener">Original technical reference ↗</a></details>`;
  $('part-detail').querySelectorAll('[data-connect]').forEach(button => button.addEventListener('click', () => activatePart(button.dataset.connect)));
  $('part-action').addEventListener('click', () => {
    if (action.pixels) {
      setMode('pixels');
      ($('screen-preview') || $('pixel-editor')).focus({ preventScroll: true });
    } else {
      startJourney(action.journey);
      $('story-play').focus({ preventScroll: true });
    }
    showExhibit();
  });
  if (updateHash) history.replaceState(null, '', '#' + id);
}
function activatePart(id, options) {
  // A deliberate component selection ends a guided story and opens its inspector.
  if (mode !== 'explore') setMode('explore');
  selectPart(id, options);
}
$('mac-scene').querySelectorAll('[data-part]').forEach(element => {
  element.addEventListener('click', event => { event.stopPropagation(); activatePart(element.dataset.part); });
  element.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); event.stopPropagation(); activatePart(element.dataset.part);
    }
  });
});
$('component-rail').querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => activatePart(button.dataset.select)));
$('part-select').addEventListener('change', event => activatePart(event.target.value));

function setOpen(open) {
  isOpen = open;
  $('mac-scene').classList.toggle('is-open', open);
  $('case-open').setAttribute('aria-pressed', String(open));
  $('case-closed').setAttribute('aria-pressed', String(!open));
  $('mac-scene').querySelector('svg').setAttribute('viewBox', '0 0 900 690');
  clearTimeout(openTimer);
  openTimer = setTimeout(() => { if (mode === 'signals') renderStory(); }, reducedMotion ? 0 : 850);
}
$('case-open').addEventListener('click', () => setOpen(true));
$('case-closed').addEventListener('click', () => setOpen(false));
$('labels-toggle').addEventListener('click', () => {
  const hidden = $('mac-scene').classList.toggle('hide-labels');
  $('labels-toggle').setAttribute('aria-pressed', String(!hidden));
  $('labels-toggle').querySelector('span').textContent = hidden ? 'off' : 'on';
});
$('power-toggle').addEventListener('click', () => {
  screenOn = !screenOn;
  $('power-toggle').setAttribute('aria-pressed', String(screenOn));
  $('power-toggle').innerHTML = `<span class="status-dot"></span> Screen ${screenOn ? 'on' : 'off'}`;
  drawScreen();
});
function drawScreen() {
  for (const id of ['mac-screen', 'mac-screen-open']) {
    const canvas = $(id);
    if (!canvas) continue;
    if (screenOn) drawFramebuffer(canvas, frame);
    else {
      const context = canvas.getContext('2d');
      context.fillStyle = '#18201d'; context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
}
function zoomPart() {
  const svg = $('mac-scene').querySelector('svg');
  const matches = [...svg.querySelectorAll(`[data-part="${selected}"]`)];
  const element = (isOpen ? matches : matches.filter(candidate => !candidate.closest('.mac-crt,.mac-drive,.mac-logic,.mac-analog')))[0];
  if (!element) return;
  svg.setAttribute('viewBox', '0 0 900 690');
  const rect = element.getBoundingClientRect(), matrix = svg.getScreenCTM();
  if (!matrix) return;
  const inverse = matrix.inverse();
  const a = new DOMPoint(rect.left, rect.top).matrixTransform(inverse), b = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);
  const width = Math.max(250, b.x - a.x + 100), height = Math.max(192, b.y - a.y + 100);
  const fittedWidth = Math.max(width, height * 900 / 690), fittedHeight = fittedWidth * 690 / 900;
  svg.setAttribute('viewBox', `${(a.x + b.x - fittedWidth) / 2} ${(a.y + b.y - fittedHeight) / 2} ${fittedWidth} ${fittedHeight}`);
  if (mode === 'signals') renderStory();
}
$('zoom-part').addEventListener('click', zoomPart);
$('zoom-reset').addEventListener('click', () => {
  $('mac-scene').querySelector('svg').setAttribute('viewBox', '0 0 900 690');
  if (mode === 'signals') renderStory();
});
function stop() { clearInterval(timer); timer = null; }
function setMode(next) {
  if (!['explore', 'signals', 'pixels'].includes(next)) return;
  stop(); mode = next;
  $('case-closed').disabled = mode === 'signals';
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('signal-story').hidden = mode !== 'signals';
  $('pixel-lab').hidden = mode !== 'pixels';
  if ($('component-inspector')) $('component-inspector').hidden = mode !== 'explore';
  if ($('exhibit-body')) $('exhibit-body').hidden = mode === 'pixels';
  $('component-rail').hidden = mode === 'pixels';
  $('mode-note').textContent = { explore: 'SELECT A PART TO LOOK INSIDE', signals: 'FOLLOW THE WORK, ONE STEP AT A TIME', pixels: 'EDIT MEMORY. SEE THE PICTURE CHANGE.' }[mode];
  $('scene-caption').textContent = { explore: 'Select a component to inspect it. Open the case to reveal the architecture.', signals: 'Highlighted parts work together in this step. Select a part to return to Explore.', pixels: 'A 512 × 342 bitmap in the Macintosh’s shared RAM.' }[mode];
  clearActivity();
  if (mode === 'signals') { setOpen(true); renderStory({ restore: false }); }
  if (mode === 'pixels') { selectPart('display'); renderPatch(); }
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
function showExhibit() { $('explore').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' }); }
$('quick-pixels')?.addEventListener('click', () => { setMode('pixels'); showExhibit(); });
$('quick-signals')?.addEventListener('click', () => { startJourney('poweron'); showExhibit(); });
function startJourney(id) {
  journey = JOURNEYS.find(candidate => candidate.id === id) || JOURNEYS[0];
  step = 0; setMode('signals');
}
function clearActivity() {
  document.querySelectorAll('[data-part]').forEach(element => element.classList.remove('path-active'));
  $('mac-scene').querySelector('.signal-overlay')?.remove();
}
function renderStory({ restore = true } = {}) {
  if (mode !== 'signals') return;
  const host = $('signal-story'), focused = restore ? rememberFocus(host) : null;
  const current = journey.steps[step], atEnd = step === journey.steps.length - 1;
  host.innerHTML = `<div class="story-intro"><p class="eyebrow accent">Follow a signal</p><p>${escapeHTML(journey.description)}</p></div><div class="journey-options" aria-label="Choose a signal story">${JOURNEYS.map(candidate => `<button type="button" data-journey="${candidate.id}" aria-pressed="${candidate.id === journey.id}">${escapeHTML(candidate.title)}</button>`).join('')}</div><div class="story-card"><div class="story-number">${String(step + 1).padStart(2, '0')}<span>/ ${String(journey.steps.length).padStart(2, '0')}</span></div><div><span class="eyebrow">${escapeHTML(current.signal)}</span><h3>${escapeHTML(current.title)}</h3><p>${escapeHTML(current.detail)}</p></div></div><div class="story-bottom"><div class="story-steps" aria-label="Signal story steps">${journey.steps.map((item, index) => `<button type="button" data-step="${index}" class="${index === step ? 'active' : ''}" aria-label="Step ${index + 1}: ${escapeHTML(item.title)}" ${index === step ? 'aria-current="step"' : ''}>${index + 1}</button>`).join('')}</div><div class="story-controls"><button class="button" type="button" id="story-prev" ${step === 0 ? 'disabled' : ''}>← Back</button><button class="button primary" type="button" id="story-play">${timer ? 'Ⅱ Pause' : atEnd ? '▶ Replay' : '▶ Play'}</button><button class="button" type="button" id="story-next">${atEnd ? 'Restart ↺' : 'Next →'}</button></div></div>${atEnd ? '<p class="story-complete" role="status">Journey complete. Restart it, choose another story, or select a component to explore.</p>' : ''}<p class="story-caveat">Conceptual stages, not bus timing. Click any component to pause the story and inspect it.</p>`;
  host.querySelectorAll('[data-journey]').forEach(button => button.addEventListener('click', () => {
    stop(); journey = JOURNEYS.find(candidate => candidate.id === button.dataset.journey); step = 0; renderStory();
  }));
  host.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => { stop(); step = Number(button.dataset.step); renderStory(); }));
  $('story-prev').addEventListener('click', () => { stop(); step = Math.max(0, step - 1); renderStory(); });
  $('story-next').addEventListener('click', () => { stop(); step = atEnd ? 0 : step + 1; renderStory(); });
  $('story-play').addEventListener('click', () => {
    if (timer) { stop(); renderStory(); return; }
    if (atEnd) step = 0;
    timer = setInterval(() => {
      step = Math.min(step + 1, journey.steps.length - 1);
      if (step === journey.steps.length - 1) stop();
      renderStory();
    }, 4500);
    renderStory();
  });
  clearActivity();
  current.active.forEach(id => $('mac-scene').querySelectorAll(`[data-part="${id}"]`).forEach(element => element.classList.add('path-active')));
  selectPart(current.part, { updateHash: false, markVisited: false });
  const svg = $('mac-scene').querySelector('svg');
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  overlay.setAttribute('class', 'signal-overlay'); overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<defs><marker id="signal-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#087ca7"/></marker></defs>';
  const matrix = svg.getScreenCTM();
  const center = id => {
    const element = $('mac-scene').querySelector(`[data-part="${id}"]`);
    if (!element || !matrix) return null;
    const rect = element.getBoundingClientRect();
    return new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).matrixTransform(matrix.inverse());
  };
  for (const [from, to] of current.links || []) {
    const a = center(from), b = center(to);
    if (!a || !b) continue;
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', `M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 35} ${b.x},${b.y}`);
    path.setAttribute('marker-end', 'url(#signal-arrow)'); overlay.append(path);
  }
  if (current.links?.length) svg.append(overlay);
  restoreFocus(host, focused);
}

function setEditStatus(message) { if ($('edit-status')) $('edit-status').textContent = message; }
function updateUndo() { if ($('pixel-undo')) $('pixel-undo').disabled = edits.length === 0; }
function recordEdit(message, mutate, pattern = 'custom') {
  const previous = { bytes: frame.slice(), pattern: currentPattern, patchX, patchY, pixelX, pixelY };
  mutate();
  const changed = frame.some((value, index) => value !== previous.bytes[index]);
  currentPattern = pattern; $('screen-pattern').value = pattern;
  if (changed) { edits.push(previous); if (edits.length > HISTORY_LIMIT) edits.shift(); }
  updateUndo(); renderPatch(); drawScreen();
  setEditStatus(changed ? message : 'The bitmap already matches this pattern.');
}
function movePatch(x, y) {
  patchX = Math.max(0, Math.min(480, Math.floor(x / 8) * 8));
  patchY = Math.max(0, Math.min(326, Math.floor(y)));
  $('patch-x').value = patchX; $('patch-y').value = patchY;
  $('patch-x').setAttribute('aria-invalid', 'false'); $('patch-y').setAttribute('aria-invalid', 'false');
  $('patch-error').textContent = '';
  renderPatch();
}
function drawPreview() {
  const canvas = $('screen-preview');
  if (!canvas) return;
  drawFramebuffer(canvas, frame);
  const context = canvas.getContext('2d');
  context.save();
  context.strokeStyle = '#ffffff'; context.lineWidth = 4;
  context.strokeRect(patchX + 0.5, patchY + 0.5, 31, 15);
  context.strokeStyle = '#91419f'; context.lineWidth = 2;
  context.strokeRect(patchX + 0.5, patchY + 0.5, 31, 15);
  context.restore();
}
function renderPatch() {
  const canvas = $('pixel-editor'), context = canvas.getContext('2d'), size = 20;
  const focused = rememberFocus($('byte-buttons'));
  context.clearRect(0, 0, 640, 320);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
    context.fillStyle = getPixel(frame, patchX + x, patchY + y) ? '#252a27' : '#f6f4ea';
    context.fillRect(x * size, y * size, size - 1, size - 1);
  }
  context.strokeStyle = '#91419f'; context.lineWidth = 3;
  context.strokeRect(pixelX * size + 1.5, pixelY * size + 1.5, size - 4, size - 4);
  const x = patchX + pixelX, y = patchY + pixelY;
  const { offset, bit } = byteLocation(x, y), value = frame[offset];
  $('patch-caption').textContent = `X ${patchX}–${patchX + 31} / Y ${patchY}–${patchY + 15}`;
  $('pixel-position').textContent = `PIXEL (${x}, ${y})`;
  $('byte-offset').textContent = `RAM $${hex(screenBase + offset, 5)}`;
  $('byte-buttons').innerHTML = Array.from({ length: 8 }, (_, index) => 7 - index).map(number => `<button type="button" data-bit="${number}" aria-label="Screen byte bit ${number}: ${value & (1 << number) ? 'black' : 'white'}. Toggle bit." aria-pressed="${Boolean(value & (1 << number))}" class="${number === bit ? 'selected' : ''}"><span>b${number}</span><strong>${Number(Boolean(value & (1 << number)))}</strong></button>`).join('');
  $('byte-value').textContent = `${value.toString(2).padStart(8, '0')} = $${hex(value, 2)}`;
  $('byte-buttons').querySelectorAll('[data-bit]').forEach(button => button.addEventListener('click', () => {
    const number = Number(button.dataset.bit);
    pixelX = (pixelX & ~7) + 7 - number;
    const state = value & (1 << number) ? 'white (0)' : 'black (1)';
    recordEdit(`Bit ${number} is now ${state}. One byte in shared RAM changed.`, () => { frame[offset] ^= 1 << number; });
  }));
  drawPreview(); updateUndo(); restoreFocus($('byte-buttons'), focused);
  if ($('memory-meter')) $('memory-meter').textContent = `${FRAME_BYTES.toLocaleString('en-US')} of ${ram.length.toLocaleString('en-US')} bytes · ${(100 * FRAME_BYTES / ram.length).toFixed(1)}% of shared RAM`;
}
function flipSelectedPixel() {
  const x = patchX + pixelX, y = patchY + pixelY;
  const next = getPixel(frame, x, y) ? 'white (0)' : 'black (1)';
  recordEdit(`Pixel (${x}, ${y}) is now ${next}. Its bit changed in shared RAM.`, () => togglePixel(frame, x, y));
}
$('pixel-editor').addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect();
  pixelX = Math.max(0, Math.min(31, Math.floor((event.clientX - rect.left) / rect.width * 32)));
  pixelY = Math.max(0, Math.min(15, Math.floor((event.clientY - rect.top) / rect.height * 16)));
  flipSelectedPixel();
});
$('pixel-editor').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === ' ' || event.key === 'Enter') { flipSelectedPixel(); return; }
  if (event.key === 'ArrowLeft') pixelX = Math.max(0, pixelX - 1);
  if (event.key === 'ArrowRight') pixelX = Math.min(31, pixelX + 1);
  if (event.key === 'ArrowUp') pixelY = Math.max(0, pixelY - 1);
  if (event.key === 'ArrowDown') pixelY = Math.min(15, pixelY + 1);
  renderPatch();
});
$('screen-preview')?.addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / rect.width * WIDTH);
  const y = Math.floor((event.clientY - rect.top) / rect.height * HEIGHT);
  movePatch(x - 16, y - 8);
  setEditStatus(`Magnifying X ${patchX}–${patchX + 31}, Y ${patchY}–${patchY + 15}. The bitmap is unchanged.`);
});
$('screen-preview')?.addEventListener('keydown', event => {
  const offsets = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
  if (!offsets[event.key]) return;
  event.preventDefault();
  const [x, y] = offsets[event.key]; movePatch(patchX + x, patchY + y);
  setEditStatus(`Magnifying X ${patchX}–${patchX + 31}, Y ${patchY}–${patchY + 15}.`);
});
$('move-patch').addEventListener('click', () => {
  const x = $('patch-x').valueAsNumber, y = $('patch-y').valueAsNumber;
  const validX = Number.isInteger(x) && x >= 0 && x <= 480 && x % 8 === 0;
  const validY = Number.isInteger(y) && y >= 0 && y <= 326;
  $('patch-x').setAttribute('aria-invalid', String(!validX)); $('patch-y').setAttribute('aria-invalid', String(!validY));
  if (!validX || !validY) { $('patch-error').textContent = 'Use X from 0 to 480 in steps of 8, and a whole Y from 0 to 326.'; return; }
  movePatch(x, y); setEditStatus(`Moved the magnifier to (${patchX}, ${patchY}). The bitmap is unchanged.`);
});
$('screen-pattern').addEventListener('change', event => {
  const pattern = event.target.value;
  if (!['desktop', 'hello', 'checker', 'clear'].includes(pattern)) return;
  recordEdit(`Loaded ${event.target.selectedOptions[0].textContent.toLowerCase()}. Undo restores the previous bitmap.`, () => fillPattern(frame, pattern), pattern);
});
$('pixel-reset')?.addEventListener('click', () => recordEdit('Restored the desktop bitmap. Undo brings back your edits.', () => fillPattern(frame, 'desktop'), 'desktop'));
$('pixel-undo')?.addEventListener('click', () => {
  const previous = edits.pop();
  if (!previous) return;
  frame.set(previous.bytes); currentPattern = previous.pattern; $('screen-pattern').value = currentPattern;
  pixelX = previous.pixelX; pixelY = previous.pixelY; movePatch(previous.patchX, previous.patchY);
  drawScreen(); updateUndo(); setEditStatus(`Undid the last bitmap change.${edits.length ? ` ${edits.length} earlier ${edits.length === 1 ? 'change' : 'changes'} can still be undone.` : ''}`);
});
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (PARTS.some(part => part.id === id)) activatePart(id, { updateHash: false });
});
function pauseForBackground() {
  if (!timer) return;
  stop();
  if (mode === 'signals') renderStory({ restore: false });
}
window.addEventListener('blur', pauseForBackground);
window.addEventListener('pagehide', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseForBackground(); });
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (mode === 'signals') renderStory(); }, 150);
});
selectPart(selected, { updateHash: false });
drawScreen(); renderPatch();
setEditStatus('Click the screen to choose a region. Click a magnified square to change its bit.');
