# Architecture Lab · Macintosh 128K

Open the original Macintosh and follow the hardware behind the picture.

An interactive visual exploration of the 1984 Macintosh 128K: an illustrated cutaway, selectable components, guided signal journeys, and an editable monochrome framebuffer.

[Open the lab](https://elliottbarnes.github.io/architecture-lab/) · [How it works & sources](docs/architecture.md)

## Explore

- **Meet the parts:** open the enclosure, select parts, and inspect concise specifications. Expand Architecture notes for roles, connections, and original references. The component rail tracks parts explored during the current page session.
- **Follow a signal:** step through startup, a mouse-driven drawing operation, or a disk read beside the illustrated machine. Select a component to stop the story and inspect it.
- **Make a picture:** work with the full 512 × 342 screen and a magnified editable patch in one view. Change pixels or their byte bits, inspect RAM addresses, and undo your experiments.

Click the screen preview to move the magnifier; its arrow keys move the patch by eight pixels. In the magnified editor, arrow keys select one pixel and Space or Enter flips its bit. The eight byte buttons provide another way to edit. **Undo** restores up to 40 bitmap changes, including presets and resets; **Reset** restores the original desktop study. Manual patch coordinates accept X in multiples of eight and any valid whole Y.

Signal stories support manual steps and Play/Pause. Playback stops when the page is hidden or the window loses focus; finished stories offer Restart and Replay.

The hardware descriptions use Apple’s original documentation and Motorola’s processor manual. The illustrations and screen artwork are original. This is an explanatory model, not a Macintosh emulator: it does not run 68000 instructions, Apple ROMs, or system software.

## Run locally

Use Node.js 22 or newer. No package installation is required.

```sh
npm run dev
npm test
npm run build
```

The development command prints a local URL. The build produces a static site in `dist/`, suitable for GitHub Pages. Browser-native JavaScript modules provide the interactions without runtime dependencies.

## The machine

Motorola 68000 at 7.8336 MHz · 128 KiB RAM · 64 KiB ROM · 400K floppy drive · 9-inch monochrome CRT.

The original Macintosh shares main RAM with its display circuitry. It has no CPU cache or MMU. Signal animations show relationships at a readable pace; they do not reproduce electrical timing or every circuit connection. [See the model’s boundaries and primary references](docs/architecture.md).

[Source on GitHub](https://github.com/elliottbarnes/architecture-lab) · MIT licensed.
