// Two-sided Bandoneon MIDI Visualizer (client-side)
// - Web MIDI input
// - MIDI file upload (parsed with @tonejs/midi)
// - Two-sided 142 / 144 button layout
// - Per-octave coloring
// - Open/Close toggle (click or Spacebar)
// - Audio playback with volume and instrument selection

const container = document.getElementById('bandoneonContainer');
const layoutSelect = document.getElementById('layoutSelect');
const toggleBtn = document.getElementById('toggleOpenClose');
const mappingFileInput = document.getElementById('mappingFile');
const midiFileInput = document.getElementById('midiFile');
const playMidiBtn = document.getElementById('playMidi');
const stopMidiBtn = document.getElementById('stopMidi');
const midiStatus = document.getElementById('midiStatus');
const incomingNote = document.getElementById('incomingNote');
const incomingVel = document.getElementById('incomingVel');
const activeButtonsSpan = document.getElementById('activeButtons');
const instrumentSelect = document.getElementById('instrumentSelect');
const volumeInput = document.getElementById('volume');
const volumeVal = document.getElementById('volumeVal');
const reedDetuneInput = document.getElementById('reedDetune');
const reedBreathInput = document.getElementById('reedBreath');
const reedVibratoInput = document.getElementById('reedVibrato');
const reedDetuneVal = document.getElementById('reedDetuneVal');
const reedBreathVal = document.getElementById('reedBreathVal');
const reedVibratoVal = document.getElementById('reedVibratoVal');
const midiProgressInput = document.getElementById('midiProgress');
const midiTimeLabel = document.getElementById('midiTime');

let isOpen = true;
let mapping = [];
let scheduledTimers = [];
let playbackWallStartMs = 0;
let progressTimer = null;
let isSeekingProgress = false;
let audioContext = null;
let activeOscillators = new Map();
const activeReedVoices = new Map();
const activeNotes = new Map();
let reedNoiseBuffer = null;
let midiAccess = null;
let midiEnabled = false;

// Computer-keyboard mapping for the lower 4 rows of the treble (right) side.
// Rows are read from each button's explicit `row` field (added by
// add_row_order.js and verified against the reference charts), rather than
// inferred from `id` order. Row 1 is the topmost/narrowest row.
//
// Different systems have different total row counts (Rheinische treble has
// 6 rows, Einheits has 5) AND different button-counts per row (Rheinische's
// lower 4 rows are [6,7,8,8], Einheits' are [7,7,8,9]). Rather than hardcode
// one fixed key set per keyboard row, each is defined as the FULL physical
// row (10 keys) plus a "default anchor" — the slice used when a data row's
// length matches the common case. When a row needs MORE keys than the
// default provides, the selection extends outward from the anchor (e.g. the
// bottom row's default is X-. (8 keys); a 9-button row extends left to
// include Z, rather than needing a special case). This is what lets a new
// system with different row lengths (or a future non-bandoneon layout, like
// concertina/Chemnitzer) work by just adding its row-length data — no
// keyboard-assignment code changes needed.
const PHYSICAL_KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];
// The slice used when a row's button count matches the common case
// (Rheinische's lower 4 rows: 6, 7, 8, 8). {start, length} are indices into
// the corresponding PHYSICAL_KEYBOARD_ROWS entry above.
const DEFAULT_ROW_ANCHORS = [
  { start: 3, length: 7 }, // '4'-'0'
  { start: 2, length: 7 }, // 'e'-'o'
  { start: 1, length: 8 }, // 's'-'l'
  { start: 1, length: 8 }  // 'x'-'.'
];

// Picks `neededLength` keys from physical row `rowIndex`. Matches the
// default anchor when possible; when more keys are needed, extends toward
// the outer edge of the row (lower index first) so the "standard" keys
// (e.g. X-.) stay in place and only gain a neighbor (Z) rather than shifting.
function selectKeysForRow(rowIndex, neededLength) {
  const physicalRow = PHYSICAL_KEYBOARD_ROWS[rowIndex];
  const anchor = DEFAULT_ROW_ANCHORS[rowIndex];
  let start = anchor.start;
  let length = Math.min(neededLength, anchor.length);
  if (neededLength > anchor.length) {
    const extra = neededLength - anchor.length;
    start = Math.max(0, anchor.start - extra);
    length = Math.min(neededLength, physicalRow.length - start);
  }
  return physicalRow.slice(start, start + length);
}

