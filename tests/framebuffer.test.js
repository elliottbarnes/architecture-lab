import test from 'node:test';
import assert from 'node:assert/strict';
import { WIDTH, HEIGHT, ROW_BYTES, FRAME_BYTES, createFramebuffer, byteLocation, getPixel, setPixel, togglePixel, fillRect, fillPattern, drawFramebuffer } from '../src/framebuffer.js';

test('original Macintosh screen has 175104 pixels stored in 21888 bytes', () => {
  assert.equal(WIDTH, 512); assert.equal(HEIGHT, 342); assert.equal(ROW_BYTES, 64); assert.equal(FRAME_BYTES, 21888);
  const frame = createFramebuffer();
  assert.ok(frame instanceof Uint8Array); assert.equal(frame.length, FRAME_BYTES);
  assert.ok(frame.every(byte => byte === 0));
  assert.equal(getPixel(frame, 0, 0), 0);
  assert.equal(getPixel(frame, 511, 341), 0);
});

test('byte locations use high bits at left and exactly 64 bytes per row', () => {
  assert.deepEqual(byteLocation(0, 0), { offset: 0, bit: 7, mask: 128 });
  assert.deepEqual(byteLocation(7, 0), { offset: 0, bit: 0, mask: 1 });
  assert.deepEqual(byteLocation(8, 0), { offset: 1, bit: 7, mask: 128 });
  assert.deepEqual(byteLocation(511, 0), { offset: 63, bit: 0, mask: 1 });
  assert.deepEqual(byteLocation(0, 1), { offset: 64, bit: 7, mask: 128 });
  assert.deepEqual(byteLocation(0, 341), { offset: 21824, bit: 7, mask: 128 });
  assert.deepEqual(byteLocation(511, 341), { offset: 21887, bit: 0, mask: 1 });
});

test('one byte controls eight independent pixels and pixel writes preserve neighbors', () => {
  const frame = createFramebuffer();
  frame[0] = 0b10100101;
  assert.deepEqual(Array.from({ length: 8 }, (_, x) => getPixel(frame, x, 0)), [1, 0, 1, 0, 0, 1, 0, 1]);
  assert.equal(setPixel(frame, 1, 0, 1), frame);
  assert.equal(frame[0], 0b11100101);
  setPixel(frame, 0, 0, 0);
  assert.equal(frame[0], 0b01100101);
  assert.equal(togglePixel(frame, 7, 0), 0); assert.equal(frame[0], 0b01100100);
  assert.equal(togglePixel(frame, 7, 0), 1); assert.equal(frame[0], 0b01100101);
  assert.equal(frame[1], 0);
  setPixel(frame, 511, 341, true);
  assert.equal(frame[FRAME_BYTES - 1], 1);
});

test('framebuffer can be a view into shared main RAM rather than separate storage', () => {
  const ram = new Uint8Array(128 * 1024);
  const base = 1024;
  const frame = ram.subarray(base, base + FRAME_BYTES);
  setPixel(frame, 8, 1, 1);
  assert.equal(ram[base + 65], 128);
  ram[base + 65] = 1;
  assert.equal(getPixel(frame, 15, 1), 1);
  assert.equal(getPixel(frame, 8, 1), 0);
});

test('coordinates, dimensions, frame buffers, and pixel values have explicit boundaries', () => {
  const frame = createFramebuffer();
  for (const [x, y] of [[-1, 0], [512, 0], [0, -1], [0, 342], [0.5, 0], [0, NaN], [Infinity, 0], ['1', 0]]) {
    assert.throws(() => byteLocation(x, y), RangeError);
    assert.throws(() => getPixel(frame, x, y), RangeError);
    assert.throws(() => setPixel(frame, x, y, 1), RangeError);
    assert.throws(() => togglePixel(frame, x, y), RangeError);
  }
  for (const wrong of [[], null, new Uint8Array(1), new Uint16Array(FRAME_BYTES)]) {
    assert.throws(() => getPixel(wrong, 0, 0), TypeError);
    assert.throws(() => fillPattern(wrong, 'clear'), TypeError);
  }
  for (const value of [-1, 2, NaN, '1', null]) assert.throws(() => setPixel(frame, 0, 0, value), RangeError);
  assert.throws(() => fillRect(frame, 0, 0, -1, 2), RangeError);
  assert.throws(() => fillRect(frame, 0, 0, 1.5, 2), RangeError);
});

