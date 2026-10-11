# Inside three generations of Macintosh

Architecture Lab uses three selectable machines to explain how processors, memory, storage, input, and displays cooperate. Each selection has its own component descriptions and guided signal journeys. The configurations are deliberately fixed: the 1984 Macintosh 128K, the original 1998 Bondi-blue iMac G3, and the 2024 two-port base iMac M4.

The geometry is created procedurally in Three.js, with actual perspective, lighting, camera movement, and separated assembly layers. Component placement, proportions, chip details, and routing are simplified for teaching. The models are not scans of original boards, exact mechanical reconstructions, or servicing references. On M4, CPU and GPU labels identify functional blocks within one chip; showing them separately for inspection does not mean they are separate processor cards.

## Ways to explore

**Explore the machine** offers rotation, zoom, camera presets, labels, a continuous assembly slider, and a See through view of the enclosure. Selecting a component displays its summary and specifications. Architecture notes expand to show its role, related components, and primary reference. The component rail and menu provide alternatives to picking geometry with the pointer. A session-only counter tracks explicitly inspected parts; automatic story steps do not count as visits. Selecting another generation replaces the component set and clears that exploration counter.

Drag the 3D view to orbit and scroll or pinch to zoom. With the view focused, arrow keys rotate, `+` / `−` adjust distance, and Home restores the overview. The 3D renderer requires WebGL 2. The original Macintosh has an SVG fallback; later models retain their component information without pretending that fallback drawing represents their hardware.

**Try the hardware** connects live controls to the displayed study. The mouse pad maps input to a cursor overlay without changing the bitmap. Keyboard input writes original block glyphs into a writing band, accepting up to 18 printable ASCII characters and showing letters as capitals. Reading the sample picture copies original artwork into the bitmap. Text and sample changes go through the same undo history as the pixel editor. These operations run JavaScript against the app’s data; they do not execute the selected machine’s CPU or peripheral protocols.

**Follow a signal** presents narrated journeys beside the selected machine. The original Macintosh has startup, mouse/drawing, and disk-read journeys. The iMac G3 and M4 each have input-to-picture and saved-image journeys. Each step names participating parts and explicitly selected functional transfer paths. Back, Next, numbered steps, and Play/Pause control the explanation. Selecting a component stops playback and returns to its inspector. Story playback also pauses when the page is hidden or its window loses focus. Several highlighted components may work concurrently in real hardware; the steps are not bus cycles, measured timings, or an exhaustive inventory of circuits.

**The 1984 pixel lab** switches to the Macintosh 128K and presents a full-screen preview with an editable 32 × 16 magnified patch, starting at pixel (240, 160). An outline marks the region being magnified. Clicking the preview moves that region without changing bitmap data. The patch can move horizontally in eight-pixel steps from x = 0 to 480 and vertically from y = 0 to 326. Each pixel or byte edit affects a bit in the shared RAM array and the corresponding displayed pixel.

The iMac screen presentations contain this same monochrome study inside an original color composition. They are illustrations, not native framebuffer implementations or screenshots of a running operating system. In particular, a small browser texture on the M4 model does not claim that its panel has that texture’s resolution. The 512 × 342 layout, one-bit pixels, 21,888-byte buffer, and RAM addresses described below apply only to the Macintosh 128K experiment.

The screen preview's arrow keys move the region by eight pixels. In the magnified editor, arrow keys select one pixel; Space or Enter toggles it. The eight byte buttons toggle individual bits while preserving keyboard focus. Coordinate fields provide precise positioning, with validation for whole values and the required horizontal alignment. These keyboard controls apply when the relevant canvas has focus.

Undo keeps the last 40 bitmap changes in memory, including pixel edits, byte edits, typed text, sample-picture reads, preset changes, and resets. It restores both the bitmap and the editing region associated with that change. Moving the magnifier or cursor alone does not add an undo entry. Reset restores the desktop study and can itself be undone when it changes the bitmap. Screen artwork and block glyphs are original. The page does not save edits or exploration progress across reloads.

## Fixed hardware configurations

