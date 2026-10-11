/**
 * A byte-accurate model of the original Macintosh monochrome screen bitmap.
 * Apple, Inside Macintosh Vol. I (1984), QuickDraw Programmer's Guide, p. 12:
 * https://bitsavers.org/pdf/apple/mac/Inside_Macintosh_Vol_1_1984.pdf
 * 512 × 342 pixels; 64 bytes per row; 0 = white, 1 = black; high bits at left.
 * The real Macintosh keeps this bitmap in shared main RAM, not separate VRAM.
 * This module models bitmap storage and rendering, not CPU or video timing.
 */
export const WIDTH = 512;
export const HEIGHT = 342;
export const ROW_BYTES = WIDTH / 8;
export const FRAME_BYTES = ROW_BYTES * HEIGHT;

export function createFramebuffer() { return new Uint8Array(FRAME_BYTES); }

function requireFrame(frame) {
  if (!(frame instanceof Uint8Array) || frame.length !== FRAME_BYTES) {
    throw new TypeError(`Framebuffer must be a Uint8Array of ${FRAME_BYTES} bytes.`);
  }
}

function requireInteger(value, name) {
  if (!Number.isInteger(value)) throw new RangeError(`${name} must be an integer.`);
}

function requireBit(value) {
  if (value !== 0 && value !== 1 && value !== false && value !== true) {
    throw new RangeError('A monochrome pixel must be 0 or 1.');
  }
  return Number(value);
}

export function byteLocation(x, y) {
  requireInteger(x, 'x'); requireInteger(y, 'y');
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
    throw new RangeError(`Pixel coordinates must be inside ${WIDTH} × ${HEIGHT}.`);
  }
  const bit = 7 - (x & 7);
  return { offset: y * ROW_BYTES + (x >> 3), bit, mask: 1 << bit };
}

export function getPixel(frame, x, y) {
  requireFrame(frame);
  const { offset, mask } = byteLocation(x, y);
  return Number(Boolean(frame[offset] & mask));
}

// Mutations deliberately update the same byte array so a RAM inspector and a
// screen renderer can observe the same backing storage.
export function setPixel(frame, x, y, value) {
  requireFrame(frame);
  const bitValue = requireBit(value);
  const { offset, mask } = byteLocation(x, y);
  if (bitValue) frame[offset] |= mask;
  else frame[offset] &= ~mask;
  return frame;
}

export function togglePixel(frame, x, y) {
  requireFrame(frame);
  const { offset, mask } = byteLocation(x, y);
  frame[offset] ^= mask;
  return Number(Boolean(frame[offset] & mask));
}

/** Filled integer rectangle, clipped to the screen. Width/height may be zero. */
export function fillRect(frame, x, y, width, height, value = 1) {
  requireFrame(frame); requireBit(value);
  for (const [name, number] of Object.entries({ x, y, width, height })) requireInteger(number, name);
  if (width < 0 || height < 0) throw new RangeError('Rectangle dimensions cannot be negative.');
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(WIDTH, x + width), y1 = Math.min(HEIGHT, y + height);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const offset = py * ROW_BYTES + (px >> 3), mask = 1 << (7 - (px & 7));
      if (value) frame[offset] |= mask;
      else frame[offset] &= ~mask;
    }
  }
  return frame;
}

function outline(frame, x, y, width, height, value = 1) {
  fillRect(frame, x, y, width, 1, value);
  fillRect(frame, x, y + height - 1, width, 1, value);
  fillRect(frame, x, y, 1, height, value);
  fillRect(frame, x + width - 1, y, 1, height, value);
}

