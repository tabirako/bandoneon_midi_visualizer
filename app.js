// Two-sided Bandoneon MIDI Visualizer (client-side)
// - Web MIDI input
// - MIDI file upload (parsed with @tonejs/midi)
// - Two-sided 142 / 144 button layout
// - Per-octave coloring
// - Open/Close toggle (click or Spacebar)
// - Audio playback with volume and instrument selection

const container = document.getElementById('bandoneonContainer');
const layoutSelect = document.getElementById('layoutSelect');
const hintSelect = document.getElementById('hintSelect');
const buttonColorSelect = document.getElementById('buttonColorSelect');
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

// Mouse clicks and computer-keyboard presses carry no real velocity signal
// (unlike a MIDI controller or the uploaded file), so both simulate the same
// fixed press strength rather than drifting to different made-up numbers.
const SIMULATED_VELOCITY = 100;
let currentLang = 'en';
const persistedLangKey = 'bandoneon-lang-v1';

// ---- i18n helpers -----------------------------------------------------
// Looks up `key` in the active language's dictionary (i18n.js), falling
// back to English, then to the raw key so a missing translation never
// renders blank.
function t(key) {
  const dict = window.translations[currentLang] || window.translations.en;
  return (dict && dict[key]) || window.translations.en[key] || key;
}

// Sets an element's text AND records which key produced it (via
// data-i18n), so a later language switch can re-render it correctly even
// though the text was set dynamically rather than at page load.
function setI18nText(el, key) {
  if (!el) return;
  el.dataset.i18n = key;
  el.textContent = t(key);
}

// Re-renders every translatable element in the active language: static
// [data-i18n] text, [data-i18n-html] markup (legend lines with <u> tags),
// and the <html lang> attribute screen readers rely on for pronunciation.
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  updateBellowsButtonText();
  updateMidiButtonText();
  renderMapping(); // rebuilds tooltips/side titles, which are also translated
}

// Picks a saved preference, else a translation matching the browser's
// language (with a region-based guess for Chinese script), else English.
function detectInitialLang() {
  try {
    const saved = localStorage.getItem(persistedLangKey);
    if (saved && window.translations[saved]) return saved;
  } catch (err) {
    // localStorage unavailable (private mode, etc.) — fall through
  }
  const nav = navigator.language || 'en';
  if (window.translations[nav]) return nav;
  const short = nav.split('-')[0];
  if (short === 'zh') {
    return /-(TW|HK|MO)$/i.test(nav) ? 'zh-Hant' : 'zh-Hans';
  }
  return window.translations[short] ? short : 'en';
}

function setLanguage(lang) {
  currentLang = window.translations[lang] ? lang : 'en';
  try {
    localStorage.setItem(persistedLangKey, currentLang);
  } catch (err) {
    // ignore — language just won't persist across reloads
  }
  applyTranslations();
}

// ---- Theme (Browser / Day / Night) -------------------------------------
// "Browser" leaves data-theme unset on <html> and lets styles.css's
// prefers-color-scheme media query decide. "light"/"dark" set it
// explicitly and always win over system preference (see styles.css's
// "Theme Tokens" section for the CSS half). persistedThemeKey MUST match
// the hardcoded string in the pre-paint <script> in index.html's <head> —
// that inline script re-applies a saved explicit choice before first paint
// so switching Day/Night doesn't flash the wrong theme on reload; this
// code re-derives and applies the same choice again on its own (harmless
// and idempotent) and additionally keeps #themeSelect's displayed value in
// sync.
const persistedThemeKey = 'bandoneon-theme-v1';

function detectInitialTheme() {
  try {
    const saved = localStorage.getItem(persistedThemeKey);
    if (saved === 'light' || saved === 'dark' || saved === 'browser') return saved;
  } catch (err) {
    // localStorage unavailable — fall through to the default
  }
  return 'browser';
}

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function setTheme(theme) {
  const valid = (theme === 'light' || theme === 'dark') ? theme : 'browser';
  try {
    localStorage.setItem(persistedThemeKey, valid);
  } catch (err) {
    // ignore — theme choice just won't persist across reloads
  }
  applyTheme(valid);
}

// ---- Hint mode (Default / No hint) -------------------------------------
// "No hint" hides every on-button marking that gives away which note a
// button plays — its label, computed note name, and keyboard key-cap badge
// — leaving just the colored, positioned, still-clickable circle. Done
// purely with a CSS class on #bandoneonContainer (see styles.css's
// ".hints-off" rule) rather than by changing what renderMapping() builds,
// so toggling it doesn't require a re-render and can't drift out of sync
// with what's currently on screen.
const persistedHintKey = 'bandoneon-hint-v1';