let keyboardKeyMap = new Map(); // key char -> button
const heldKeyNotes = new Map(); // key char -> note currently sounding for it

function assignKeyboardKeys() {
  keyboardKeyMap = new Map();
  mapping.forEach((button) => { button.keyCap = undefined; });

  const right = mapping.filter((b) => b.side === 'right');
  const maxRow = right.reduce((max, b) => Math.max(max, b.row || 0), 0);
  const keyboardRowStart = Math.max(1, maxRow - PHYSICAL_KEYBOARD_ROWS.length + 1);

  for (let i = 0; i < PHYSICAL_KEYBOARD_ROWS.length; i++) {
    const rowNumber = keyboardRowStart + i;
    const rowButtons = right
      .filter((b) => b.row === rowNumber)
      .sort((a, b) => a.order - b.order);
    const keys = selectKeysForRow(i, rowButtons.length);
    rowButtons.forEach((button, idx) => {
      const key = keys[idx];
      if (!key) return;
      keyboardKeyMap.set(key, button);
      button.keyCap = key.toUpperCase();
    });
  }
}

// Free-reed instrument character presets: reed-pair detune (beating), bellows
// breath noise level, vibrato depth, and filter shaping per instrument.
const REED_PRESETS = {
  accordion: { detune: 7,  breath: 8,  vibrato: 4, filterFreq: 2200, filterQ: 1.2, harmMix: 0.5 },
  harmonica: { detune: 3,  breath: 18, vibrato: 6, filterFreq: 3200, filterQ: 3.5, harmMix: 0.8 },
  bandoneon: { detune: 0, breath: 5,  vibrato: 3, filterFreq: 1500, filterQ: 0.8, harmMix: 0.35 }
};

function isReedInstrument(name) {
  return Object.prototype.hasOwnProperty.call(REED_PRESETS, name);
}

function applyReedPreset(name) {
  const preset = REED_PRESETS[name];
  if (!preset) return;
  reedDetuneInput.value = preset.detune;
  reedBreathInput.value = preset.breath;
  reedVibratoInput.value = preset.vibrato;
  updateReedLabels();
}

function updateReedLabels() {
  reedDetuneVal.textContent = reedDetuneInput.value;
  reedBreathVal.textContent = (reedBreathInput.value / 100).toFixed(2);
  reedVibratoVal.textContent = reedVibratoInput.value;
}

function updateVolumeLabel() {
  volumeVal.textContent = Number(volumeInput.value).toFixed(2);
}

let midiPlayback = null;
let currentLayout = '142-rheinische';
const persistedMappingKey = 'bandoneon-mapping-v1';


function normalizeMapping(rawMapping, layout) {
  return window.bandoneonUtils.normalizeMapping(rawMapping, layout);
}

function findMatchingButtons(note, openState = isOpen) {
  return window.bandoneonUtils.findMatchingButtons(mapping, note, openState);
}

function mappingStorageKey(layout){
  return persistedMappingKey + '-' + layout;
}

function loadMappingForLayout(layout) {
  currentLayout = layout;
  let parsed = null;
  try {
    const saved = localStorage.getItem(mappingStorageKey(layout));
    parsed = saved ? JSON.parse(saved) : null;
  } catch (err) {
    parsed = null;
  }
  if(parsed && Array.isArray(parsed) && parsed.length > 0){
    mapping = normalizeMapping(parsed, layout);
  } else if(window.defaultMappings && Array.isArray(window.defaultMappings[layout])){
    mapping = normalizeMapping(window.defaultMappings[layout], layout);
  } else {
    mapping = normalizeMapping([], layout);
  }
  assignKeyboardKeys();
  renderMapping();
}