| Configuration | Processor | Memory and storage | Display |
| --- | --- | --- | --- |
| Macintosh 128K · 1984 | Motorola 68000 · 7.8336 MHz | 128 KiB RAM; 64 KiB ROM; 400K floppy | 9-inch CRT; 512 × 342 monochrome |
| Original iMac G3 · 1998 launch | PowerPC G3 · 233 MHz | 32 MB SDRAM; separate 2 MB SGRAM; 4 GB ATA hard disk; 24× CD-ROM | 15-inch color CRT, 13.8-inch viewable; up to 1024 × 768 |
| iMac M4 · 2024, two ports, base | 8 CPU cores: 4 performance + 4 efficiency; 8 GPU cores | 16 GB unified memory; 256 GB SSD | 24-inch Retina, 23.5-inch actual diagonal; 4480 × 2520 |

The G3 represents the first launch configuration with ATI Rage IIc graphics, not later Bondi revisions. Its stock video memory supports 16-bit color at 1024 × 768; lower display modes can use greater color depth. Main RAM and graphics SGRAM are separate resources. Its USB input, graphics controller, internal hard disk, and CD-ROM replace several assumptions from the original Macintosh explanation.

The M4 entry is a historical 2024 configuration, not a claim about the newest available iMac. Its CPU and GPU are parts of the M4 system on a chip and share the unified memory pool. Shared physical memory still requires resource ownership and synchronization; some GPU resource modes are not directly accessible to the CPU. The base two-port machine has an ordinary Magic Keyboard; Touch ID and Gigabit Ethernet are options. Its external power adapter is rated at 143 W, which is not a measurement of continuous consumption.

Later-model capacities retain the units Apple uses in its specifications. They are not a universal byte-for-byte performance comparison, and processor clock rates or core counts alone do not measure relative application speed.

### Original Macintosh detail

| Part | What this model represents |
| --- | --- |
| CPU | Motorola MC68000, 7.8336 MHz; 16-bit external data bus, 24-bit address space, 32-bit data/address registers |
| RAM | 128 KiB: sixteen 64 Kbit DRAM chips |
| ROM | 64 KiB: two 32 KiB chips; startup code and Toolbox/system routines |
| Screen | 9-inch CRT, 512 × 342 monochrome pixels, approximately 60.15 Hz refresh |
| Screen bitmap | 21,888 bytes of shared main RAM; no separate video RAM pool |
| Storage | One internal 3.5-inch, single-sided 400K floppy drive |
| Disk interface | Apple IWM, working with VIA and analog signal generator circuitry |
| Peripheral control | Synertek SY6522 VIA and Zilog Z8530 SCC |
| Input | Dedicated keyboard link and a one-button quadrature mouse |
| Analog board | Power supply, video electronics, and speaker |

KiB means 1,024 bytes. Historical product names use “128K” and “400K”; explicit capacities here use binary units. The original system has no CPU cache, MMU, floating-point coprocessor, or internal hard disk. Its main address space includes RAM, ROM, and memory-mapped device registers.

A 32-bit CPU register does not imply a 32-bit external data bus. Similarly, the 68000’s 16 MiB address space does not imply that the Macintosh has 16 MiB of installed RAM. The distinction between capacity, address space, and transfer width matters when reading the specifications.

## How the architectures differ

For the **iMac G3**, a USB mouse may connect through the keyboard’s hub to the host controller. Software interprets input and updates application state in main RAM. Graphics work and the displayed image use the ATI controller and its dedicated video SGRAM; the controller supplies video to the CRT. For a saved image, the ATA storage interface and memory system transfer file data into RAM before software interprets and draws it. DMA support allows buffer transfers without making the CPU copy every byte individually.

For the **iMac M4**, Bluetooth input reaches system software through wireless controllers. CPU software updates state and submits graphics work; the GPU works with resources backed by unified memory. The display pipeline presents the completed image. A file read from the SSD supplies working data, not a ready-made physical display signal. The diagram groups storage controllers, radios, caches, buses, display hardware, and operating-system work into inspectable stages.

The original Macintosh has a different arrangement:

**Startup:** a temporary ROM overlay supplies the reset vectors at low addresses. The 68000 executes initialization code in ROM, tests the system, and clears the VIA overlay bit to restore RAM at address zero. It then begins disk startup. Built-in ROM routines and disk-loaded system software work together; the ROM alone is not a complete desktop session.

