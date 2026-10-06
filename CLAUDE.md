# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, client-side web app (plain HTML/CSS/vanilla JS, no framework, no build step, no npm dependencies) that visualizes free-reed instrument keyboards (Rheinische 142 and Einheits 144 bandoneon, Anglo 30-button concertina in Wheatstone and Jeffries layouts, Anglo-German 20-button, English 48-button concertina). It lights up buttons from live Web MIDI, uploaded `.mid` files, mouse/touch, or the computer keyboard, and synthesizes audio with Web Audio. Hosted on GitHub Pages (see `CNAME`). `@tonejs/midi` is loaded from a CDN in `index.html`.

[handoff.md](handoff.md) is a long design document (data provenance, decision log, per-feature notes). Read the relevant section before changing reed synthesis, keyboard mapping, i18n, theme, hint mode, or instrument data. Parts of it may lag the code (e.g. its file table), so trust the code where they disagree.

## Commands

- Run: open `index.html`, or `python -m http.server` and visit `http://localhost:8000/`.
- Tests are plain Node scripts using `test-helpers.js` (no framework). Run one file at a time; there is no aggregate runner:
  - `node bandoneon-utils.test.js`
  - `node keyboard-mapping.test.js`
  - `node instruments.test.js`
- Syntax check: `node --check app.js` (works on any of the browser files). There is no linter or formatter.
- `app.js` and anything touching the DOM/audio is not unit-tested; verify in a browser.
- `accordion_analysis/` holds offline Python; its scripts are run by hand and are not part of any test or build.

## Architecture

Everything is loaded as classic `<script>` tags in `index.html`, in this order, and each file publishes onto `window` (no modules, no bundler):

`i18n.js` → `bandoneon-utils.js` → `keyboard-mapping.js` → `mappings.js` → `mappings-concertina.js` → `instruments.js` → `accordion-harmonics.js` → `bandoneon-harmonics.js` → `app.js`

Load order matters: `mappings-concertina.js` merges into `window.defaultMappings` created by `mappings.js`, and `app.js` runs last and reads everything else. The Node tests get around the lack of modules by setting `global.window = global` before `require()`-ing the browser scripts; keep the pure-logic files (`bandoneon-utils.js`, `keyboard-mapping.js`) DOM-free so they stay testable.

