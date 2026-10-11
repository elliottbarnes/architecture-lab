import { WIDTH, HEIGHT, FRAME_BYTES, createFramebuffer, fillPattern, fillRect, drawText } from './framebuffer.js';

let instance = 0;

const GENERATION_ACTIVITIES = {
  macintosh: {
    computer: 'Macintosh', diskTab: 'Disk', diskPart: 'floppy', source: 'floppy', removable: true,
    media: 'disk', sampleLabel: 'sample disk', insertLabel: 'Insert disk', ejectLabel: 'Eject disk',
    mouse: 'The real mouse sends relative motion as paired electrical pulses, called quadrature. The SCC detects transitions; the VIA supplies the other motion inputs and the button state. This pad maps your position directly to the screen.',
    keyboard: 'Keyboard → VIA → CPU → RAM → screen. A program turns key input into glyph pixels; the keyboard does not draw them itself. Here a small JavaScript program writes those bits into the shared screen memory.',
    storage: 'Disk → IWM → CPU → RAM. The display reads the resulting bitmap from RAM. This sample contains our own artwork; reading it replaces the whole screen and can be undone.',
    caveat: 'Working experiments with the app’s bitmap, not a running Macintosh operating system or CPU emulator.',
  },
  'imac-g3': {
    computer: 'iMac G3', diskTab: 'CD-ROM', diskPart: 'optical', source: 'optical', removable: true,
    media: 'CD', sampleLabel: 'sample CD-ROM', insertLabel: 'Insert CD', ejectLabel: 'Eject CD',
    mouse: 'The iMac G3 mouse sends movement and button reports over USB to an I/O controller. Software interprets them and updates the cursor. The ATI graphics controller uses its own video memory to display the picture. This pad maps your position directly to our teaching screen.',
    keyboard: 'USB keyboard → I/O controller → software. An application turns key input into text and drawing commands; the graphics controller uses separate video memory for display. Here JavaScript writes into a 1984-style bitmap teaching window, not the G3’s native framebuffer.',
    storage: 'The CD-ROM drive reads optical media through the storage interface. Software receives those bytes in main memory; the graphics controller and its dedicated video memory handle the display. This experiment loads original artwork into a 1984-style bitmap teaching window and can be undone.',
    caveat: 'The 512 × 342, one-bit window is an original-Macintosh teaching experiment. It is not the iMac G3’s native color framebuffer, a running operating system, or a CPU emulator.',
  },
  'imac-m4': {
    computer: 'iMac M4', diskTab: 'SSD', diskPart: 'storage', source: 'storage', removable: false,
    media: 'SSD', sampleLabel: 'SSD sample',
    mouse: 'The Magic Mouse communicates wirelessly over Bluetooth. Software interprets its input and updates the cursor; the M4’s GPU and display circuitry produce the picture. This pad maps your position directly to our teaching screen.',
    keyboard: 'The Magic Keyboard sends input over Bluetooth. Software interprets it, and the GPU draws using unified memory shared with the CPU. Here JavaScript writes into a 1984-style bitmap teaching window, not the M4’s native display framebuffer.',
    storage: 'The built-in SSD keeps files in flash memory. A read makes file data available to software; the CPU and GPU can work with data in unified memory. This experiment loads original artwork into a 1984-style bitmap teaching window. The internal SSD is not removable media.',
    caveat: 'The 512 × 342, one-bit window is an original-Macintosh teaching experiment. It is not the iMac M4’s native display framebuffer, a running operating system, or a CPU emulator.',
  },
};

/**
 * Mount working input experiments beside the machine renderer.
 * onEdit(message, mutate) runs a synchronous, no-argument mutation through the
 * host's undo history. Mouse events never change the framebuffer. A disk event
 * with reading:true is a read pulse; the renderer owns its animation timing.
 */