/** 
because we stringify the mapping here, we do not need to worry about
if we add "" to each&every strings
*/
function persistMapping() {
  localStorage.setItem(mappingStorageKey(currentLayout), JSON.stringify(mapping)); 
}

function colorForMidi(note) {
  const octave = Math.floor(note / 12);
  const hue = (octave * 48 + 30) % 360;
  return 'hsl(' + hue + ' 70% 70%)';
}

function colorForAccent(note) {
  const octave = Math.floor(note / 12);
  const hue = (octave * 48 + 30) % 360;
  return 'hsl(' + hue + ' 65% 55%)';
}

function midiToLabel(note) {
  if (note == null) return '—';
  const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return names[note % 12] + octave;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderMapping() {
  container.innerHTML = '';
  if (!mapping.length) {
    return;
  }

  const leftPanel = document.createElement('section');
  leftPanel.className = 'panel';
  const leftTitle = document.createElement('h2');
  leftTitle.textContent = 'Left side · Bass';
  leftPanel.appendChild(leftTitle);
  const leftLayout = document.createElement('div');
  leftLayout.className = 'layout';
  leftPanel.appendChild(leftLayout);

  const rightPanel = document.createElement('section');
  rightPanel.className = 'panel';
  const rightTitle = document.createElement('h2');
  rightTitle.textContent = 'Right side · Treble';
  rightPanel.appendChild(rightTitle);
  const rightLayout = document.createElement('div');
  rightLayout.className = 'layout';
  rightPanel.appendChild(rightLayout);

  mapping.forEach((button) => {
    const btn = document.createElement('button');
    btn.className = 'button-circle';
    btn.type = 'button';
    btn.dataset.id = button.id;
    btn.dataset.close = button.close?.note ?? button.close;
    btn.dataset.open = button.open?.note ?? button.open;
    btn.dataset.side = button.side;
    btn.dataset.label = button.label;
    btn.setAttribute('title', `${button.side} • ${button.label} • close ${button.close?.note ?? button.close} / open ${button.open?.note ?? button.open}`);

    const activeDef = isOpen ? button.open : button.close;
    const note = activeDef?.note ?? activeDef;
    const label = document.createElement('span');
    label.className = 'label-text';
    label.textContent = button.label;
    const noteLabel = document.createElement('span');
    noteLabel.className = 'note-text';
    noteLabel.textContent = midiToLabel(note);
    btn.style.background = colorForMidi(note);
    btn.style.borderColor = activeDef?.borderColor || button.borderColor || colorForAccent(note);

    const wrapper = document.createElement('div');
    wrapper.className = 'button-wrapper';
    const x = typeof button.x === 'number' ? button.x : undefined;
    const y = typeof button.y === 'number' ? button.y : undefined;
    if (typeof x === 'number' && typeof y === 'number') {
      wrapper.style.position = 'absolute';
      wrapper.style.left = (x * 100) + '%';
      wrapper.style.top = (y * 100) + '%';
      wrapper.style.transform = 'translate(-50%, -50%)';
    } else {
      wrapper.style.position = 'relative';
      if (typeof button.row === 'number') {
        wrapper.style.gridRowStart = button.row;
      }
      if (typeof button.col === 'number') {
        wrapper.style.gridColumnStart = button.col;
      }
    }

    const halo = document.createElement('span');
    halo.className = 'halo';
    btn.appendChild(label);
    btn.appendChild(noteLabel);
    if (button.keyCap) {
      const keyCapEl = document.createElement('span');
      keyCapEl.className = 'key-cap';
      keyCapEl.textContent = button.keyCap;
      btn.appendChild(keyCapEl);
      btn.setAttribute('title', btn.getAttribute('title') + ` • key ${button.keyCap}`);
    }
    btn.appendChild(halo);
    wrapper.appendChild(btn);

    btn.addEventListener('click', () => {
      const activeNote = activeDef?.note ?? activeDef;
      const clickState = isOpen;
      if (activeNote != null) {
        handleNoteOn(activeNote, 127);
        setTimeout(() => handleNoteOff(activeNote, clickState), 220);
      }
    });

    const layout = button.side === 'right' ? rightLayout : leftLayout;
    layout.appendChild(wrapper);
  });

  container.appendChild(leftPanel);
  container.appendChild(rightPanel);
  updateButtonHighlights();
}

function updateButtonHighlights() {
  const activeButtonIds = new Set();
  const activeButtonLabels = new Set();
  let maxVel = 0;

  activeNotes.forEach((vel, note) => {
    const matches = findMatchingButtons(note);
    matches.forEach((button) => {
      activeButtonIds.add(String(button.id));
      activeButtonLabels.add(button.side + ': ' + button.label);
    });
    maxVel = Math.max(maxVel, vel || 127);
  });

  activeButtonsSpan.textContent = Array.from(activeButtonLabels).join(', ') || '—';

  document.querySelectorAll('.button-circle').forEach((button) => {
    const isActive = activeButtonIds.has(button.dataset.id);
    button.classList.toggle('active', isActive);
    button.style.opacity = isActive ? '1' : '0.95';
    button.style.boxShadow = isActive ? '0 0 0 2px rgba(255,255,255,' + Math.min(0.6, maxVel / 160) + '), 0 10px 24px rgba(255,255,255,0.15)' : '';
  });
}

function highlightButtonsForNote(note, on = true, vel = 127) {
  if (!mapping.length) return;

  if (on) {
    activeNotes.set(note, vel);
  } else {
    activeNotes.delete(note);
  }

  updateButtonHighlights();
}

function attachMIDIListeners() {
  if (!midiAccess) return;
  midiAccess.inputs.forEach((input) => {
    input.onmidimessage = onMIDIMessage;
  });
  midiAccess.onstatechange = () => {
    midiAccess.inputs.forEach((input) => {
      input.onmidimessage = onMIDIMessage;
    });
  };
}

function detachMIDIListeners() {
  if (!midiAccess) return;
  midiAccess.inputs.forEach((input) => {
    input.onmidimessage = null;
  });
  midiAccess.onstatechange = null;
}

async function requestMIDIAccess() {
  if (!navigator.requestMIDIAccess) {
    midiStatus.textContent = 'Web MIDI not supported in this browser.';
    return;
  }
  try {
    midiAccess = await navigator.requestMIDIAccess();
    return true;
  } catch (err) {
    midiStatus.textContent = 'MIDI access denied or error.';
    console.error(err);
    return false;
  }
}

function toggleMIDI() {
  const enableMidiBtn = document.getElementById('enableMidi');
  if (!enableMidiBtn) return;

  if (!midiEnabled) {
    // Enable MIDI
    if (!midiAccess) {
      requestMIDIAccess().then((success) => {
        if (success) {
          midiEnabled = true;
          attachMIDIListeners();
          enableMidiBtn.textContent = 'Disable MIDI Keyboard';
          midiStatus.textContent = 'MIDI ready. Connect a device and play.';
        }
      });
    } else {
      midiEnabled = true;
      attachMIDIListeners();
      enableMidiBtn.textContent = 'Disable MIDI Keyboard';
      midiStatus.textContent = 'MIDI ready. Connect a device and play.';
    }
  } else {
    // Disable MIDI
    midiEnabled = false;
    detachMIDIListeners();
    enableMidiBtn.textContent = 'Enable MIDI Keyboard';
    midiStatus.textContent = 'MIDI disabled.';
  }
}

/** 
 Instead of sending a NOTEOFF, some midi devices sent a NOTEON and VEL=0 
*/
function onMIDIMessage(ev) {
  const [status, data1, data2] = ev.data;
  const cmd = status & 0xf0;
  if (cmd === 0x90 && data2 > 0) {
    handleNoteOn(data1, data2);
  } else if ((cmd === 0x80) || (cmd === 0x90 && data2 === 0)) {
    handleNoteOff(data1);
  }
}

function handleNoteOn(note, vel) {
  incomingNote.textContent = midiToLabel(note) + ' (' + note + ')';
  incomingVel.textContent = vel;
  highlightButtonsForNote(note, true, vel);
  playTone(note, vel);
}

function stopHighlighting(note) {
  if (note != null) {
    activeNotes.delete(note);
    updateButtonHighlights();
    return;
  }

  activeNotes.clear();
  updateButtonHighlights();
}

function handleNoteOff(note) {
  stopHighlighting(note);
  stopTone(note);
}

function setOpenState(open) {
  isOpen = !!open;
  toggleBtn.textContent = 'Mode: ' + (isOpen ? 'Open' : 'Close');
  renderMapping();
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Shared noise buffer used for the bellows/breath texture on reed voices.
function getReedNoiseBuffer(ctx) {
  if (reedNoiseBuffer) return reedNoiseBuffer;
  const len = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  reedNoiseBuffer = buffer;
  return buffer;
}

// Builds a free-reed voice: two detuned sawtooth "reeds" (the slight offset
// creates the characteristic beating/chorus), a sub-octave layer for body,
// a low-pass filter for reed-like timbre, filtered noise for bellows breath,
// and an LFO for vibrato. The voice sustains until stopReedVoice() is called,
// matching how a real reed sounds for as long as air keeps moving over it.
function startReedVoice(note, velocity, instrument) {
  const ctx = ensureAudioContext();
  const preset = REED_PRESETS[instrument];
  const freq = 440 * Math.pow(2, (note - 57) / 12);
  const volume = Number(volumeInput.value || 0.8);
  const targetGain = Math.max(0, Math.min(1, (velocity / 127) * volume));

  const detuneCents = Number(reedDetuneInput.value);
  const breathAmt = Number(reedBreathInput.value) / 100;
  const vibDepth = Number(reedVibratoInput.value);

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.connect(ctx.destination);

  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  oscA.type = 'sawtooth';
  oscB.type = 'sawtooth';
  oscA.frequency.value = freq;
  oscB.frequency.value = freq;
  oscA.detune.value = -detuneCents / 2;
  oscB.detune.value = detuneCents / 2;

  const oscSub = ctx.createOscillator();
  oscSub.type = 'triangle';
  oscSub.frequency.value = freq / 2;
  const subGain = ctx.createGain();
  subGain.gain.value = preset.harmMix * 0.3;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = vibDepth;
  lfo.connect(lfoGain);
  lfoGain.connect(oscA.detune);
  lfoGain.connect(oscB.detune);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = preset.filterFreq;
  filter.Q.value = preset.filterQ;

  const reedGain = ctx.createGain();
  reedGain.gain.value = 0.9;

  oscA.connect(filter);
  oscB.connect(filter);
  oscSub.connect(subGain);
  subGain.connect(filter);
  filter.connect(reedGain);
  reedGain.connect(master);

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = getReedNoiseBuffer(ctx);
  noiseSrc.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = freq * 2;
  noiseFilter.Q.value = 0.7;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);

  master.gain.linearRampToValueAtTime(targetGain, now + 0.09);
  noiseGain.gain.linearRampToValueAtTime(breathAmt * targetGain, now + 0.03);
  noiseGain.gain.linearRampToValueAtTime(breathAmt * targetGain * 0.4, now + 0.25);

  oscA.start(now);
  oscB.start(now);
  oscSub.start(now);
  lfo.start(now);
  noiseSrc.start(now);

  return { oscA, oscB, oscSub, lfo, noiseSrc, master, noiseGain };
}

function stopReedVoice(voice) {
  const ctx = ensureAudioContext();
  const now = ctx.currentTime;
  const releaseTime = 0.18;
  voice.master.gain.cancelScheduledValues(now);
  voice.master.gain.setValueAtTime(voice.master.gain.value, now);
  voice.master.gain.linearRampToValueAtTime(0, now + releaseTime);
  voice.noiseGain.gain.cancelScheduledValues(now);
  voice.noiseGain.gain.setValueAtTime(voice.noiseGain.gain.value, now);
  voice.noiseGain.gain.linearRampToValueAtTime(0, now + releaseTime);
  [voice.oscA, voice.oscB, voice.oscSub, voice.lfo, voice.noiseSrc].forEach((n) => {
    n.stop(now + releaseTime + 0.02);
  });
}


function playTone(note, velocity) {
  const instrument = instrumentSelect.value || 'sine';

  if (isReedInstrument(instrument)) {
    // Retrigger cleanly if this note is already sounding (e.g. a fast repeat
    // without a note-off in between).
    const existing = activeReedVoices.get(note);
    if (existing) {
      stopReedVoice(existing);
      activeReedVoices.delete(note);
    }
    const voice = startReedVoice(note, velocity, instrument);
    activeReedVoices.set(note, voice);
    return;
  }

  const ctx = ensureAudioContext();
  const gain = ctx.createGain();
  const oscillator = ctx.createOscillator();
  const volume = Number(volumeInput.value || 0.8);
  const gainValue = Math.max(0, Math.min(1, (velocity / 127) * volume));

  oscillator.type = instrument;
  oscillator.frequency.setValueAtTime(440 * Math.pow(2, (note - 57) / 12  ), ctx.currentTime);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.35);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.4);

  activeOscillators.set(note, oscillator);
  setTimeout(() => activeOscillators.delete(note), 450);
}

