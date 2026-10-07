import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS, JOURNEYS } from '../src/macintosh-data.js';
import { WIDTH, HEIGHT, FRAME_BYTES, byteLocation, setPixel } from '../src/framebuffer.js';

test('every selectable Macintosh part has sourced content and valid related parts', () => {
  const expected = ['cpu', 'ram', 'rom', 'display', 'floppy', 'analog', 'via', 'scc', 'iwm', 'keyboard', 'mouse', 'sound'];
  const ids = new Set(PARTS.map(part => part.id));
  assert.equal(ids.size, PARTS.length);
  assert.deepEqual([...ids].sort(), expected.sort());
  for (const part of PARTS) {
    for (const field of ['title', 'subtitle', 'category', 'summary', 'role', 'fact']) {
      assert.equal(typeof part[field], 'string');
      assert.ok(part[field].trim(), `${part.id}.${field} must not be empty`);
    }
    assert.equal(new URL(part.source).protocol, 'https:');
    assert.ok(part.specs.length >= 2);
    assert.equal(new Set(part.specs.map(spec => spec.label)).size, part.specs.length);
    for (const spec of part.specs) assert.ok(spec.label.trim() && spec.value.trim());
    assert.ok(part.connections.length);
    assert.equal(new Set(part.connections).size, part.connections.length);
    for (const id of part.connections) {
      assert.ok(ids.has(id), `${part.id} links to an existing component`);
      assert.notEqual(id, part.id);
    }
  }
});

test('every journey step selects a real component and highlights its participants', () => {
  const ids = new Set(PARTS.map(part => part.id));
  assert.deepEqual(JOURNEYS.map(journey => journey.id), ['poweron', 'mouse', 'disk']);
  for (const journey of JOURNEYS) {
    assert.ok(journey.title && journey.description);
    assert.ok(journey.steps.length >= 4);
    for (const step of journey.steps) {
      assert.ok(ids.has(step.part));
      for (const field of ['title', 'detail', 'signal']) assert.ok(step[field].trim());
      assert.ok(step.active.includes(step.part), `${journey.id}: selected component must participate`);
      assert.equal(new Set(step.active).size, step.active.length);
      for (const id of step.active) assert.ok(ids.has(id), `${journey.id}: unknown highlighted part ${id}`);
      assert.ok(Array.isArray(step.links), `${journey.id}: transfer paths must be explicit`);
      assert.equal(new Set(step.links.map(link => link.join('→'))).size, step.links.length);
      for (const link of step.links) {
        assert.equal(link.length, 2);
        const [from, to] = link;
        assert.notEqual(from, to, 'internal activity does not need a self-connecting transfer path');
        assert.ok(step.active.includes(from) && step.active.includes(to), `${journey.id}: link endpoints must participate in the step`);
      }
    }
  }
});

test('display documentation agrees with the working bitmap model', () => {
  const display = PARTS.find(part => part.id === 'display');
  const specs = Object.fromEntries(display.specs.map(spec => [spec.label, spec.value]));
  assert.equal(specs.Resolution, `${WIDTH} × ${HEIGHT} pixels`);
  assert.equal(specs['Bitmap size'], `${FRAME_BYTES.toLocaleString('en-US')} bytes`);
  assert.equal(specs.Depth, '1 bit per pixel');
  assert.equal(WIDTH * HEIGHT / 8, FRAME_BYTES);
});

test('mouse and disk journeys retain the supporting hardware instead of inventing direct paths', () => {
  const mouse = JOURNEYS.find(journey => journey.id === 'mouse');
  const mouseParts = new Set(mouse.steps.flatMap(step => step.active));
  for (const id of ['mouse', 'scc', 'via', 'cpu', 'rom', 'ram', 'display']) assert.ok(mouseParts.has(id));
  const disk = JOURNEYS.find(journey => journey.id === 'disk');
  const diskParts = new Set(disk.steps.flatMap(step => step.active));
  for (const id of ['floppy', 'iwm', 'via', 'cpu', 'ram', 'display']) assert.ok(diskParts.has(id));
});

test('power fans out and mouse inputs follow the distinct SCC and VIA paths', () => {
  const power = JOURNEYS.find(journey => journey.id === 'poweron');
  assert.deepEqual(power.steps[0].links, [['analog', 'cpu'], ['analog', 'display'], ['analog', 'floppy']]);
  const mouse = JOURNEYS.find(journey => journey.id === 'mouse');
  assert.deepEqual(mouse.steps[0].links, [], 'mechanical conversion occurs inside the mouse');
  assert.deepEqual(mouse.steps[1].links, [['mouse', 'scc'], ['scc', 'cpu']]);
  assert.deepEqual(mouse.steps[2].links, [['mouse', 'via'], ['via', 'cpu'], ['scc', 'cpu']]);
  for (const journey of JOURNEYS) for (const step of journey.steps) {
    assert.ok(!step.links.some(([from, to]) => from === 'floppy' && to === 'display'), 'the disk does not directly drive pixels');
  }
});

test('main screen bitmap fits its documented address range in 128 KiB RAM', () => {
  const base = 0x1A700;
  const ram = new Uint8Array(128 * 1024);
  const frame = ram.subarray(base, base + FRAME_BYTES);
  assert.equal(base + FRAME_BYTES - 1, 0x1FC7F);
  setPixel(frame, 240, 160, 1);
  const { offset, mask } = byteLocation(240, 160);
  assert.equal(ram[base + offset], mask);
  setPixel(frame, 511, 341, 1);
  assert.equal(ram[0x1FC7F], 1);
  assert.equal(ram[base - 1], 0);
  assert.equal(ram[base + FRAME_BYTES], 0);
});