**Mouse input:** X1 and Y1 go to the SCC’s DCD inputs and cause motion interrupts. X2 and Y2 go to VIA inputs; software combines those levels with the SCC edge to determine direction. The VIA also exposes the mouse button. The mouse reports relative motion, and software maintains the cursor coordinates. It is not a modern packet-based serial mouse.

**Drawing:** QuickDraw is code executed by the CPU, with routines in ROM. A drawing operation changes the bitmap in RAM. Video circuitry reads that RAM and generates the display signal; the CRT and analog electronics turn it into a scanned image. The CPU does not issue a separate instruction for every displayed pixel during every refresh.

**Disk access:** IWM handles read/write data and some control signals, while VIA and the analog signal generator also participate in drive control. The CPU executes disk-driver software to transfer and interpret data. An application decides whether a loaded file requires a screen update.

**Sound:** sample values in RAM feed circuitry that uses pulse-width conversion to produce an analog waveform. VIA controls sound enable and volume. Sound buffers also carry floppy motor-speed data, showing how closely the original machine coordinates its hardware resources.

Across all three machines, “connections” are functional relationships, not a list of direct point-to-point wires. Journey arrows specify the direction of each illustrated transfer; the highlighted component list does not imply a chain through every part. The same component ID can represent a different role in another model: for example, the original analog board combines power and CRT functions, while the M4 power component represents an external adapter.

On the original Macintosh, power fans out from the analog board to separate components. RAM supplies picture data through omitted video logic while the analog board supports the CRT. Its analog signal generator is not the same thing as the large analog power/video board.

## A byte becomes eight pixels

The screen has 512 × 342 = 175,104 pixels. At one bit per pixel:

```text
bytes per row = 512 / 8       = 64
bitmap bytes  = 64 × 342      = 21,888
byte offset   = y × 64 + floor(x / 8)
RAM address   = 0x1A700 + byte offset
bit position  = 7 − (x mod 8)
```

Within a byte, the most significant bit is the leftmost pixel. Zero means white and one means black. Dithered gray-looking regions still consist entirely of black and white pixels.

The original 128K machine’s main screen buffer begins at hexadecimal `0x1A700`; its alternate buffer begins at `0x12700`. The browser uses a 128 KiB `Uint8Array` for main RAM, with the framebuffer as a view of bytes `0x1A700` through `0x1FC7F`. Pixel helpers use offsets within that view, while the interface displays the actual RAM addresses. This models the main bitmap’s shared storage, not the complete physical address map or the operating system’s alternate-buffer selection.

The real original Macintosh interleaves CPU and display access to RAM. This demo does not reproduce that arbitration, CRT beam timing, analog voltages, or the CPU work required to draw. Playback speed is for learning and is unrelated to processor clocks or display refresh rates. Neither later machine inherits this bitmap’s address map or one-bit pixel format.

## Code and verification

- `src/machine-generations.js` defines the three fixed configurations and the later machines’ sourced components and journeys.
- `src/macintosh-data.js` preserves the original Macintosh component descriptions and journeys.
- `src/macintosh-model.js` creates the original Macintosh’s procedural 3D geometry; `src/imac-models.js` creates the G3 and M4 models.
- `src/macintosh-renderer.js` handles the Three.js scene, camera, component picking, exploded layers, labels, transparency, screen texture, and signal animation.
- `src/macintosh-3d.css` styles the 3D viewport and its overlays. `src/macintosh-scene.js` and its stylesheet retain the original Macintosh SVG fallback.
- `src/machine-activities.js` supplies the live hardware studies and routes bitmap mutations through the app’s undo callback.
- `src/framebuffer.js` implements the original Macintosh pixel-to-byte mapping, bitmap writes, original block text and screen patterns, and canvas rendering.
- `src/main.js` connects generation selection, inspectors, journeys, screen presentation, and the pixel experiment. `src/style.css` defines the application interface.
- `tests/` checks bitmap behavior, text clipping, model geometry, and component/journey consistency, including model-specific IDs and explicit path endpoints.
- `scripts/build.mjs` bundles the browser code with Three.js through esbuild; `scripts/serve.mjs` builds and serves the local static output.

Use Node.js 22 or newer and `npm ci` to install the locked build dependencies. Run `npm test` for model checks, `npm run build` for deployable static files, and `npm run dev` for a local preview. Browser inspection is still needed to verify camera motion, selecting and changing generations, playback, resizing, WebGL fallback, keyboard controls, and visible bitmap changes. Tests do not establish processor emulation, ROM boot, operating-system compatibility, or accurate electrical simulation. The project does not implement those features.

