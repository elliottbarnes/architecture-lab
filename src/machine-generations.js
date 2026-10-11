import { PARTS, JOURNEYS } from './macintosh-data.js';

// Fixed configurations, not an automatically changing catalogue of current Macs.
// Sources checked 2026-10-11. The 1998 developer note is an Apple publication
// preserved by Washington Apple Pi. Links describe functional relationships,
// not individual wires, exact chip placement, or cycle-accurate execution.
const g3Specs = 'https://support.apple.com/en-us/112281';
const g3Note = 'https://www.wap.org/events/iMacDevNote.pdf';
const m4Specs = 'https://support.apple.com/en-us/121556';
const unifiedMemory = 'https://developer.apple.com/documentation/metal/choosing-a-resource-storage-mode-for-apple-gpus';

const g3Parts = [
  {
    id: 'cpu', title: 'PowerPC G3', subtitle: 'The application processor', category: 'Processing',
    summary: 'Runs software and coordinates the other controllers.',
    role: 'Instructions act on values in registers and memory. A cache keeps some recently used instructions and data close to the processor.',
    specs: [{ label: 'Clock', value: '233 MHz' }, { label: 'L2 cache', value: '512 KB' }],
    connections: ['ram', 'gpu', 'io'],
    fact: 'Clock rate alone cannot compare the work done by different processor architectures.', source: g3Specs,
  },
  {
    id: 'ram', title: '32 MB SDRAM', subtitle: 'The working memory', category: 'Memory',
    summary: 'Holds running programs and their changing data.',
    role: 'Applications need a temporary workspace as they run. This main memory is distinct from the video memory beside the graphics controller.',
    specs: [{ label: 'Standard capacity', value: '32 MB' }, { label: 'Slots', value: '2 SO-DIMM' }],
    connections: ['cpu', 'io', 'gpu'],
    fact: 'Opening a file brings working data into RAM; saving records it on persistent storage.', source: g3Specs,
  },
  {
    id: 'gpu', title: 'ATI Rage IIc', subtitle: 'Graphics controller + video memory', category: 'Graphics',
    summary: 'Accelerates drawing and supplies the color video signal.',
    role: 'This controller has dedicated SGRAM for graphics data. It combines drawing hardware with the circuitry that reads the displayed image.',
    specs: [{ label: 'Video memory', value: '2 MB SGRAM' }, { label: 'Acceleration', value: '2D + 3D' }],
    connections: ['cpu', 'ram', 'display'],
    fact: 'This is the original launch configuration; later Bondi iMac revisions changed the graphics hardware.', source: `${g3Note}#page=25`,
  },
  {
    id: 'storage', title: '4 GB hard disk', subtitle: 'Persistent magnetic storage', category: 'Storage',
    summary: 'Keeps the operating system, applications, and saved files.',
    role: 'The disk reads sectors from rotating magnetic platters. Software requests data through the storage controller, then works with it in RAM.',
    specs: [{ label: 'Capacity', value: '4 GB' }, { label: 'Interface', value: 'ATA / IDE' }],
    connections: ['io', 'ram', 'analog'],
    fact: 'Persistent storage and working memory solve different problems; a larger disk does not replace RAM.', source: g3Specs,
  },
  {
    id: 'display', title: '15-inch color CRT', subtitle: 'A scanned color picture', category: 'Output',
    summary: 'Turns the graphics controller’s signal into visible light.',
    role: 'Electron beams excite colored phosphors as the tube scans the picture. This display can use several resolutions rather than one fixed pixel grid.',
    specs: [{ label: 'Viewable diagonal', value: '13.8 inches' }, { label: 'Maximum mode', value: '1024 × 768 pixels' }, { label: 'Stock color at 1024 × 768', value: '16-bit' }],
    connections: ['gpu', 'analog'],
    fact: 'With the standard video memory, 800 × 600 supports millions of colors; the highest resolution trades color depth for more pixels.', source: `${g3Note}#page=35`,
  },
  {
    id: 'io', title: 'USB & I/O controllers', subtitle: 'The links to devices', category: 'Control',
    summary: 'Connects peripherals and storage to the rest of the system.',
    role: 'This diagram groups several controllers and their bus connections. USB handles input devices; the storage interface handles the internal drives.',
    specs: [{ label: 'USB ports', value: '2 on the computer' }, { label: 'Ethernet', value: '10/100BASE-T' }],
    connections: ['cpu', 'ram', 'keyboard', 'mouse', 'storage', 'optical', 'sound'],
    fact: 'A connector, a controller, and its driver are different parts of getting device data into an application.', source: g3Specs,
  },
  {
    id: 'optical', title: '24× CD-ROM drive', subtitle: 'Removable optical storage', category: 'Storage',
    summary: 'Reads software and media from compact discs.',
    role: 'A laser detects changes in a disc’s reflective surface. The drive decodes those measurements into bytes for the computer.',
    specs: [{ label: 'Media', value: 'CD-ROM' }, { label: 'Drive rating', value: '24×' }],
    connections: ['io', 'analog'],
    fact: 'CD-ROM is read-only media. The installed hard disk is where the computer can save changed files.', source: g3Specs,
  },
  {
    id: 'analog', title: 'Power & CRT electronics', subtitle: 'Energy and beam control', category: 'Power',
    summary: 'Powers the computer and supports the tube’s scanning.',
    role: 'Power conversion supplies the circuits and drives. CRT electronics control the physical scan; graphics data determines the picture shown during that scan.',
    specs: [{ label: 'Mains input', value: '100–240 V AC' }, { label: 'Display technology', value: 'Color CRT' }],
    connections: ['cpu', 'display', 'storage', 'optical'],
    fact: 'The tube needs substantial physical depth even when the logic board is comparatively small.', source: g3Specs,
  },
  {
    id: 'sound', title: 'Stereo sound', subtitle: 'Digital samples to speakers', category: 'Output',
    summary: 'Turns numerical audio samples into an electrical waveform.',
    role: 'Audio circuitry converts stored samples and amplifies the result. Separate left and right channels let a recording place sounds across a stereo field.',
    specs: [{ label: 'Output', value: 'Built-in stereo speakers' }, { label: 'Also available', value: 'Headphone output' }],
    connections: ['io', 'ram'],
    fact: 'Pixels and audio samples are both data, but different output circuits turn them into light and sound.', source: g3Specs,
  },
  {
    id: 'keyboard', title: 'Apple USB keyboard', subtitle: 'Keys become input reports', category: 'Input',
    summary: 'Sends key activity to software over USB.',
    role: 'A controller in the keyboard reports key states. The operating system interprets those reports and delivers input to the active application.',
    specs: [{ label: 'Host connection', value: 'USB' }, { label: 'Built-in hub', value: '2 USB ports' }],
    connections: ['io', 'mouse'],
    fact: 'The mouse can connect through the keyboard’s hub, so both devices share the keyboard’s cable to the computer.', source: `${g3Note}#page=33`,
  },
  {
    id: 'mouse', title: 'Round USB mouse', subtitle: 'The original ball mouse', category: 'Input',
    summary: 'Reports movement and button activity over USB.',
    role: 'A rolling ball measures motion across the desk. Software uses movement reports to update a cursor position and interpret clicks.',
    specs: [{ label: 'Motion sensing', value: 'Rolling ball' }, { label: 'Host connection', value: 'USB' }],
    connections: ['keyboard', 'io'],
    fact: 'The mouse reports movement; the operating system maintains the visible cursor’s coordinates.', source: `${g3Note}#page=34`,
  },
];

