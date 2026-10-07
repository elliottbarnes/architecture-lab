# Architecture Lab · Macintosh 128K

Open the original Macintosh and follow the hardware behind the picture.

An interactive visual exploration of the 1984 Macintosh 128K: an illustrated cutaway, selectable components, guided signal journeys, and an editable monochrome framebuffer.

[Open the lab](https://elliottbarnes.github.io/architecture-lab/) · [How it works & sources](docs/architecture.md)

## Explore

- **Explore the machine:** open the enclosure, select parts, and inspect their roles and connections.
- **Follow a signal:** step through startup, a mouse-driven drawing operation, or a disk read.
- **Pixels to picture:** move and edit a magnified patch of a 512 × 342, one-bit screen, inspect its RAM addresses, and see how stored bytes become pixels.

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
