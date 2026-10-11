import test from 'node:test';
import assert from 'node:assert/strict';
import { GENERATIONS } from '../src/machine-generations.js';
import { PARTS, JOURNEYS } from '../src/macintosh-data.js';

const model = id => GENERATIONS.find(generation => generation.id === id);
const component = (generation, id) => model(generation).parts.find(part => part.id === id);
const specs = part => Object.fromEntries(part.specs.map(({ label, value }) => [label, value]));

test('the selector describes three fixed historical configurations in date order', () => {
  assert.deepEqual(GENERATIONS.map(({ id, year }) => [id, year]), [
    ['macintosh', 1984], ['imac-g3', 1998], ['imac-m4', 2024],
  ]);
  for (const generation of GENERATIONS) {
    for (const field of ['name', 'tagline', 'processor', 'memory', 'display', 'description']) {
      assert.equal(typeof generation[field], 'string');
      assert.ok(generation[field].trim(), `${generation.id}.${field} needs explanatory content`);
    }
    assert.equal(new URL(generation.source).protocol, 'https:');
  }
  assert.equal(model('macintosh').parts, PARTS, 'the original machine keeps its researched data');
  assert.equal(model('macintosh').journeys, JOURNEYS);
  assert.equal(model('imac-g3').source, 'https://support.apple.com/en-us/112281');
  assert.equal(model('imac-m4').source, 'https://support.apple.com/en-us/121556');
  assert.match(model('imac-g3').description, /original 1998 launch configuration/);
  assert.match(model('imac-m4').description, /2024 two-port base configuration/);
});

test('each later machine has its own selectable hardware and primary references', () => {
  const common = ['cpu', 'ram', 'gpu', 'storage', 'display', 'io', 'analog', 'sound', 'keyboard', 'mouse'];
  const allowedSourceHosts = new Set(['support.apple.com', 'developer.apple.com', 'www.wap.org']);
  for (const generation of GENERATIONS.slice(1)) {
    const ids = new Set(generation.parts.map(part => part.id));
    assert.equal(ids.size, generation.parts.length);
    assert.deepEqual([...ids].sort(), [...common, generation.id === 'imac-g3' ? 'optical' : 'camera'].sort());
    for (const part of generation.parts) {
      for (const field of ['title', 'subtitle', 'category', 'summary', 'role', 'fact']) {
        assert.equal(typeof part[field], 'string');
        assert.ok(part[field].trim(), `${generation.id}.${part.id}.${field} is empty`);
      }
      const url = new URL(part.source);
      assert.equal(url.protocol, 'https:');
      assert.ok(allowedSourceHosts.has(url.hostname));
      if (url.hostname === 'www.wap.org') assert.equal(url.pathname, '/events/iMacDevNote.pdf');
      assert.ok(part.specs.length >= 2);
      assert.equal(new Set(part.specs.map(spec => spec.label)).size, part.specs.length);
      for (const spec of part.specs) assert.ok(spec.label.trim() && spec.value.trim());
      assert.ok(part.connections.length);
      assert.equal(new Set(part.connections).size, part.connections.length);
      for (const id of part.connections) {
        assert.ok(ids.has(id), `${generation.id}.${part.id} has an unknown related component: ${id}`);
        assert.notEqual(id, part.id);
      }
    }
    assert.doesNotMatch(JSON.stringify(generation), /68000|6522|8530|\bIWM\b|128 KiB|512 × 342|0x1A700/, 'later machines must not inherit the original Macintosh component descriptions');
  }
});