const g3Journeys = [
  {
    id: 'input', title: 'Mouse to color',
    description: 'A conceptual input and drawing path. Links group controllers and buses rather than tracing individual wires.',
    steps: [
      { part: 'mouse', title: 'Send a movement report', detail: 'The ball measures motion. In this example the USB mouse is plugged into the keyboard’s hub, which forwards its report to the computer.', signal: 'Mouse → keyboard hub → USB', active: ['mouse', 'keyboard', 'io'], links: [['mouse', 'keyboard'], ['keyboard', 'io']] },
      { part: 'cpu', title: 'Software interprets the input', detail: 'The USB controller and driver make the report available. The application updates its state in main memory and decides what should change.', signal: 'Input → CPU → application state', active: ['io', 'cpu', 'ram'], links: [['io', 'cpu'], ['cpu', 'ram']] },
      { part: 'gpu', title: 'Update the graphics image', detail: 'Drawing software works with the graphics controller. The displayed color image lives in the controller’s dedicated video memory, separate from main RAM.', signal: 'Drawing work → graphics + SGRAM', active: ['cpu', 'gpu'], links: [['cpu', 'gpu']] },
      { part: 'display', title: 'Scan the updated picture', detail: 'The graphics controller reads video memory and supplies video to the CRT. Power and scan electronics support the physical display.', signal: 'Graphics video → color CRT', active: ['gpu', 'analog', 'display'], links: [['gpu', 'display'], ['analog', 'display']] },
    ],
  },
  {
    id: 'picture', title: 'A file becomes a picture',
    description: 'Follow an image from the hard disk into a drawing application. These stages show responsibilities, not transfer timings.',
    steps: [
      { part: 'storage', title: 'Request the saved file', detail: 'The application asks the operating system for a file. The storage driver arranges a read through the ATA interface.', signal: 'CPU → storage controller → disk', active: ['cpu', 'io', 'storage'], links: [['cpu', 'io'], ['io', 'storage']] },
      { part: 'ram', title: 'Transfer bytes into a buffer', detail: 'The disk supplies data through the I/O and memory controllers. DMA support lets hardware transfer a buffer without the CPU copying each byte individually.', signal: 'Disk → controllers → main RAM', active: ['storage', 'io', 'ram'], links: [['storage', 'io'], ['io', 'ram']] },
      { part: 'cpu', title: 'Interpret the file format', detail: 'Software reads the file’s data from RAM and prepares the drawing operation. Compressed file bytes are not automatically display pixels.', signal: 'Main RAM → CPU → drawing work', active: ['ram', 'cpu', 'gpu'], links: [['ram', 'cpu'], ['cpu', 'gpu']] },
      { part: 'display', title: 'Present the color image', detail: 'The graphics subsystem holds the visible result in its own SGRAM. Its video output supplies the picture that the CRT scans.', signal: 'Video memory → graphics output → CRT', active: ['gpu', 'display'], links: [['gpu', 'display']] },
    ],
  },
];