function stopTone(note) {
  const reedVoice = activeReedVoices.get(note);
  if (reedVoice) {
    stopReedVoice(reedVoice);
    activeReedVoices.delete(note);
    return;
  }

  const osc = activeOscillators.get(note);
  if (osc) {
    try {
      osc.stop();
    } catch (err) {
      // ignore
    }
    activeOscillators.delete(note);
  }
}

instrumentSelect.addEventListener('change', () => {
  if (isReedInstrument(instrumentSelect.value)) {
    applyReedPreset(instrumentSelect.value);
  }
});
[reedDetuneInput, reedBreathInput, reedVibratoInput].forEach((el) => {
  el.addEventListener('input', updateReedLabels);
});
if (isReedInstrument(instrumentSelect.value)) {
  applyReedPreset(instrumentSelect.value);
} else {
  updateReedLabels();
}

toggleBtn.addEventListener('click', () => setOpenState(!isOpen));

function isTypingIntoControl() {
  const tag = document.activeElement && document.activeElement.tagName;
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
}

window.addEventListener('keydown', (event) => {
  if (isTypingIntoControl()) return;

  if (event.code === 'Space') {
    event.preventDefault();
    setOpenState(!isOpen);
    return;
  }

  const key = event.key.toLowerCase();
  if (heldKeyNotes.has(key)) return; // ignore OS key-repeat while already held
  const button = keyboardKeyMap.get(key);
  if (!button) return;

  event.preventDefault();
  // Bellows direction is committed at the moment of attack, same as a real
  // reed instrument — flipping Space mid-hold shouldn't change notes already
  // sounding.
  const activeDef = isOpen ? button.open : button.close;
  const note = activeDef?.note ?? activeDef;
  if (note == null) return;
  heldKeyNotes.set(key, note);
  handleNoteOn(note, 100);
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (!heldKeyNotes.has(key)) return;
  const note = heldKeyNotes.get(key);
  heldKeyNotes.delete(key);
  handleNoteOff(note);
});