test('each journey explicitly links valid participants within the selected machine', () => {
  for (const generation of GENERATIONS) {
    const parts = new Map(generation.parts.map(part => [part.id, part]));
    assert.equal(new Set(generation.journeys.map(journey => journey.id)).size, generation.journeys.length);
    for (const journey of generation.journeys) {
      assert.ok(journey.title.trim() && journey.description.trim());
      assert.ok(journey.steps.length >= 4);
      for (const step of journey.steps) {
        assert.ok(parts.has(step.part));
        assert.ok(step.active.includes(step.part));
        assert.equal(new Set(step.active).size, step.active.length);
        for (const field of ['title', 'detail', 'signal']) assert.ok(step[field].trim());
        for (const id of step.active) assert.ok(parts.has(id), `${generation.id}/${journey.id} highlights an unknown component`);
        assert.ok(Array.isArray(step.links), 'paths must not be invented by chaining the highlight list');
        assert.equal(new Set(step.links.map(link => link.join('→'))).size, step.links.length);
        for (const link of step.links) {
          assert.equal(link.length, 2);
          const [from, to] = link;
          assert.notEqual(from, to);
          assert.ok(step.active.includes(from) && step.active.includes(to), 'both ends of a path must be active');
        }
      }
    }
  }
  for (const generation of GENERATIONS.slice(1)) {
    assert.deepEqual(generation.journeys.map(journey => journey.id), ['input', 'picture']);
    const paths = generation.journeys.flatMap(journey => journey.steps.flatMap(step => step.links));
    assert.ok(paths.some(([from, to]) => from === 'mouse' && ['keyboard', 'io'].includes(to)));
    assert.ok(!paths.some(([from, to]) => from === 'storage' && to === 'display'), 'saved files must be interpreted before display');
  }
});

test('launch G3 specifications keep system memory, video memory, and color-depth limits distinct', () => {
  assert.equal(specs(component('imac-g3', 'cpu')).Clock, '233 MHz');
  assert.equal(specs(component('imac-g3', 'ram'))['Standard capacity'], '32 MB');
  assert.equal(specs(component('imac-g3', 'gpu'))['Video memory'], '2 MB SGRAM');
  assert.match(component('imac-g3', 'gpu').title, /Rage IIc/);
  assert.equal(specs(component('imac-g3', 'storage')).Capacity, '4 GB');
  assert.equal(specs(component('imac-g3', 'display'))['Maximum mode'], '1024 × 768 pixels');
  assert.equal(specs(component('imac-g3', 'display'))['Stock color at 1024 × 768'], '16-bit');
  assert.match(component('imac-g3', 'ram').role, /distinct from the video memory/);
  const input = model('imac-g3').journeys.find(journey => journey.id === 'input');
  assert.deepEqual(input.steps[0].links, [['mouse', 'keyboard'], ['keyboard', 'io']]);
  assert.ok(input.steps.at(-1).links.some(([from, to]) => from === 'gpu' && to === 'display'));
});

test('the two-port M4 baseline keeps integrated engines and shared memory explicit', () => {
  assert.equal(specs(component('imac-m4', 'cpu'))['CPU cores'], '8 total');
  assert.equal(specs(component('imac-m4', 'gpu'))['GPU cores'], '8');
  assert.equal(specs(component('imac-m4', 'ram'))['Base capacity'], '16 GB');
  assert.equal(specs(component('imac-m4', 'storage'))['Base capacity'], '256 GB');
  assert.equal(specs(component('imac-m4', 'display'))['Native resolution'], '4480 × 2520 pixels');
  assert.equal(specs(component('imac-m4', 'io'))['Rear ports'], '2 Thunderbolt / USB 4');
  assert.match(component('imac-m4', 'cpu').role, /same M4 chip/);
  assert.match(component('imac-m4', 'ram').role, /same physical memory pool/);
  assert.match(component('imac-m4', 'ram').fact, /storage mode/);
  assert.match(component('imac-m4', 'io').fact, /Ethernet is an option/);
  assert.match(component('imac-m4', 'keyboard').fact, /does not include Touch ID/);
  const paths = model('imac-m4').journeys.flatMap(journey => journey.steps.flatMap(step => step.links));
  assert.ok(paths.some(([from, to]) => from === 'ram' && to === 'gpu'));
  assert.ok(paths.some(([from, to]) => from === 'gpu' && to === 'ram'));
});
