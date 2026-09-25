# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, client-side web app (plain HTML/CSS/vanilla JS, no framework, no build step, no npm dependencies) that visualizes free-reed instrument keyboards (Rheinische 142 and Einheits 144 bandoneon, Anglo 30-button concertina in Wheatstone and Jeffries layouts, English 48-button concertina). It lights up buttons from live Web MIDI, uploaded `.mid` files, mouse/touch, or the computer keyboard, and synthesizes audio with Web Audio. Hosted on GitHub Pages (see `CNAME`). `@tonejs/midi` is loaded from a CDN in `index.html`.

[handoff.md](handoff.md) is a long design document (data provenance, decision log, per-feature notes). Read the relevant section before changing reed synthesis, keyboard mapping, i18n, theme, hint mode, or instrument data. Parts of it may lag the code (e.g. its file table), so trust the code where they disagree.

## Commands

- Run: open `index.html`, or `python -m http.server` and visit `http://localhost:8000/`.
- Tests are plain Node scripts using `test-helpers.js` (no framework). Run one file at a time; there is no aggregate runner:
  - `node bandoneon-utils.test.js`
  - `node keyboard-mapping.test.js`
  - `node instruments.test.js`
- Syntax check: `node --check app.js`. There is no linter or formatter.
- `app.js` and anything touching the DOM/audio is not unit-tested; verify in a browser.

## Architecture

Everything is loaded as classic `<script>` tags in `index.html`, in this order, and each file publishes onto `window` (no modules, no bundler):

`i18n.js` → `bandoneon-utils.js` → `keyboard-mapping.js` → `mappings.js` → `mappings-concertina.js` → `instruments.js` → `accordion-harmonics.js` → `app.js`

Load order matters: `mappings-concertina.js` merges into `window.defaultMappings` created by `mappings.js`, and `app.js` runs last and reads everything else. The Node tests get around the lack of modules by setting `global.window = global` before `require()`-ing the browser scripts; keep the pure-logic files (`bandoneon-utils.js`, `keyboard-mapping.js`) DOM-free so they stay testable.

- **`mappings*.js`** — `window.defaultMappings[systemId]` is an array of buttons: `{id, side: 'left'|'right', label, row, order, x, y, open:{note}, close:{note}}`. `x`/`y` are normalized absolute positions (not derived from row/order). `mappings.js` is large generated-ish data; `transform.py` rewrote positions from `data142.csv`/`data144.csv` (one-off).
- **`instruments.js`** — `window.instrumentSystems`, one spec per selectable system, keyed by the **same id** as the mapping. The layout dropdown, panel headings, keyboard anchor sets, bisonoric on/off, and bonus keys are all driven from it, so adding an instrument needs no `index.html` edit. `instruments.test.js` fails if mappings and specs fall out of sync in either direction.
- **System ids are permanent**: custom mappings are saved in `localStorage` under `'bandoneon-mapping-v1-' + id`; renaming an id orphans users' saved data.
- **`keyboard-mapping.js`** — pure logic turning a layout's `row`/`order` into computer-keyboard keycaps (treble via anchor sets; bass via Caps Lock). `app.js` applies the result in `assignKeyboardKeys()`.
- **`bandoneon-utils.js`** — `normalizeMapping()` and `findMatchingButtons()`.
- **`app.js`** (~1600 lines) — all UI/audio/MIDI logic. Flow: `loadMappingForLayout()` → `renderMapping()` (absolutely-positioned `.button-circle` elements). Every input source (Web MIDI, clicks/touch, MIDI-file playback, computer keyboard) funnels through `handleNoteOn(note, velocity)` / `handleNoteOff(note)`, which keeps audio, highlighting and the info panel in sync. Bellows direction (open/close) selects which note of a button sounds; unisonoric systems (`bisonoric: false`) hide that control.
- **Audio** — `playTone()` has two paths: plain waveforms (short fixed-decay pluck) and free-reed presets (`REED_PRESETS`: bandoneon/accordion/harmonica/musette) via `startReedVoice`/`stopReedVoice`, which sustain until note-off. Reed timbre uses `PeriodicWave`s built from `accordion-harmonics.js` (measured tables snapped to the nearest of 7 sampled notes). `bandoneon-harmonics.js` is generated data that is deliberately not loaded by `index.html`.
- **`i18n.js`** — pure data: `window.translations` per language and `window.languageNames`. `t(key)` returns the key itself when untranslated, so new UI text degrades to readable literals. Add keys to every language.
- **Inline scripts in `index.html`** — a pre-paint theme setter and an old-browser compatibility probe; they must run before `app.js`.
- **`accordion_analysis/`** — offline Python analysis notes/plots that produce the harmonic tables; not part of the runtime app.

## Gotchas

- Note data in `mappings*.js` is the likeliest place for subtle errors; check `handoff.md`'s "Data provenance" before trusting or editing notes. The 144-tone button numbering is positional, not an authoritative standard.
- Don't add a build step or npm dependencies; the project is intentionally zero-tooling.