test('filled rectangles clip cleanly at each screen edge', () => {
  const frame = createFramebuffer();
  fillRect(frame, -2, -2, 4, 4);
  assert.equal(getPixel(frame, 0, 0), 1); assert.equal(getPixel(frame, 1, 1), 1); assert.equal(getPixel(frame, 2, 1), 0);
  fillRect(frame, 511, 341, 10, 10);
  assert.equal(getPixel(frame, 511, 341), 1);
  assert.equal(getPixel(frame, 510, 341), 0);
  const prior = frame.slice();
  fillRect(frame, 600, 400, 10, 10); fillRect(frame, 0, 0, 0, 4);
  assert.deepEqual(frame, prior);
  fillRect(frame, 0, 0, 2, 2, 0); assert.equal(getPixel(frame, 1, 1), 0);
});

test('presets deterministically overwrite an existing frame and remain distinct', () => {
  const frames = new Map();
  for (const name of ['clear', 'checker', 'hello', 'desktop']) {
    const a = createFramebuffer(), b = createFramebuffer(); b.fill(255);
    assert.equal(fillPattern(a, name), a);
    fillPattern(b, name); assert.deepEqual(a, b);
    frames.set(name, a);
  }
  assert.ok(frames.get('clear').every(byte => byte === 0));
  assert.equal(frames.get('checker')[0], 0); assert.equal(frames.get('checker')[1], 255);
  assert.equal(frames.get('checker')[8 * ROW_BYTES], 255);
  assert.notDeepEqual(frames.get('hello'), frames.get('desktop'));
  assert.ok(frames.get('hello').some(byte => byte !== 0));
  assert.throws(() => fillPattern(createFramebuffer(), 'unknown'), RangeError);
});

function mockCanvas() {
  const context = {
    imageSmoothingEnabled: true,
    createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    putImageData(image, x, y) { this.image = image; this.position = [x, y]; },
  };
  return { width: 1, height: 1, style: {}, getContext: type => type === '2d' ? context : null, context };
}

test('Canvas renderer maps 0 to pale white and 1 to black without altering frame bytes', () => {
  const frame = createFramebuffer(); setPixel(frame, 0, 0, 1); setPixel(frame, 511, 341, 1);
  const prior = frame.slice(), canvas = mockCanvas();
  assert.equal(drawFramebuffer(canvas, frame), canvas);
  assert.equal(canvas.width, WIDTH); assert.equal(canvas.height, HEIGHT);
  assert.equal(canvas.style.imageRendering, 'pixelated'); assert.equal(canvas.context.imageSmoothingEnabled, false);
  const data = canvas.context.image.data;
  assert.deepEqual([...data.slice(0, 4)], [24, 24, 24, 255]);
  assert.deepEqual([...data.slice(4, 8)], [235, 235, 235, 255]);
  assert.deepEqual([...data.slice(-4)], [24, 24, 24, 255]);
  assert.deepEqual(frame, prior);
});

test('scan-row overlay inverts one visible row only and rejects invalid rows', () => {
  const frame = createFramebuffer(), canvas = mockCanvas(); setPixel(frame, 0, 1, 1);
  const prior = frame.slice(); drawFramebuffer(canvas, frame, { scanLine: 1 });
  assert.equal(canvas.context.image.data[0], 235);
  assert.equal(canvas.context.image.data[WIDTH * 4], 235);
  assert.equal(canvas.context.image.data[(WIDTH + 1) * 4], 24);
  assert.equal(canvas.context.image.data[WIDTH * 2 * 4], 235);
  assert.deepEqual(frame, prior);
  for (const scanLine of [-1, 342, 1.5, NaN]) assert.throws(() => drawFramebuffer(canvas, frame, { scanLine }), RangeError);
  assert.throws(() => drawFramebuffer({ getContext: () => null }, frame), /Canvas 2D/);
});