[Interface refinement notes](design-refinement.md) record the focused usability changes and the checks available at that review checkpoint.

## Primary references

The links below are sources for the represented hardware and concepts, not documentation of software running inside the exhibit.

**iMac G3 and Apple silicon**

- Apple Support, [original iMac technical specifications](https://support.apple.com/en-us/112281). Baseline processor, memory, ATA storage, USB, and video-depth table. The page contains revision notes; this project fixes the first 1998 launch configuration.
- Apple Computer, [Apple iMac Computer Developer Note, 1998](https://www.wap.org/events/iMacDevNote.pdf), preserved by Washington Apple Pi. Features pp. 14–15; architecture pp. 22–25; USB input pp. 28–34; CRT modes pp. 34–35. Identifies ATI Rage IIc, separate graphics SGRAM, the USB keyboard hub, and DMA-capable storage support.
- Apple Support, [iMac (24-inch, 2024, Two ports) technical specifications](https://support.apple.com/en-us/121556). Fixed source for the 8-core CPU / 8-core GPU base configuration, 16 GB memory, 256 GB SSD, panel, camera, audio, ports, and power adapter. [Apple’s current iMac specifications](https://www.apple.com/imac/specs/) are additional context, but are not used to silently update the historical configuration.
- Apple Developer, [Choosing a resource storage mode for Apple GPUs](https://developer.apple.com/documentation/metal/choosing-a-resource-storage-mode-for-apple-gpus). Explains unified memory and how resource modes affect CPU/GPU access.
- Apple Developer, [Metal Compute on MacBook Pro](https://developer.apple.com/videos/play/tech-talks/10580/). Supports the general Apple-silicon explanation of shared physical memory, GPU work submission, and synchronization; its device-specific core counts are not used for the M4 iMac.
- Apple Support, [Magic Keyboard (USB-C)](https://support.apple.com/en-us/121955) and [Magic Mouse (USB-C)](https://support.apple.com/en-us/121931). Primary references for wireless input and USB-C pairing/charging.

**Original Macintosh**

- Apple Computer, [Inside Macintosh — Macintosh Hardware, February 1985](https://ftpmirror.your.org/pub/misc/bitsavers/pdf/apple/mac/Inside_Macintosh_Hardware_198502.pdf). This chapter explicitly covers the Macintosh 128K and 512K: hardware overview pp. 3–4; video pp. 5–8; sound pp. 8–10; mouse pp. 16–19; keyboard pp. 20–24; disk interface pp. 25–27; VIA pp. 30–33; startup p. 34. [Alternate archival text](https://archive.org/stream/Mac_Hardware_Info_Mac_128K/Mac_Hardware_Info_Mac_128K_djvu.txt).
- Apple Computer, [Macintosh main logic board schematic 050-0073-C](https://ftpmirror.your.org/pub/misc/bitsavers/pdf/apple/mac/schematic/050-0073-C_Mac128_512.tif). The RAM array is labeled as two groups of eight 64K × 1 chips; ROM-HI and ROM-LO are each 32K × 8.
- Apple Computer, [Guide to the Macintosh Family Hardware, second edition, 1990](https://vintageapple.org/inside_o/pdf/Guide_to_Macintosh_Family_Hardware_2nd_Edition_1990.pdf). Model-specific descriptions distinguish the early 400K single-sided drives from later 800K drives and describe the analog board’s combined functions.
- Motorola, [M68000 Microprocessors User’s Manual](https://www.nxp.com/docs/en/reference-manual/MC68000UM.pdf), sections 1.1 and 2.1. Source for processor bus widths and the programming model; later family members are distinct from the MC68000 used here.
- Apple Support, [Macintosh 128K technical specifications](https://support.apple.com/en-us/112190). Corroborates capacities, original configuration, and absence of cache/MMU. Its generic video table contains a conflicting 512 × 384 entry; its screen-size note and the original hardware manual specify 512 × 342, which this project uses.

The documentation and illustrations are original educational work. Referenced Apple and Motorola documents retain their own rights and are linked rather than bundled. No Apple ROM, disk image, system font, or operating-system asset is included. This independent project is not affiliated with Apple.
