# Inside the Macintosh 128K

Architecture Lab makes the original 1984 Macintosh physically understandable: select a component, inspect its job, and trace how several components cooperate. The baseline is the 128 KiB model, not the later Macintosh Plus or a modern Mac.

## Three ways to explore

**Explore the machine** presents an original illustrated cutaway. Opening the enclosure separates the visual layers; selecting a part explains its role and related components. Placement and proportions are schematic, with some small circuits grouped under larger components. The drawing is not a board-layout or servicing reference.

**Follow a signal** presents three narrated journeys: successful startup from a readable system disk, mouse input followed by a drawing operation, and a file read followed by a screen update. Each step highlights participating parts and explicitly chosen functional transfer paths. The sequence is a conceptual explanation; it does not run the ROM or simulate every interrupt, instruction, bus transfer, or wait state. Several highlighted components may work concurrently in real hardware.

**Pixels to picture** is a working model of monochrome bitmap storage. Its editable 32 × 16 patch magnifies a movable portion of a full 512 × 342 image, starting at pixel (240, 160). The patch can move horizontally in eight-pixel steps from x = 0 to 480 and vertically from y = 0 to 326. Each change affects a bit in the shared RAM array and the corresponding displayed pixel. Presets are original artwork, not screenshots of a running Macintosh system.

## Hardware baseline

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

## The important connections

**Startup:** a temporary ROM overlay supplies the reset vectors at low addresses. The 68000 executes initialization code in ROM, tests the system, and clears the VIA overlay bit to restore RAM at address zero. It then begins disk startup. Built-in ROM routines and disk-loaded system software work together; the ROM alone is not a complete desktop session.

**Mouse input:** X1 and Y1 go to the SCC’s DCD inputs and cause motion interrupts. X2 and Y2 go to VIA inputs; software combines those levels with the SCC edge to determine direction. The VIA also exposes the mouse button. The mouse reports relative motion, and software maintains the cursor coordinates. It is not a modern packet-based serial mouse.

**Drawing:** QuickDraw is code executed by the CPU, with routines in ROM. A drawing operation changes the bitmap in RAM. Video circuitry reads that RAM and generates the display signal; the CRT and analog electronics turn it into a scanned image. The CPU does not issue a separate instruction for every displayed pixel during every refresh.

**Disk access:** IWM handles read/write data and some control signals, while VIA and the analog signal generator also participate in drive control. The CPU executes disk-driver software to transfer and interpret data. An application decides whether a loaded file requires a screen update.

**Sound:** sample values in RAM feed circuitry that uses pulse-width conversion to produce an analog waveform. VIA controls sound enable and volume. Sound buffers also carry floppy motor-speed data, showing how closely the original machine coordinates its hardware resources.

The “connections” in the app are functional relationships, not a list of direct point-to-point wires. Journey arrows specify the direction of each illustrated transfer; the list of highlighted components does not imply a chain through them. Power fans out from the analog board to separate components. For video, RAM supplies picture data through omitted video logic while the analog board supports the CRT. In particular, the analog signal generator is not the same thing as the large analog power/video board.

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

The real hardware interleaves CPU and display access to RAM. This demo does not reproduce that arbitration, CRT beam timing, analog voltages, or the CPU work required to draw. Playback speed is for learning and is unrelated to the actual processor clock or refresh rate.

## Code and verification

- `src/macintosh-data.js` contains the component descriptions, primary-source links, and narrated journeys.
- `src/macintosh-scene.js` draws the selectable Macintosh cutaway and its component locations.
- `src/macintosh-scene.css` styles the illustration, open enclosure, component labels, and selection states.
- `src/framebuffer.js` implements pixel-to-byte mapping, bitmap writes, original screen patterns, and canvas rendering.
- `src/main.js` connects selection, journey controls, and the pixel experiment.
- `src/style.css` defines the responsive application interface.
- `tests/` checks framebuffer behavior and the consistency of component/journey data.
- `scripts/` provides the local server and static build.

Run `npm test` for the model checks and `npm run build` for the deployable files. Browser inspection is also needed to verify selection, playback, resizing, and the visible result of pixel edits. No 68000 execution, ROM boot, or operating-system compatibility is claimed by these checks.

## Primary references

- Apple Computer, [Inside Macintosh — Macintosh Hardware, February 1985](https://ftpmirror.your.org/pub/misc/bitsavers/pdf/apple/mac/Inside_Macintosh_Hardware_198502.pdf). This chapter explicitly covers the Macintosh 128K and 512K: hardware overview pp. 3–4; video pp. 5–8; sound pp. 8–10; mouse pp. 16–19; keyboard pp. 20–24; disk interface pp. 25–27; VIA pp. 30–33; startup p. 34. [Alternate archival text](https://archive.org/stream/Mac_Hardware_Info_Mac_128K/Mac_Hardware_Info_Mac_128K_djvu.txt).
- Apple Computer, [Macintosh main logic board schematic 050-0073-C](https://ftpmirror.your.org/pub/misc/bitsavers/pdf/apple/mac/schematic/050-0073-C_Mac128_512.tif). The RAM array is labeled as two groups of eight 64K × 1 chips; ROM-HI and ROM-LO are each 32K × 8.
- Apple Computer, [Guide to the Macintosh Family Hardware, second edition, 1990](https://vintageapple.org/inside_o/pdf/Guide_to_Macintosh_Family_Hardware_2nd_Edition_1990.pdf). Model-specific descriptions distinguish the early 400K single-sided drives from later 800K drives and describe the analog board’s combined functions.
- Motorola, [M68000 Microprocessors User’s Manual](https://www.nxp.com/docs/en/reference-manual/MC68000UM.pdf), sections 1.1 and 2.1. Source for processor bus widths and the programming model; later family members are distinct from the MC68000 used here.
- Apple Support, [Macintosh 128K technical specifications](https://support.apple.com/en-us/112190). Corroborates capacities, original configuration, and absence of cache/MMU. Its generic video table contains a conflicting 512 × 384 entry; its screen-size note and the original hardware manual specify 512 × 342, which this project uses.

The documentation and illustrations are original educational work. Referenced Apple and Motorola documents retain their own rights and are linked rather than bundled. No Apple ROM, disk image, system font, or operating-system asset is included. This independent project is not affiliated with Apple.