// Original, deliberately simple 5 × 7 block lettering. No system fonts, ROM,
// operating-system images, screenshots, or Apple icon assets are included.
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14], H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 25, 21, 19, 19, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14],
  2: [14, 17, 1, 2, 4, 8, 31], 3: [30, 1, 1, 14, 1, 1, 30],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 16, 30, 1, 1, 30],
  6: [14, 16, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 1, 14],
  '.': [0, 0, 0, 0, 0, 12, 12], ':': [0, 12, 12, 0, 12, 12, 0],
  '-': [0, 0, 0, 31, 0, 0, 0], '/': [1, 1, 2, 4, 8, 16, 16],
  ' ': [0, 0, 0, 0, 0, 0, 0], '!': [4, 4, 4, 4, 4, 0, 4],
  '"': [10, 10, 10, 0, 0, 0, 0], '#': [10, 10, 31, 10, 31, 10, 10],
  '$': [4, 15, 20, 14, 5, 30, 4], '%': [24, 25, 2, 4, 8, 19, 3],
  '&': [12, 18, 20, 8, 21, 18, 13], "'": [4, 4, 8, 0, 0, 0, 0],
  '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8],
  '*': [0, 21, 14, 31, 14, 21, 0], '+': [0, 4, 4, 31, 4, 4, 0],
  ',': [0, 0, 0, 0, 0, 4, 8], ';': [0, 4, 4, 0, 0, 4, 8],
  '<': [1, 2, 4, 8, 4, 2, 1], '=': [0, 0, 31, 0, 31, 0, 0],
  '>': [16, 8, 4, 2, 4, 8, 16], '?': [14, 17, 1, 2, 4, 0, 4],
  '@': [14, 17, 23, 21, 23, 16, 14], '[': [14, 8, 8, 8, 8, 8, 14],
  '\\': [16, 16, 8, 4, 2, 1, 1], ']': [14, 2, 2, 2, 2, 2, 14],
  '^': [4, 10, 17, 0, 0, 0, 0], '_': [0, 0, 0, 0, 0, 0, 31],
  '`': [8, 4, 0, 0, 0, 0, 0], '{': [3, 4, 4, 8, 4, 4, 3],
  '|': [4, 4, 4, 4, 4, 4, 4], '}': [24, 4, 4, 2, 4, 4, 24],
  '~': [0, 0, 9, 22, 0, 0, 0],
};

/**
 * Draw original 5 × 7 block glyphs, six pixels apart, clipped to the screen.
 * Printable ASCII only; lower-case letters use the corresponding capitals.
 * Only black glyph pixels are written. Clear a region first to replace text.
 */
