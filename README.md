# Architecture Lab

Open a Macintosh. Follow what happens inside.

An interactive 3D exploration of computer architecture across three generations: the original Macintosh 128K, the Bondi-blue iMac G3, and the 2024 iMac M4. Rotate the machines, take them apart, inspect their components, and trace how input becomes a picture.

[Open the lab](https://elliottbarnes.github.io/architecture-lab/) · [How it works & sources](docs/architecture.md)

## Three machines

| Model | Processor | Working memory | Display |
| --- | --- | --- | --- |
| Macintosh 128K · 1984 | Motorola 68000 · 7.8336 MHz | 128 KiB shared RAM | 9-inch monochrome CRT · 512 × 342 |
| iMac G3 · 1998 launch model | PowerPC G3 · 233 MHz | 32 MB SDRAM; separate 2 MB video memory | 15-inch color CRT · up to 1024 × 768 |
| iMac M4 · 2024 two-port base model | 8-core CPU / 8-core GPU | 16 GB unified memory | 24-inch Retina · 4480 × 2520 |

These are fixed historical configurations. The G3 has a 4 GB hard disk and CD-ROM drive; the M4 has a 256 GB SSD. The M4 entry does not track whichever iMac Apple currently sells. [Hardware details and primary sources](docs/architecture.md).

## Explore

- **Meet the parts:** drag to rotate, scroll or pinch to zoom, and use the assembly slider to separate the machine. Toggle labels and See through, choose a camera view, or select a part to inspect its job and references.
- **Try the hardware:** move a cursor, draw a short message, or load an original sample picture. These working studies connect input and storage concepts to visible changes in the app’s bitmap.
- **Follow a signal:** step through model-specific input, storage, and drawing journeys. Arrows show functional relationships, with manual controls and Play/Pause.
- **Make a picture:** return to the **1984 pixel lab** to edit the full 512 × 342 monochrome screen through a magnified patch, byte bits, and RAM addresses.

The newer machines show the original bitmap study inside an illustrative color screen. That study is not their native framebuffer format, resolution, or memory map. The dedicated pixel lab always uses the Macintosh 128K model.

On the focused 3D view, arrow keys rotate, `+` / `−` zoom, and Home restores the overview. In the pixel lab, click the preview to move the magnifier; its arrow keys move the patch by eight pixels. The magnified editor’s arrow keys select a pixel, and Space or Enter flips its bit. **Undo** restores up to 40 bitmap changes, including typing, sample reads, presets, and resets. Edits last for the current page session.

The machines use original procedural geometry with simplified placement and proportions. They are educational models, not service drawings. The app does not execute Macintosh CPU instructions, boot Apple ROMs, or run an operating system; signal animation speed does not represent hardware timing.

## Run locally

Use Node.js 22 or newer. Install the exact dependencies from the lockfile first:

```sh
npm ci
npm run dev
npm test
npm run build
```

The development command builds the site, then serves `dist/` on `http://127.0.0.1:4173`. It does not watch source files: run `npm run build` after edits, then reload the browser. The build bundles Three.js and the application into a browser module and copies the local styles and artwork. The resulting static files work under a GitHub Pages project path and make no CDN requests for runtime dependencies.

The 3D view requires WebGL 2. If it is unavailable, component explanations and the pixel lab remain accessible; the original Macintosh also has an illustrated fallback.

[Source on GitHub](https://github.com/elliottbarnes/architecture-lab) · MIT licensed.