const m4Parts = [
  {
    id: 'cpu', title: 'Apple M4 CPU', subtitle: 'CPU cores inside a system on a chip', category: 'Processing',
    summary: 'Runs applications and schedules work for other engines.',
    role: 'Several CPU cores can work on different tasks. The CPU and GPU are functional blocks within the same M4 chip, not separate plug-in processor cards.',
    specs: [{ label: 'CPU cores', value: '8 total' }, { label: 'Core mix', value: '4 performance + 4 efficiency' }],
    connections: ['ram', 'gpu', 'storage', 'io', 'camera'],
    fact: 'This exhibit fixes the 2024 two-port configuration; other M4 iMac configurations have different core counts.', source: m4Specs,
  },
  {
    id: 'ram', title: '16 GB unified memory', subtitle: 'A shared working pool', category: 'Memory',
    summary: 'Supplies working data to the CPU, GPU, and other engines.',
    role: 'CPU and GPU resources can occupy the same physical memory pool. Software still has to coordinate when each engine may read or write a resource.',
    specs: [{ label: 'Base capacity', value: '16 GB' }, { label: 'Architecture', value: 'Unified CPU / GPU memory' }],
    connections: ['cpu', 'gpu', 'storage', 'camera', 'sound'],
    fact: 'Sharing physical memory does not mean every resource is directly accessible to both processors; its storage mode also matters.', source: unifiedMemory,
  },
  {
    id: 'gpu', title: 'M4 integrated GPU', subtitle: 'Parallel graphics and compute', category: 'Graphics',
    summary: 'Processes drawing work using the shared memory pool.',
    role: 'The GPU executes work submitted by software and produces image data. It is part of M4 and does not require a separate bank of dedicated graphics RAM.',
    specs: [{ label: 'GPU cores', value: '8' }, { label: 'Location', value: 'Inside the M4 chip' }],
    connections: ['cpu', 'ram', 'display'],
    fact: 'A GPU core count is not a universal performance unit across different GPU architectures.', source: m4Specs,
  },
  {
    id: 'storage', title: '256 GB SSD', subtitle: 'Persistent solid-state storage', category: 'Storage',
    summary: 'Keeps the operating system and saved files without spinning disks.',
    role: 'Flash memory retains data when the computer is off. Storage controllers move requested data into working memory for running software.',
    specs: [{ label: 'Base capacity', value: '256 GB' }, { label: 'Technology', value: 'Solid-state drive' }],
    connections: ['cpu', 'ram'],
    fact: 'The SSD preserves saved files; unified memory is the temporary workspace used to process them.', source: m4Specs,
  },
  {
    id: 'display', title: '24-inch Retina display', subtitle: 'A fixed grid of color pixels', category: 'Output',
    summary: 'Presents the completed image from the display system.',
    role: 'Display hardware presents image buffers produced by software and the GPU. A screen pixel uses color components rather than one monochrome on/off bit.',
    specs: [{ label: 'Native resolution', value: '4480 × 2520 pixels' }, { label: 'Actual diagonal', value: '23.5 inches' }, { label: 'Brightness', value: '500 nits' }],
    connections: ['gpu', 'ram', 'analog'],
    fact: 'Resolution counts pixels; it does not specify the format or number of memory bytes used by a particular image buffer.', source: m4Specs,
  },
  {
    id: 'io', title: 'Ports & wireless', subtitle: 'External data connections', category: 'Control',
    summary: 'Connects peripherals through wired links and radios.',
    role: 'Controllers translate between device protocols and system data. This view groups those functions; a radio link is not a physical wire to the CPU.',
    specs: [{ label: 'Rear ports', value: '2 Thunderbolt / USB 4' }, { label: 'Wireless', value: 'Wi-Fi 6E + Bluetooth 5.3' }],
    connections: ['cpu', 'ram', 'keyboard', 'mouse'],
    fact: 'Gigabit Ethernet is an option on this two-port model, rather than part of its base configuration.', source: m4Specs,
  },
  {
    id: 'analog', title: 'Power adapter', subtitle: 'External power conversion', category: 'Power',
    summary: 'Supplies electrical energy through the computer’s power connection.',
    role: 'The external adapter converts mains power. Regulators inside the computer then supply the voltages required by its circuits.',
    specs: [{ label: 'Adapter rating', value: '143 W' }, { label: 'Mains input', value: '100–240 V AC' }],
    connections: ['cpu', 'display', 'sound'],
    fact: 'The adapter’s rated capacity is not a measurement of the computer’s continuous power consumption.', source: m4Specs,
  },
  {
    id: 'sound', title: 'Six-speaker audio', subtitle: 'Digital sound into the room', category: 'Output',
    summary: 'Converts audio data into multiple amplified speaker signals.',
    role: 'Audio processing prepares samples for conversion and amplification. The speakers create pressure changes that you hear as sound.',
    specs: [{ label: 'Speaker system', value: '6 speakers' }, { label: 'Microphone array', value: '3 microphones' }],
    connections: ['ram', 'cpu', 'analog'],
    fact: 'Microphones perform the reverse task: sound becomes an electrical signal and then digital samples.', source: m4Specs,
  },
  {
    id: 'camera', title: 'Center Stage camera', subtitle: 'Light becomes image data', category: 'Input',
    summary: 'Captures a scene for video applications.',
    role: 'The sensor converts incoming light into measurements. Image-processing hardware and software turn those measurements into useful frames.',
    specs: [{ label: 'Camera', value: '12 MP' }, { label: 'Video recording', value: '1080p HD' }],
    connections: ['cpu', 'ram'],
    fact: 'Sensor pixel count and video output resolution are different quantities.', source: m4Specs,
  },
  {
    id: 'keyboard', title: 'Magic Keyboard', subtitle: 'Wireless key input', category: 'Input',
    summary: 'Sends key activity over a paired wireless connection.',
    role: 'The keyboard reports input over Bluetooth. Applications receive interpreted key events from the operating system.',
    specs: [{ label: 'Input link', value: 'Bluetooth' }, { label: 'Pairing / charging', value: 'USB-C' }],
    connections: ['io'],
    fact: 'The standard keyboard supplied with this two-port configuration does not include Touch ID.', source: 'https://support.apple.com/en-us/121955',
  },
  {
    id: 'mouse', title: 'Magic Mouse', subtitle: 'Wireless motion and gestures', category: 'Input',
    summary: 'Reports pointer movement and touch gestures.',
    role: 'The mouse’s wireless link carries input to the computer. Software interprets movement, clicks, and gestures in the active application.',
    specs: [{ label: 'Input link', value: 'Bluetooth' }, { label: 'Surface', value: 'Multi-Touch' }],
    connections: ['io'],
    fact: 'Its USB-C connection is used for pairing and charging; the everyday interaction shown here uses Bluetooth.', source: 'https://support.apple.com/en-us/121931',
  },
];