mappingFileInput?.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) {
        throw new Error('Mapping JSON must be an array of objects.');
      }
      mapping = normalizeMapping(parsed, currentLayout);
      persistMapping();
      renderMapping();
      midiStatus.textContent = 'Mapping loaded and saved.';
    } catch (err) {
      console.error(err);
      alert('Invalid mapping JSON.');
    }
  };
  reader.readAsText(file);
});


midiFileInput?.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsedMidi = new Midi(reader.result);
      midiPlayback = parsedMidi;
      midiStatus.textContent = 'MIDI file loaded. Click Play.';
      midiProgressInput.max = String(Math.max(1, Math.round(parsedMidi.duration * 1000)));
      midiProgressInput.value = '0';
      updateProgressUI(0);
    } catch (err) {
      console.error(err);
      alert('Failed to parse MIDI file.');
    }
  };
  reader.readAsArrayBuffer(file);
});

function stopScheduled() {
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers = [];
}

// Silences any notes that are still actually sounding (reed voices sustain
// until note-off, so a Stop or a seek needs to explicitly cut them, not just
// clear the on-screen highlight).
function stopAllActiveNotes() {
  Array.from(activeNotes.keys()).forEach((note) => handleNoteOff(note));
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function updateProgressUI(currentSeconds) {
  const duration = midiPlayback ? midiPlayback.duration : 0;
  const clamped = Math.max(0, Math.min(currentSeconds, duration));
  if (!isSeekingProgress) {
    midiProgressInput.value = String(Math.round(clamped * 1000));
  }
  midiTimeLabel.textContent = formatTime(clamped) + '\u00A0/\u00A0' + formatTime(duration);
}

function startProgressTimer() {
  stopProgressTimer();
  progressTimer = setInterval(() => {
    const elapsed = (Date.now() - playbackWallStartMs) / 1000;
    updateProgressUI(elapsed);
    if (midiPlayback && elapsed >= midiPlayback.duration) {
      stopProgressTimer();
      midiStatus.textContent = 'Finished.';
    }
  }, 100);
}

function stopProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

// Schedules playback starting at offsetSeconds into the track. Used both by
// the Play button (offset 0) and by dragging the progress slider (seeking).
function schedulePlaybackFrom(offsetSeconds) {
  stopScheduled();
  stopAllActiveNotes();
  midiPlayback.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      const relOn = note.time - offsetSeconds;
      const relOff = (note.time + note.duration) - offsetSeconds;
      if (relOff <= 0) return; // this note is entirely in the past from here
      const onDelay = Math.max(0, relOn) * 1000;
      const offDelay = Math.max(0, relOff) * 1000;
      const onTimer = setTimeout(() => handleNoteOn(note.midi, Math.round(note.velocity * 127)), onDelay);
      const offTimer = setTimeout(() => handleNoteOff(note.midi), offDelay);
      scheduledTimers.push(onTimer, offTimer);
    });
  });
  playbackWallStartMs = Date.now() - offsetSeconds * 1000;
  updateProgressUI(offsetSeconds);
  startProgressTimer();
  midiStatus.textContent = 'Playing MIDI...';
}