export function drawText(frame, message, x, y, scale = 1) {
  requireFrame(frame);
  if (typeof message !== 'string') throw new TypeError('Text must be a string.');
  if (/[^\x20-\x7E]/.test(message)) throw new RangeError('Text must contain only printable ASCII characters.');
  for (const [name, value] of Object.entries({ x, y, scale })) {
    if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer.`);
  }
  if (scale < 1) throw new RangeError('Text scale must be positive.');
  for (let index = 0; index < message.length; index++) {
    const glyph = FONT[message[index].toUpperCase()];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
      if (glyph[row] & (1 << (4 - col))) fillRect(frame, x + (index * 6 + col) * scale, y + row * scale, scale, scale);
    }
  }
  return frame;
}

const text = drawText;

function desktop(frame) {
  // Dither is the same one-bit data as text, rather than a separate gray color.
  for (let y = 0; y < HEIGHT; y++) frame.fill(y % 2 ? 0x55 : 0xAA, y * ROW_BYTES, (y + 1) * ROW_BYTES);
  fillRect(frame, 0, 0, WIDTH, 20, 0);
  fillRect(frame, 0, 19, WIDTH, 1);
  text(frame, 'FILE  EDIT  VIEW  SPECIAL', 16, 7);
  // A generic, original window illustrating the era's monochrome UI language.
  fillRect(frame, 56, 57, 342, 233);
  fillRect(frame, 52, 53, 342, 233, 0);
  outline(frame, 52, 53, 342, 233);
  fillRect(frame, 53, 75, 340, 1);
  for (let y = 58; y < 72; y += 3) {
    fillRect(frame, 74, y, 44, 1); fillRect(frame, 277, y, 110, 1);
  }
  outline(frame, 60, 59, 11, 11);
  text(frame, 'ARCHITECTURE LAB', 135, 61);
  text(frame, 'HELLO.', 82, 105, 5);
  text(frame, '512 X 342 PIXELS', 83, 163, 2);
  text(frame, 'ONE BIT. ONE PIXEL.', 83, 191, 2);
  text(frame, '21888 BYTES OF SHARED RAM', 83, 231);
  text(frame, 'CHANGE A BIT. WATCH THE SCREEN.', 83, 248);
  fillRect(frame, 439, 51, 36, 36, 0); outline(frame, 439, 51, 36, 36);
  outline(frame, 445, 56, 24, 8); outline(frame, 446, 70, 22, 16);
  fillRect(frame, 434, 94, 48, 11, 0); text(frame, 'DISK', 446, 96);
  fillRect(frame, 449, 266, 26, 32, 0); outline(frame, 449, 266, 26, 32);
  fillRect(frame, 446, 264, 32, 3); fillRect(frame, 456, 260, 12, 3);
  for (let x = 455; x < 472; x += 6) fillRect(frame, x, 272, 1, 20);
  fillRect(frame, 446, 305, 31, 11, 0); text(frame, 'BIN', 453, 307);
}

/** Fill an existing frame, returning that same frame. Presets are original art. */
export function fillPattern(frame, name) {
  requireFrame(frame);
  if (!['desktop', 'checker', 'hello', 'clear'].includes(name)) throw new RangeError(`Unknown framebuffer pattern: ${name}`);
  frame.fill(0);
  if (name === 'desktop') desktop(frame);
  else if (name === 'checker') {
    for (let y = 0; y < HEIGHT; y++) for (let byte = 0; byte < ROW_BYTES; byte++) {
      frame[y * ROW_BYTES + byte] = ((byte + (y >> 3)) & 1) ? 0xFF : 0;
    }
  } else if (name === 'hello') {
    outline(frame, 20, 20, WIDTH - 40, HEIGHT - 40);
    text(frame, 'HELLO.', 116, 116, 8);
    text(frame, 'EVERY PIXEL STARTS AS A BIT.', 101, 204, 2);
    text(frame, '0 IS WHITE. 1 IS BLACK.', 125, 237, 2);
  }
  return frame;
}

/**
 * Render one source pixel per canvas pixel. CSS may enlarge the canvas; its
 * image-rendering style is set to pixelated to avoid interpolating those bits.
 * scanLine is an optional educational overlay, not a claim of real CRT timing.
 */
export function drawFramebuffer(canvas, frame, { scanLine = null } = {}) {
  requireFrame(frame);
  if (scanLine !== null && (!Number.isInteger(scanLine) || scanLine < 0 || scanLine >= HEIGHT)) {
    throw new RangeError(`scanLine must be null or a row from 0 to ${HEIGHT - 1}.`);
  }
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A Canvas 2D context is required to draw the framebuffer.');
  if (canvas.width !== WIDTH) canvas.width = WIDTH;
  if (canvas.height !== HEIGHT) canvas.height = HEIGHT;
  if (canvas.style) canvas.style.imageRendering = 'pixelated';
  context.imageSmoothingEnabled = false;
  const image = context.createImageData(WIDTH, HEIGHT);
  for (let offset = 0; offset < FRAME_BYTES; offset++) {
    const byte = frame[offset];
    for (let bit = 0; bit < 8; bit++) {
      const pixel = (offset * 8 + bit) * 4;
      const shade = byte & (0x80 >> bit) ? 24 : 235;
      image.data[pixel] = shade; image.data[pixel + 1] = shade; image.data[pixel + 2] = shade; image.data[pixel + 3] = 255;
    }
  }
  if (scanLine !== null) {
    // An inverted row remains monochrome and never changes the underlying bits.
    for (let x = 0; x < WIDTH; x++) {
      const pixel = (scanLine * WIDTH + x) * 4;
      const shade = image.data[pixel] === 24 ? 235 : 24;
      image.data[pixel] = shade; image.data[pixel + 1] = shade; image.data[pixel + 2] = shade;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
