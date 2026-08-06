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

let isOpen = true;
let mapping = [];
let scheduledTimers = [];
let audioContext = null;
let activeOscillators = new Map();
const activeNotes = new Map();
let midiPlayback = null;
let currentLayout = '142';
const persistedMappingKey = 'bandoneon-mapping-v1';

// Default fallback button color scheme by button id.
// Mapping colors in mappings.js still take precedence.
const defaultButtonColors = [
  // [buttonId, color]
  // Example: [24, 'hsl(230 70% 75%)'],
  // Example: [36, 'hsl(110 70% 75%)'],
];

function normalizeMapping(rawMapping, layout) {
  return window.bandoneonUtils.normalizeMapping(rawMapping, layout);
}

function getColorFromRange(note) {
  if (!Array.isArray(window.buttonColorRanges)) {
    return null;
  }

  let lastMatch = null;
  for (const [threshold, color] of window.buttonColorRanges) {
    if (typeof threshold !== 'number' || typeof color !== 'string') {
      continue;
    }
    if (note < threshold) {
      return color;
    }
    lastMatch = color;
  }
  return lastMatch;
}

function findButtonColor(button, activeDef, note) {
  if (activeDef && activeDef.color) {
    return activeDef.color;
  }
  if (button.color) {
    return button.color;
  }
  const rangeColor = getColorFromRange(note);
  if (rangeColor) {
    return rangeColor;
  }
  const override = defaultButtonColors.find(([id]) => Number(id) === Number(button.id));
  if (override) {
    return override[1];
  }
  return colorForMidi(note);
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
  const hue = (octave * 48 + 12) % 360;
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
    btn.style.background = findButtonColor(button, activeDef, note);
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

async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    midiStatus.textContent = 'Web MIDI not supported in this browser.';
    return;
  }
  try {
    const midiAccess = await navigator.requestMIDIAccess();
    midiStatus.textContent = 'MIDI ready. Connect a device and play.';
    midiAccess.inputs.forEach((input) => {
      input.onmidimessage = onMIDIMessage;
    });
    midiAccess.onstatechange = () => {
      midiAccess.inputs.forEach((input) => {
        input.onmidimessage = onMIDIMessage;
      });
    };
  } catch (err) {
    midiStatus.textContent = 'MIDI access denied or error.';
    console.error(err);
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
  incomingNote.textContent = note + ' (' + midiToLabel(note) + ')';
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


function playTone(note, velocity) {
  const ctx = ensureAudioContext();
  const gain = ctx.createGain();
  const oscillator = ctx.createOscillator();
  const volume = Number(volumeInput.value || 0.8);
  const instrument = instrumentSelect.value || 'sine';
  const gainValue = Math.max(0, Math.min(1, (velocity / 127) * volume));

  oscillator.type = instrument;
  oscillator.frequency.setValueAtTime(880 * Math.pow(2, (note - 69) / 12  ), ctx.currentTime);
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

toggleBtn.addEventListener('click', () => setOpenState(!isOpen));
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    setOpenState(!isOpen);
  }
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

playMidiBtn.addEventListener('click', () => {
  if (!midiPlayback) {
    alert('Load a MIDI file first.');
    return;
  }
  stopScheduled();
  midiPlayback.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      const onTime = Math.max(0, note.time * 1000);
      const offTime = Math.max(0, (note.time + note.duration) * 1000);
      const onTimer = setTimeout(() => handleNoteOn(note.midi, Math.round(note.velocity * 127)), onTime);
      const offTimer = setTimeout(() => handleNoteOff(note.midi), offTime);
      scheduledTimers.push(onTimer, offTimer);
    });
  });
  midiStatus.textContent = 'Playing MIDI...';
});

stopMidiBtn.addEventListener('click', () => {
  stopScheduled();
  stopHighlighting();
  midiStatus.textContent = 'Stopped.';
});

layoutSelect.addEventListener('change', () => loadMappingForLayout(layoutSelect.value));

loadMappingForLayout(layoutSelect.value);
initMIDI();

window._bandoneon = {
  setOpenState,
  mapping,
  loadMappingForLayout
};