export function initMachineActivities(host, { frame, onEdit, onActivity = () => {}, generation = 'macintosh' } = {}) {
  if (!host?.ownerDocument || typeof host.replaceChildren !== 'function') throw new TypeError('An activity host element is required.');
  if (!(frame instanceof Uint8Array) || frame.length !== FRAME_BYTES) throw new TypeError(`Framebuffer must contain ${FRAME_BYTES} bytes.`);
  if (typeof onEdit !== 'function' || typeof onActivity !== 'function') throw new TypeError('Activity callbacks must be functions.');
  const era = GENERATION_ACTIVITIES[generation];
  if (!era) throw new RangeError(`Unknown activity generation: ${generation}`);
  const original = generation === 'macintosh';
  const prefix = `hardware-${++instance}`;
  const controller = new AbortController();
  const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: controller.signal });
  const $ = selector => host.querySelector(selector);
  const ids = ['mouse', 'keyboard', 'disk'];
  const parts = { mouse: 'mouse', keyboard: 'keyboard', disk: era.diskPart };
  let active = 'mouse', inserted = !era.removable, destroyed = false;
  let x = 256, y = 171, pressed = false;

  host.classList.add('machine-activities');
  host.dataset.generation = generation;
  host.innerHTML = `
    <div class="activity-heading"><p class="eyebrow">Try the hardware</p><h3>Make something happen.</h3></div>
    <div class="activity-tabs" role="tablist" aria-label="Hardware experiments">
      ${ids.map((id, index) => `<button type="button" role="tab" id="${prefix}-tab-${id}" aria-controls="${prefix}-panel-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-activity="${id}">${{ mouse: 'Mouse', keyboard: 'Keyboard', disk: era.diskTab }[id]}</button>`).join('')}
    </div>
    <section role="tabpanel" id="${prefix}-panel-mouse" aria-labelledby="${prefix}-tab-mouse" data-panel="mouse">
      <p>Move here. Watch the cursor on the ${era.computer}.</p>
      <button type="button" class="mouse-pad" aria-label="Move the ${era.computer} cursor" aria-describedby="${prefix}-mouse-help ${prefix}-mouse-position" aria-pressed="false">
        <span class="mouse-pad-cursor" aria-hidden="true">↖</span>
        <span class="mouse-pad-label">Move your mouse or touch here</span>
      </button>
      <p id="${prefix}-mouse-help" class="activity-help">Arrow keys move 8 pixels. Hold Shift for 1 pixel. Hold Space or Enter to press the mouse button.</p>
      <output class="activity-status" id="${prefix}-mouse-position" aria-live="off">Cursor: 256, 171 · button up</output>
      <p class="activity-explanation">${era.mouse}</p>
    </section>
    <section role="tabpanel" id="${prefix}-panel-keyboard" aria-labelledby="${prefix}-tab-keyboard" data-panel="keyboard" hidden>
      <p>Give a small drawing program something to write.</p>
      <form class="keyboard-form">
        <label for="${prefix}-text">Your message <span>(up to 18 characters)</span></label>
        <input class="keyboard-input" id="${prefix}-text" type="text" maxlength="18" value="HELLO MAC" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="${prefix}-keyboard-help">
        <div class="disk-actions"><button type="submit" class="button primary">Type onto screen</button><button type="button" class="button" data-clear-text>Clear writing area</button></div>
      </form>
      <p id="${prefix}-keyboard-help" class="activity-help">Printable ASCII letters, numbers, and punctuation. Our original block font displays letters as capitals.</p>
      <p class="activity-status" data-keyboard-status role="status">Your message will appear near the bottom of the ${original ? 'screen' : '1984-style teaching window'}.</p>
      <p class="activity-explanation">${era.keyboard}</p>
    </section>
    <section role="tabpanel" id="${prefix}-panel-disk" aria-labelledby="${prefix}-tab-disk" data-panel="disk" hidden>
      <p>${era.removable ? `Insert a sample ${era.media}, then bring its picture into memory.` : 'Read a sample picture from the built-in SSD into the teaching window.'}</p>
      <div class="activity-disk activity-disk--${era.source}" aria-hidden="true"><span>HELLO</span><small>${era.sampleLabel}</small></div>
      <div class="disk-actions">${era.removable ? `<button type="button" class="button" data-insert-disk>${era.insertLabel}</button>` : ''}<button type="button" class="button primary" data-read-disk ${inserted ? '' : 'disabled'}>Read sample</button></div>
      <p class="activity-status" data-disk-status role="status">${era.removable ? `Drive empty. Insert the sample ${era.media} to read it.` : 'Built-in SSD ready. Read the sample to load its picture.'}</p>
      <p class="activity-explanation">${era.storage}</p>
    </section>
    <p class="activity-caveat">${era.caveat}</p>`;

  const tabs = [...host.querySelectorAll('[data-activity]')];
  const pad = $('.mouse-pad');
  const cursor = $('.mouse-pad-cursor');
  const mouseStatus = $(`#${prefix}-mouse-position`);
  const keyboardInput = $('.keyboard-input');
  const keyboardStatus = $('[data-keyboard-status]');
  const diskPanel = $('[data-panel="disk"]');
  const diskStatus = $('[data-disk-status]');
  const insertButton = $('[data-insert-disk]');
  const readButton = $('[data-read-disk]');
  diskPanel.classList.toggle('is-inserted', inserted);

  function mouseEvent(visible = true) {
    pad.setAttribute('aria-pressed', String(pressed));
    pad.classList.toggle('is-pressed', pressed);
    cursor.style.left = `${x / (WIDTH - 1) * 100}%`;
    cursor.style.top = `${y / (HEIGHT - 1) * 100}%`;
    mouseStatus.textContent = `Cursor: ${x}, ${y} · button ${pressed ? 'down' : 'up'}`;
    onActivity({ type: 'mouse', x, y, pressed, visible });
  }

  function activate(id, { focus = false, emit = true } = {}) {
    if (destroyed || !ids.includes(id)) return;
    if (active === 'mouse' && id !== 'mouse') { pressed = false; mouseEvent(false); }
    if (active === 'disk' && id !== 'disk') onActivity({ type: 'disk', source: era.source, inserted, reading: false });
    active = id;
    tabs.forEach(tab => {
      const selected = tab.dataset.activity === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    host.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== id; });
    host.dataset.activity = id;
    if (focus) tabs.find(tab => tab.dataset.activity === id).focus();
    if (emit) {
      onActivity({ type: 'focus', part: parts[id] });
      if (id === 'mouse') mouseEvent();
    }
  }

  tabs.forEach(tab => {
    listen(tab, 'click', () => activate(tab.dataset.activity));
    listen(tab, 'keydown', event => {
      let index = ids.indexOf(tab.dataset.activity);
      if (event.key === 'ArrowRight') index = (index + 1) % ids.length;
      else if (event.key === 'ArrowLeft') index = (index + ids.length - 1) % ids.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = ids.length - 1;
      else return;
      event.preventDefault(); activate(ids[index], { focus: true });
    });
  });

  function point(event) {
    const bounds = pad.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    x = Math.max(0, Math.min(WIDTH - 1, Math.round((event.clientX - bounds.left) / bounds.width * (WIDTH - 1))));
    y = Math.max(0, Math.min(HEIGHT - 1, Math.round((event.clientY - bounds.top) / bounds.height * (HEIGHT - 1))));
  }
  listen(pad, 'pointermove', event => { point(event); mouseEvent(); });
  listen(pad, 'pointerdown', event => {
    if (event.button !== 0) return;
    point(event); pressed = true;
    pad.setPointerCapture?.(event.pointerId);
    mouseEvent();
  });
  listen(pad, 'pointerup', event => { point(event); pressed = false; mouseEvent(); });
  listen(pad, 'pointercancel', () => { pressed = false; mouseEvent(); });
  listen(pad, 'lostpointercapture', () => { if (pressed) { pressed = false; mouseEvent(); } });
  listen(pad, 'blur', () => { if (pressed) { pressed = false; mouseEvent(); } });
  listen(pad, 'keydown', event => {
    const distance = event.shiftKey ? 1 : 8;
    if (event.key === 'ArrowLeft') x = Math.max(0, x - distance);
    else if (event.key === 'ArrowRight') x = Math.min(WIDTH - 1, x + distance);
    else if (event.key === 'ArrowUp') y = Math.max(0, y - distance);
    else if (event.key === 'ArrowDown') y = Math.min(HEIGHT - 1, y + distance);
    else if (event.key === ' ' || event.key === 'Enter') pressed = true;
    else return;
    event.preventDefault(); mouseEvent();
  });
  listen(pad, 'keyup', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault(); pressed = false; mouseEvent();
  });
  // Assistive technology may activate a native button without pointer/key events.
  listen(pad, 'click', event => {
    if (event.detail !== 0) return;
    pressed = true; mouseEvent();
    queueMicrotask(() => { if (!destroyed) { pressed = false; mouseEvent(active === 'mouse'); } });
  });

  function cleanInput() {
    const value = keyboardInput.value.replace(/[^\x20-\x7E]/g, '').slice(0, 18);
    if (keyboardInput.value !== value) {
      keyboardInput.value = value;
      keyboardStatus.textContent = 'Use printable ASCII letters, numbers, and punctuation, up to 18 characters.';
    }
    return value;
  }
  listen(keyboardInput, 'input', cleanInput);
  listen($('.keyboard-form'), 'submit', event => {
    event.preventDefault();
    const message = cleanInput();
    onEdit(`Keyboard program wrote your message into ${original ? 'screen memory' : 'the 1984-style teaching bitmap'}.`, () => {
      fillRect(frame, 32, 266, 448, 48, 0);
      drawText(frame, message, 40, 276, 4);
    });
    keyboardStatus.textContent = message ? `“${message.toUpperCase()}” is now drawn in ${original ? 'shared RAM' : 'the teaching window'}. Try Undo to restore the previous pixels.` : 'The writing area is clear. Enter a message to draw some glyphs.';
    onActivity({ type: 'keyboard', text: message.toUpperCase() });
  });
  listen($('[data-clear-text]'), 'click', () => {
    onEdit('Cleared the keyboard writing area.', () => fillRect(frame, 32, 266, 448, 48, 0));
    keyboardStatus.textContent = `Writing area cleared. The rest of the ${original ? 'screen memory' : 'teaching bitmap'} is unchanged.`;
    onActivity({ type: 'keyboard', text: '' });
  });

  if (insertButton) listen(insertButton, 'click', () => {
    inserted = !inserted;
    diskPanel.classList.toggle('is-inserted', inserted);
    insertButton.textContent = inserted ? era.ejectLabel : era.insertLabel;
    readButton.disabled = !inserted;
    diskStatus.textContent = inserted ? `Sample ${era.media} inserted. Read it to copy the picture into ${original ? 'screen memory' : 'the teaching window'}.` : 'Drive empty. The loaded picture stays on screen.';
    onActivity({ type: 'disk', source: era.source, inserted, reading: false });
  });
  listen(readButton, 'click', () => {
    if (!inserted) return;
    const sample = fillPattern(createFramebuffer(), 'hello');
    onEdit(`Read the ${era.sampleLabel} picture into ${original ? 'screen memory' : 'the 1984-style teaching bitmap'}.`, () => frame.set(sample));
    diskStatus.textContent = original
      ? 'Sample read: 21,888 bitmap bytes copied into shared RAM. Ejecting the disk will leave that picture in memory.'
      : `Sample read: 21,888 bytes loaded into the original-Macintosh teaching bitmap. ${era.removable ? 'Ejecting the CD leaves the loaded picture visible.' : 'The SSD stays installed; the read changes the teaching bitmap only.'}`;
    onActivity({ type: 'disk', source: era.source, inserted: true, reading: true, bytes: FRAME_BYTES });
  });

  activate('mouse', { emit: false });
  cursor.style.left = '50%'; cursor.style.top = '50%';
  return {
    activate,
    destroy() {
      if (destroyed) return;
      destroyed = true; controller.abort();
      onActivity({ type: 'mouse', x, y, pressed: false, visible: false });
      onActivity({ type: 'disk', source: era.source, inserted, reading: false });
      host.replaceChildren();
    },
  };
}