- **`mappings*.js`** — `window.defaultMappings[systemId]` is an array of buttons: `{id, side: 'left'|'right', label, row, order, x, y, open:{note}, close:{note}}`. `x`/`y` are normalized absolute positions (not derived from row/order). `mappings.js` is large generated-ish data; `transform.py` rewrote positions from `data142.csv`/`data144.csv` (one-off).
- **`instruments.js`** — `window.instrumentSystems`, one spec per selectable system, keyed by the **same id** as the mapping. The layout dropdown, panel headings, keyboard anchor sets, bisonoric on/off, and bonus keys are all driven from it, so adding an instrument needs no `index.html` edit. `instruments.test.js` fails if mappings and specs fall out of sync in either direction. Two spec fields drive whole features and are easy to miss: `bisonoric: false` hides the bellows control, its Space key and the push/pull legend (`applyBellowsAvailability()` also pins `isOpen = true`), and `handSwitch: 'none'` means both hands fit on the keyboard at once, so Caps Lock, the active-hand marker and key-cap dimming all turn themselves off (`applyHandSwitchAvailability()`). Both are read through `systemFor(layout)`, which returns an empty object for an unknown id — so missing metadata degrades to bandoneon-ish defaults rather than throwing.
- **System ids are permanent**: custom mappings are saved in `localStorage` under `'bandoneon-mapping-v1-' + id`; renaming an id orphans users' saved data.
- **`keyboard-mapping.js`** — pure logic turning a layout's `row`/`order` into computer-keyboard keycaps. Each side of each system names an entry in `ANCHOR_SETS`, which has two modes: `anchors` (one key span per keyboard row, tuned by `growRight` / `rowOffset` / `fixed`) and `columns` (one instrument row up one keyboard column — used by the English concertina). Rows are assigned from the *bottom* up, so a system with more rows than the keyboard has loses its topmost rows, not its lowest. Extra keys come from two separate mechanisms that are easy to confuse: an anchor set's `functionKeys` addresses buttons by `row`/`order` (the bandoneon bass F8/F9), while a system's `bonusKeys` in `instruments.js` addresses them by **note pair** (F4), which is how one entry can serve two systems whose ids differ. `app.js` applies all of it in `assignKeyboardKeys()`.
- **`bandoneon-utils.js`** — `normalizeMapping()` and `findMatchingButtons()`.
- **`app.js`** (~1600 lines) — all UI/audio/MIDI logic. Flow: `loadMappingForLayout()` → `renderMapping()` (absolutely-positioned `.button-circle` elements). Every input source (Web MIDI, clicks/touch, MIDI-file playback, computer keyboard) funnels through `handleNoteOn(note, velocity)` / `handleNoteOff(note)`, which keeps audio, highlighting and the info panel in sync. Bellows direction (open/close) selects which note of a button sounds; unisonoric systems (`bisonoric: false`) hide that control.
- **Audio** — `playTone()` has two paths: plain waveforms (short fixed-decay pluck) and free-reed presets (`REED_PRESETS`: bandoneon/accordion/harmonica/musette) via `startReedVoice`/`stopReedVoice`, which sustain until note-off. Reed timbre is a `PeriodicWave` built from a measured harmonic table and snapped to the nearest sampled pitch, cached in `reedWaveCache`. Two tables, two code paths: the bandoneon preset uses `bandoneon-harmonics.js` via `getBandoneonPeriodicWave()`, every other preset uses `accordion-harmonics.js` via `getReedPeriodicWave()`. Both return `null` if their data file is missing and callers fall back to a plain oscillator, so a missing table degrades instead of breaking. The bandoneon table's bellows/side keying is deliberately **flattened and pooled by pitch** in `getBandoneonSamples()` — see the comment there for why those splits aren't trustworthy.
- **`i18n.js`** — pure data: `window.translations` per language and `window.languageNames`. `t(key)` returns the key itself when untranslated, so new UI text degrades to readable literals. Add keys to every language.
- **Inline scripts in `index.html`** — a pre-paint theme setter, a help-panel state restorer, and an old-browser compatibility probe (written in deliberately pre-2020 JS so it can run on browsers that can't parse `app.js`). They exist to beat first paint, which `app.js` at the end of `<body>` cannot. Each one duplicates a `localStorage` key that `app.js` also owns (`persistedThemeKey`, `persistedHelpKey`) — **change both or the page flashes the wrong state.**
- **`accordion_analysis/`** — offline Python analysis notes/plots that produce the harmonic tables; not part of the runtime app.

## Gotchas

- Note data in `mappings*.js` is the likeliest place for subtle errors; check `handoff.md`'s "Data provenance" before trusting or editing notes. The 144-tone button numbering is positional, not an authoritative standard. New systems are transcribed from chart *images*: verify against two sources zoomed in, and prefer one that states its octave convention — a 1:1 read already produced a wrong note once.
- **Which panels show by default is device-dependent**, not a fixed default: a narrow screen or a coarse pointer starts on the treble side alone, a desktop shows both (`NARROW_OR_TOUCH`, `detectInitialPanelMode()`). Expect "what you see on load" to differ between your browser and a phone.
- Notes are held by press-and-hold through pointer events with per-`pointerId` tracking, so **anything that destroys buttons mid-press can strand a note on**. `renderMapping()` calls `releaseAllPointerNotes()` first for exactly this reason; keep that invariant if you add another path that re-renders.
- On-button text color is deliberately **not** a theme token — it follows the button's own background (`.key-cap` is fixed dark, with a `.dark-bg` override). Making it theme-reactive is a regression, not a fix.
- Don't add a build step or npm dependencies; the project is intentionally zero-tooling.
- `README.md` is the user-facing doc and lags the code (it still says only two layouts exist and only the treble side is keyboard-playable). Don't treat it as a spec; it's worth updating when a user-visible feature lands.