const m4Journeys = [
  {
    id: 'input', title: 'A gesture becomes an image',
    description: 'Follow a wireless input through software and graphics. These are functional stages inside and around M4, not separate processor cards.',
    steps: [
      { part: 'mouse', title: 'Send a wireless input', detail: 'Magic Mouse reports motion or a gesture through its paired Bluetooth connection. The radio and input software deliver that activity to the computer.', signal: 'Mouse → Bluetooth input', active: ['mouse', 'io'], links: [['mouse', 'io']] },
      { part: 'cpu', title: 'Update application state', detail: 'Software running on the CPU interprets the input. It changes application data in memory and prepares the work needed for a new picture.', signal: 'Input → CPU → shared memory', active: ['io', 'cpu', 'ram'], links: [['io', 'cpu'], ['cpu', 'ram']] },
      { part: 'gpu', title: 'Submit graphics work', detail: 'The application submits graphics commands. The GPU uses resources in unified memory; software coordinates access so data is ready when needed.', signal: 'CPU commands + shared data → GPU', active: ['cpu', 'ram', 'gpu'], links: [['cpu', 'gpu'], ['ram', 'gpu']] },
      { part: 'ram', title: 'Produce the image buffer', detail: 'The GPU’s work produces image data backed by unified memory. This is not a copy into a separate graphics card’s dedicated RAM.', signal: 'GPU → image data in unified memory', active: ['gpu', 'ram'], links: [['gpu', 'ram']] },
      { part: 'display', title: 'Present the completed frame', detail: 'Display hardware presents the prepared image on the panel. The link represents that display pipeline, not a direct wire from a memory chip to a pixel.', signal: 'Prepared image → display pipeline → panel', active: ['ram', 'display'], links: [['ram', 'display']] },
    ],
  },
  {
    id: 'picture', title: 'A saved image comes to life',
    description: 'Trace a file read and a GPU-assisted image display. Controllers, caches, and operating-system work are grouped into conceptual stages.',
    steps: [
      { part: 'storage', title: 'Request a saved image', detail: 'An application asks the operating system to open a file. Storage hardware retrieves its saved contents from the SSD.', signal: 'Software request → SSD', active: ['cpu', 'storage'], links: [['cpu', 'storage']] },
      { part: 'ram', title: 'Make the data available', detail: 'The storage system places requested data in working memory. The original saved file can remain on the SSD while software processes a memory buffer.', signal: 'SSD → unified memory', active: ['storage', 'ram'], links: [['storage', 'ram']] },
      { part: 'cpu', title: 'Prepare the image', detail: 'In this example, application code interprets the file and prepares image resources. CPU and GPU use one physical memory pool, with access governed by the resource’s storage mode.', signal: 'Shared data → CPU → graphics commands', active: ['ram', 'cpu', 'gpu'], links: [['ram', 'cpu'], ['cpu', 'gpu']] },
      { part: 'gpu', title: 'Render the result', detail: 'The GPU reads the prepared resources and produces a displayable result. Command ordering and synchronization determine when the result is ready.', signal: 'Unified memory ↔ GPU', active: ['ram', 'gpu'], links: [['ram', 'gpu'], ['gpu', 'ram']] },
      { part: 'display', title: 'Show the prepared picture', detail: 'The display pipeline presents the completed image. The SSD does not send a finished picture directly to the panel.', signal: 'Image buffer → display pipeline', active: ['ram', 'display'], links: [['ram', 'display']] },
    ],
  },
];