function detectInitialHint() {
  try {
    const saved = localStorage.getItem(persistedHintKey);
    if (saved === 'default' || saved === 'none') return saved;
  } catch (err) {
    // localStorage unavailable — fall through to the default
  }
  return 'default';
}

function applyHintMode(mode) {
  container.classList.toggle('hints-off', mode === 'none');
}

function setHintMode(mode) {
  const valid = mode === 'none' ? 'none' : 'default';
  try {
    localStorage.setItem(persistedHintKey, valid);
  } catch (err) {
    // ignore — hint choice just won't persist across reloads
  }
  applyHintMode(valid);
}

// ---- Button color (Rainbow / Piano / Single color) ---------------------
// Unlike hint mode, this can't be a pure CSS toggle — colorForButton()
// below computes each button's actual background/border color, so a
// change has to go through a full renderMapping() to take effect. Kept as
// its own module-level variable (rather than always reading
// buttonColorSelect.value at render time) so renderMapping() doesn't need
// to know the DOM element exists.
const persistedButtonColorKey = 'bandoneon-button-color-v1';
let buttonColorMode = 'rainbow';

function detectInitialButtonColor() {
  try {
    const saved = localStorage.getItem(persistedButtonColorKey);
    if (saved === 'rainbow' || saved === 'piano' || saved === 'mono') return saved;
  } catch (err) {
    // localStorage unavailable — fall through to the default
  }
  return 'rainbow';
}

function setButtonColorMode(mode) {
  buttonColorMode = (mode === 'piano' || mode === 'mono') ? mode : 'rainbow';
  try {
    localStorage.setItem(persistedButtonColorKey, buttonColorMode);
  } catch (err) {
    // ignore — choice just won't persist across reloads
  }
  renderMapping();
}

// Computer-keyboard mapping for the lower 4 rows of the treble (right) side.
// The row-selection logic itself lives in keyboard-mapping.js (pure,
// unit-tested — see keyboard-mapping.test.js); this just applies its result
// to this app's own state (keyboardKeyMap, button.keyCap).
let keyboardKeyMap = new Map(); // key char -> button
const heldKeyNotes = new Map(); // key char -> note currently sounding for it

function assignKeyboardKeys() {
  keyboardKeyMap = new Map();
  mapping.forEach((button) => { button.keyCap = undefined; });

  const right = mapping.filter((b) => b.side === 'right');
  window.keyboardMapping.computeKeyAssignments(right).forEach(({ key, button }) => {
    keyboardKeyMap.set(key, button);
    button.keyCap = key.toUpperCase();
  });
}