playMidiBtn.addEventListener('click', () => {
  if (!midiPlayback) {
    alert('Load a MIDI file first.');
    return;
  }
  schedulePlaybackFrom(0);
});

stopMidiBtn.addEventListener('click', () => {
  stopScheduled();
  stopAllActiveNotes();
  stopProgressTimer();
  updateProgressUI(0);
  midiStatus.textContent = 'Stopped.';
});

midiProgressInput.addEventListener('input', () => {
  isSeekingProgress = true;
  const seconds = Number(midiProgressInput.value) / 1000;
  const duration = midiPlayback ? midiPlayback.duration : 0;
  midiTimeLabel.textContent = formatTime(seconds) + '\u00A0/\u00A0' + formatTime(duration);
});

midiProgressInput.addEventListener('change', () => {
  isSeekingProgress = false;
  const seconds = Number(midiProgressInput.value) / 1000;
  if (midiPlayback) {
    schedulePlaybackFrom(seconds);
  }
});

layoutSelect.addEventListener('change', () => loadMappingForLayout(layoutSelect.value));

volumeInput.addEventListener('input', updateVolumeLabel);
updateVolumeLabel();

const enableMidiBtn = document.getElementById('enableMidi');
if (enableMidiBtn) {
  enableMidiBtn.addEventListener('click', toggleMIDI);
}

loadMappingForLayout(layoutSelect.value);

window._bandoneon = {
  setOpenState,
  mapping,
  loadMappingForLayout
};