export const GENERATIONS = [
  {
    id: 'macintosh', name: 'Macintosh 128K', year: 1984,
    tagline: 'A whole computer behind a tiny screen.',
    processor: 'Motorola 68000 · 7.8336 MHz', memory: '128 KiB RAM', display: '9-inch CRT · 512 × 342',
    description: 'The original Macintosh: monochrome pixels in shared RAM, a floppy drive, and dedicated interface chips.',
    source: 'https://ftpmirror.your.org/pub/misc/bitsavers/pdf/apple/mac/Inside_Macintosh_Hardware_198502.pdf',
    parts: PARTS, journeys: JOURNEYS,
  },
  {
    id: 'imac-g3', name: 'iMac G3', year: 1998,
    tagline: 'Color, USB, and the internet in Bondi blue.',
    processor: 'PowerPC G3 · 233 MHz', memory: '32 MB SDRAM', display: '15-inch CRT · up to 1024 × 768',
    description: 'The original 1998 launch configuration, with ATI Rage IIc graphics, separate video memory, a 4 GB hard disk, and a CD-ROM drive.',
    source: g3Specs, parts: g3Parts, journeys: g3Journeys,
  },
  {
    id: 'imac-m4', name: 'iMac M4', year: 2024,
    tagline: 'Many computing engines. One shared memory pool.',
    processor: 'Apple M4 · 8-core CPU / 8-core GPU', memory: '16 GB unified memory', display: '24-inch Retina · 4480 × 2520',
    description: 'The 2024 two-port base configuration with 256 GB SSD storage. CPU and GPU are blocks inside M4; this is a fixed historical model.',
    source: m4Specs, parts: m4Parts, journeys: m4Journeys,
  },
];

// Journey explanations synthesize the cited hardware with Apple's account of
// GPU command submission and synchronization, rather than emulating an ISA.
// https://developer.apple.com/videos/play/tech-talks/10580/