// Free-reed instrument character presets. Each instrument is built from up
// to 4 reed voices, matching how real free-reed registers are named:
//   L  = one octave below the note (bass/bassoon reed)
//   M- = the note's own octave, detuned flat (tremolo/musette partner)
//   M  = the note's own octave, in tune (the "dry" reference reed)
//   M+ = the note's own octave, detuned sharp (tremolo/musette partner)
// voiceMflat/voiceM/voiceMsharp are 0/1 switches for M-/M/M+. `harmMix`
// (0 = off) doubles as both L's on/off switch and its blend amount, rather
// than adding a redundant separate flag for it. `detune` sets how far M-/M+
// sit from true pitch — M itself is always exactly on pitch.
//
// Real bandoneons are famously "dry" (no tremolo/beating between reeds,
// unlike a wet-tuned accordion) — hence detune:0 and only the dry M voice
// on. Accordion is L + dry M + one sharp-detuned M+ (an asymmetric wet
// pair, still with a true dry reed); the *symmetric* M-/M+ pair with no dry
// M at all (no L either) is a different, specific register real accordions
// call "Sax" — not what plain "Accordion" here should sound like. Musette
// is the full wet trio (M-, M, M+ all on) with no bass reed, for the lush
// chorus/beating sound; Harmonica is the same dry-plus-sharp mid pair as
// accordion but without the bass reed.
const REED_PRESETS = {
  bandoneon: { voiceMflat: 0, voiceM: 1, voiceMsharp: 0, detune: 0, breath: 5,  vibrato: 3, filterFreq: 1500, filterQ: 0.8, harmMix: 0.35 },
  accordion: { voiceMflat: 0, voiceM: 1, voiceMsharp: 1, detune: 7, breath: 8,  vibrato: 4, filterFreq: 2200, filterQ: 1.2, harmMix: 0.5 },
  harmonica: { voiceMflat: 0, voiceM: 1, voiceMsharp: 1, detune: 3, breath: 18, vibrato: 6, filterFreq: 3200, filterQ: 3.5, harmMix: 0 },
  musette:   { voiceMflat: 1, voiceM: 1, voiceMsharp: 1, detune: 9, breath: 10, vibrato: 5, filterFreq: 2600, filterQ: 1.4, harmMix: 0 }
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

// Reed detune/bellows breath/vibrato only affect startReedVoice()'s signal
// chain — plain waveforms (sine/square/sawtooth/triangle) never read these
// sliders at all (see playTone()). Disabling them when a non-reed
// instrument is selected isn't just cosmetic: it tells the user these
// controls are currently inert, rather than implying they'd do something.
function updateReedControlsAvailability() {
  const active = isReedInstrument(instrumentSelect.value);
  [reedDetuneInput, reedBreathInput, reedVibratoInput].forEach((el) => {
    el.disabled = !active;
  });
  document.querySelectorAll('.reed-only').forEach((el) => {
    el.classList.toggle('reed-disabled', !active);
  });
}

function updateVolumeLabel() {
  volumeVal.textContent = Math.round(volumeInput.value * 100) + '%';
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

// Pitch classes with no sharp/flat (white piano keys), 0 = C.
const NATURAL_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
function isNaturalNote(note) {
  return NATURAL_PITCH_CLASSES.has(((note % 12) + 12) % 12);
}

// "Single color" and Piano's natural (white) buttons share the same ivory
// tone deliberately — it's meant to evoke a real bandoneon's light wood/bone
// buttons against a dark case, per the user's own description, not an
// arbitrary color pick.
const IVORY_BUTTON = { background: '#f4f1e8', border: '#c9c2ae' };
const PIANO_ACCIDENTAL_BUTTON = { background: '#1c1c1c', border: '#3a3a3a' };

// Returns { background, border, needsLightText } for one button, given the
// active `buttonColorMode`. `needsLightText` is only true for Piano's black
// buttons — every other mode uses a light-enough background that the
// existing fixed-dark-color .label-text/.note-text/.key-cap stay legible
// (see styles.css's ".dark-bg" override for the one case that needs it).
function colorForButton(note) {
  if (buttonColorMode === 'piano') {
    return isNaturalNote(note)
      ? { background: IVORY_BUTTON.background, border: IVORY_BUTTON.border, needsLightText: false }
      : { background: PIANO_ACCIDENTAL_BUTTON.background, border: PIANO_ACCIDENTAL_BUTTON.border, needsLightText: true };
  }
  if (buttonColorMode === 'mono') {
    return { background: IVORY_BUTTON.background, border: IVORY_BUTTON.border, needsLightText: false };
  }
  // 'rainbow' (default): the original per-octave HSL formula.
  return { background: colorForMidi(note), border: colorForAccent(note), needsLightText: false };
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
  leftTitle.textContent = t('leftSideBass');
  leftPanel.appendChild(leftTitle);
  const leftLayout = document.createElement('div');
  leftLayout.className = 'layout';
  leftPanel.appendChild(leftLayout);

  const rightPanel = document.createElement('section');
  rightPanel.className = 'panel';
  const rightTitle = document.createElement('h2');
  rightTitle.textContent = t('rightSideTreble');
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
    btn.setAttribute('title', `${button.side} • ${button.label} • ${t('stateClose')} ${button.close?.note ?? button.close} / ${t('stateOpen')} ${button.open?.note ?? button.open}`);

    const activeDef = isOpen ? button.open : button.close;
    const note = activeDef?.note ?? activeDef;
    const label = document.createElement('span');
    label.className = 'label-text';
    label.textContent = button.label;
    const noteLabel = document.createElement('span');
    noteLabel.className = 'note-text';
    noteLabel.textContent = midiToLabel(note);
    const colorInfo = colorForButton(note);
    btn.style.background = colorInfo.background;
    btn.style.borderColor = activeDef?.borderColor || button.borderColor || colorInfo.border;
    btn.classList.toggle('dark-bg', colorInfo.needsLightText);

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
      btn.setAttribute('title', btn.getAttribute('title') + ` • ${t('keyWord')} ${button.keyCap}`);
    }
    btn.appendChild(halo);
    wrapper.appendChild(btn);

    btn.addEventListener('click', () => {
      const activeNote = activeDef?.note ?? activeDef;
      const clickState = isOpen;
      if (activeNote != null) {
        handleNoteOn(activeNote, SIMULATED_VELOCITY);
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
  // button id -> velocity of the note lighting it up, so each button's glow
  // reflects its own note's strength rather than the loudest note anyone is
  // currently holding. (If two active notes somehow match the same button,
  // the louder one wins — same tie-break the old shared maxVel gave.)
  const buttonVelocities = new Map();
  const activeButtonLabels = new Set();

  activeNotes.forEach((vel, note) => {
    const matches = findMatchingButtons(note);
    matches.forEach((button) => {
      const id = String(button.id);
      buttonVelocities.set(id, Math.max(buttonVelocities.get(id) || 0, vel || 127));
      activeButtonLabels.add(t(button.side === 'left' ? 'sideLeft' : 'sideRight') + ': ' + button.label);
    });
  });

  activeButtonsSpan.textContent = Array.from(activeButtonLabels).join(', ') || '—';

  document.querySelectorAll('.button-circle').forEach((button) => {
    const vel = buttonVelocities.get(button.dataset.id);
    const isActive = vel !== undefined;
    button.classList.toggle('active', isActive);
    button.style.opacity = isActive ? '1' : '0.95';
    // vel/127 spans the full glow range (0-0.6) across the full velocity
    // range (0-127), so the loudest possible note reaches 0.6 exactly
    // instead of saturating early.
    button.style.boxShadow = isActive ? '0 0 0 2px rgba(255,255,255,' + (vel / 127 * 0.6) + '), 0 10px 24px rgba(255,255,255,0.15)' : '';
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
    setI18nText(midiStatus, 'midiNotSupported');
    return;
  }
  try {
    midiAccess = await navigator.requestMIDIAccess();
    return true;
  } catch (err) {
    setI18nText(midiStatus, 'midiAccessDenied');
    console.error(err);
    return false;
  }
}

function updateMidiButtonText() {
  const enableMidiBtn = document.getElementById('enableMidi');
  setI18nText(enableMidiBtn, midiEnabled ? 'disableMidi' : 'enableMidi');
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
          updateMidiButtonText();
          setI18nText(midiStatus, 'midiReady');
        }
      });
    } else {
      midiEnabled = true;
      attachMIDIListeners();
      updateMidiButtonText();
      setI18nText(midiStatus, 'midiReady');
    }
  } else {
    // Disable MIDI
    midiEnabled = false;
    detachMIDIListeners();
    updateMidiButtonText();
    setI18nText(midiStatus, 'midiDisabledStatus');
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

function updateBellowsButtonText() {
  setI18nText(toggleBtn, isOpen ? 'bellowsButtonOpen' : 'bellowsButtonClose');
}

function setOpenState(open) {
  isOpen = !!open;
  updateBellowsButtonText();
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

// Builds a free-reed voice out of up to 4 reed oscillators per the preset's
// voiceMflat/voiceM/voiceMsharp/harmMix switches (see REED_PRESETS above:
// M-/M/M+ at the note's own octave, L an octave below), a low-pass filter
// for reed-like timbre, filtered noise for bellows breath, and an LFO for
// vibrato. All 4 reed oscillators are always created (matching the rest of
// this codebase's style — see oscSub previously) with an inactive voice's
// gain simply left at 0, rather than conditionally building the node graph.
// The voice sustains until stopReedVoice() is called, matching how a real
// reed sounds for as long as air keeps moving over it.
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

  // M-, M, M+: three reeds at the note's own pitch. M stays exactly on
  // pitch; M-/M+ are detuned by the full slider value in opposite
  // directions from it (not halved — M is the true center now, unlike the
  // old model where the only two mid oscillators were always a symmetric
  // detuned pair with no dry reed at all).
  const oscMflat = ctx.createOscillator();
  const oscM = ctx.createOscillator();
  const oscMsharp = ctx.createOscillator();
  [oscMflat, oscM, oscMsharp].forEach((o) => { o.type = 'sawtooth'; o.frequency.value = freq; });
  oscMflat.detune.value = -detuneCents;
  oscMsharp.detune.value = detuneCents;

  const gainMflat = ctx.createGain();
  const gainM = ctx.createGain();
  const gainMsharp = ctx.createGain();
  gainMflat.gain.value = preset.voiceMflat;
  gainM.gain.value = preset.voiceM;
  gainMsharp.gain.value = preset.voiceMsharp;

  // L: one octave down. harmMix doubles as both L's on/off switch and its
  // blend level (0 = no bass reed at all — harmonica and musette).
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
  lfoGain.connect(oscMflat.detune);
  lfoGain.connect(oscM.detune);
  lfoGain.connect(oscMsharp.detune);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = preset.filterFreq;
  filter.Q.value = preset.filterQ;

  // More simultaneously-active reed voices sum to more amplitude, so
  // headroom scales down by how many are actually on for this preset
  // (sqrt, not linear — a gentler rolloff than fully compensating, so a
  // fuller preset like Musette still sounds a bit fuller than a sparser one
  // like Bandoneon, not identically loud). The flat 0.75 (was a flat 0.9,
  // with no voice-count compensation at all) is a further deliberate trim,
  // since the reed path summing multiple oscillators was noticeably louder
  // than the plain single-oscillator waveforms (sine/square/etc).
  const activeVoices = preset.voiceMflat + preset.voiceM + preset.voiceMsharp + (preset.harmMix > 0 ? 1 : 0);
  const reedGain = ctx.createGain();
  reedGain.gain.value = 0.75 / Math.sqrt(Math.max(1, activeVoices));

  oscMflat.connect(gainMflat);
  gainMflat.connect(filter);
  oscM.connect(gainM);
  gainM.connect(filter);
  oscMsharp.connect(gainMsharp);
  gainMsharp.connect(filter);
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

  oscMflat.start(now);
  oscM.start(now);
  oscMsharp.start(now);
  oscSub.start(now);
  lfo.start(now);
  noiseSrc.start(now);

  return { oscMflat, oscM, oscMsharp, oscSub, lfo, noiseSrc, master, noiseGain };
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
  [voice.oscMflat, voice.oscM, voice.oscMsharp, voice.oscSub, voice.lfo, voice.noiseSrc].forEach((n) => {
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
  updateReedControlsAvailability();
});
[reedDetuneInput, reedBreathInput, reedVibratoInput].forEach((el) => {
  el.addEventListener('input', updateReedLabels);
});
if (isReedInstrument(instrumentSelect.value)) {
  applyReedPreset(instrumentSelect.value);
} else {
  updateReedLabels();
}
updateReedControlsAvailability();

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
  handleNoteOn(note, SIMULATED_VELOCITY);
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
      setI18nText(midiStatus, 'mappingLoaded');
    } catch (err) {
      console.error(err);
      alert(t('invalidMappingJson'));
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
      setI18nText(midiStatus, 'midiFileLoaded');
      midiProgressInput.max = String(Math.max(1, Math.round(parsedMidi.duration * 1000)));
      midiProgressInput.value = '0';
      updateProgressUI(0);
    } catch (err) {
      console.error(err);
      alert(t('failedParseMidi'));
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
      setI18nText(midiStatus, 'finished');
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
  setI18nText(midiStatus, 'playingMidi');
}

playMidiBtn.addEventListener('click', () => {
  if (!midiPlayback) {
    alert(t('loadMidiFirst'));
    return;
  }
  schedulePlaybackFrom(0);
});

stopMidiBtn.addEventListener('click', () => {
  stopScheduled();
  stopAllActiveNotes();
  stopProgressTimer();
  updateProgressUI(0);
  setI18nText(midiStatus, 'stoppedStatus');
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

// Populate the language switcher from i18n.js's language list, so adding a
// new language there needs no HTML changes.
const langSelect = document.getElementById('langSelect');
if (langSelect) {
  Object.keys(window.languageNames).forEach((code) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = window.languageNames[code];
    langSelect.appendChild(opt);
  });
  langSelect.addEventListener('change', () => setLanguage(langSelect.value));
}

const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
  themeSelect.addEventListener('change', () => setTheme(themeSelect.value));
}

if (hintSelect) {
  hintSelect.addEventListener('change', () => setHintMode(hintSelect.value));
}

if (buttonColorSelect) {
  buttonColorSelect.addEventListener('change', () => setButtonColorMode(buttonColorSelect.value));
}

// Set before the first loadMappingForLayout() (which triggers the first
// renderMapping()) rather than after, so a saved non-default choice is
// correct on first paint instead of only from the next re-render on.
buttonColorMode = detectInitialButtonColor();
if (buttonColorSelect) buttonColorSelect.value = buttonColorMode;

loadMappingForLayout(layoutSelect.value);

currentLang = detectInitialLang();
if (langSelect) langSelect.value = currentLang;
applyTranslations();

const initialTheme = detectInitialTheme();
if (themeSelect) themeSelect.value = initialTheme;
applyTheme(initialTheme);

const initialHint = detectInitialHint();
if (hintSelect) hintSelect.value = initialHint;
applyHintMode(initialHint);

window._bandoneon = {
  setOpenState,
  mapping,
  loadMappingForLayout
};

