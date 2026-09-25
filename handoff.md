# Bandoneon MIDI Visualizer — Handoff

A static, client-side web app (`index.html` + vanilla JS, no build step, no
frameworks) that visualizes a bandoneon keyboard, accepts live MIDI input or
uploaded `.mid` files, and plays back notes through synthesized free-reed
audio. Meant to be hosted on GitHub Pages.

There is no build system. Just open `index.html`, or serve the folder
statically. `@tonejs/midi` is loaded from a CDN in `index.html` for MIDI file
parsing; everything else is hand-written.

## Files, and what's authoritative in each

| File | Role |
|---|---|
| `index.html` | Markup + controls, plus two small inline `<script>`s that must run before `app.js`/first paint: the pre-paint theme setter (see "Theme" below) and the old-browser compatibility probe (Decision Log #11). Otherwise no logic beyond wiring element IDs. |
| `app.js` | All application logic: rendering, audio synthesis, MIDI I/O, i18n, theme. Keyboard-mapping *logic* now lives in `keyboard-mapping.js`; `app.js` just applies its result to its own state (`assignKeyboardKeys()`). |
| `i18n.js` | `window.translations` (one dictionary per language code) and `window.languageNames` (native-script display names for the switcher). Pure data, no logic — `app.js`'s `t()`/`applyTranslations()` read it. See "Internationalization" below. |
| `bandoneon-utils.js` | `window.bandoneonUtils` — `normalizeMapping()` and `findMatchingButtons()`. Small, shared, deliberately dependency-free (no DOM access) so it's easy to unit-test — see `bandoneon-utils.test.js`. |
| `keyboard-mapping.js` | `window.keyboardMapping` — `selectKeysForRow()`, `computeKeyAssignments()` (treble), and `computeBassKeyAssignments()`/`computeBassFunctionKeyAssignments()` (left hand, Caps Lock), the pure logic that turns a layout's `row`/`order` data into computer-keyboard key caps. Extracted out of `app.js` specifically so it's unit-testable (see `keyboard-mapping.test.js`) and so adding a new fingering system's row-length data doesn't require touching DOM-coupled code. |
| `mappings.js` | `window.defaultMappings` — the actual button/note layout data for each supported system. This is the file most likely to be wrong in some small way; see "Data provenance" below before trusting any single note blindly. |
| `instruments.js` | `window.instrumentSystems` (one small spec sheet per selectable system, keyed by the **same id** as `mappings.js`) and `window.instrumentFamilies` (optgroup display names). This is what `app.js` builds the layout dropdown from, so adding an instrument needs no HTML edit. See "Instrument systems" below. |
| `accordion-harmonics.js` | `window.accordionHarmonics` — auto-generated (`accordion_analysis/generate_periodic_waves.py`) linear harmonic-amplitude tables (harmonics 1-10) measured from real accordion recordings, per reed rank (`low`/`mid`/`hi`) and 7 sampled MIDI keys. `app.js`'s `getReedPeriodicWave()` reads `low` and `mid` to build real-timbre `PeriodicWave`s for the reed synth — see "Reed synthesis" below. **`hi` is present in the data but currently unused by `app.js`** (only `low`/`mid` are read) — not a bug, just harmonic data that hasn't been wired to a third oscillator rank yet. |
| `bandoneon-harmonics.js` | `window.bandoneonHarmonics` — auto-generated (`accordion_analysis/generate_bandoneon_waves.py`) harmonic-amplitude tables measured from a real bandoneon, keyed by bellows direction (`open`/`close`) / side (`left`/`right`) / note name, plus per-note `measured_f0_hz`/`beat_hz`/`beat_reliable`. **Not `<script>`-loaded by `index.html` and not read anywhere in `app.js`** — generated data waiting for a real bandoneon voice to be built; see "Open items" below. |
| `color-ranges.js` | **Deleted.** Used to be dead code (see Decision Log #4 — nothing read `window.buttonColorRanges` even while it was loaded); has since been removed from the repo entirely, and its `<script>` tag in `index.html` was removed to match (it had gone stale, still pointing at the deleted file). No trace of it should remain in either file going forward. |
| `add_row_order.js` | One-time migration script (already run) that added `row`/`order` fields to the Rheinische data. Kept for reference/history, not part of the runtime app. Not referenced by `index.html`. |
| `test-helpers.js`, `bandoneon-utils.test.js`, `keyboard-mapping.test.js`, `instruments.test.js` | Plain Node test files, no framework/dependencies — run with e.g. `node bandoneon-utils.test.js`. See "Testing" below. |

## The domain, briefly

A bandoneon is a bisonoric free-reed instrument (like a diatonic accordion):
each button plays a **different note on push (open) vs. pull (close)** of
the bellows. It has two independent keyboards — bass (`side: "left"`) and
treble (`side: "right"`) — each with buttons arranged in a hex-offset
diagonal grid (not a simple rectangular grid), because that's how the
physical reed banks are packed.

Multiple incompatible **fingering systems** exist for "the same" 142- or
144-button bandoneon — the button *count* doesn't imply the note
*arrangement*. This project currently supports two:

- **Rheinische** (142-button convention, though the actual physical count is
  71 buttons × 2 push/pull notes = 142 total sounds)
- **Einheits** (144-button convention, 72 buttons × 2 = 144 total sounds)

These are genuinely different note layouts, not just different sizes of the
same layout. This distinction wasn't in the original data model (both used
to be lazily called `"142"`/`"144"`) and caused real confusion until it was
fixed — see the Decision Log.

## Data model (per button, in `mappings.js`)

```js
{
  id: 15,            // stable unique id, NOT guaranteed sequential-meaningful
                      // (see Decision Log — id ordering used to be overloaded
                      // with row-major meaning; that's fixed now, row/order
                      // are explicit, but id itself is still just an id)
  side: "left",       // "left" (bass) or "right" (treble)
  label: "15",        // display label shown on the button
  row: 1,             // 1-indexed, top row = 1. Explicit, verified field.
  order: 3,           // 1-indexed position within the row, left-to-right.
  x: 0.303,           // normalized [0,1] position for absolute rendering
  y: 0.135,           // (NOT derived from row/col — see Decision Log)
  open:  { note: 66 },  // MIDI note number sounded on push
  close: { note: 65 }   // MIDI note number sounded on pull
}
```

`window.defaultMappings` currently has two top-level keys:
`"142-rheinische"` and `"144-einheits"`. (Renamed from the old bare
`"142"`/`"144"` — see Decision Log.)

## App architecture (`app.js`)

Roughly, in the order things happen:

1. **`loadMappingForLayout(layout)`** — loads either a saved custom mapping
   from `localStorage` (keyed per-layout) or falls back to
   `window.defaultMappings[layout]`, normalizes it via
   `bandoneonUtils.normalizeMapping`, then calls `assignKeyboardKeys()` and
   `renderMapping()`.
2. **`renderMapping()`** — builds the DOM: one `.button-circle` per button,
   absolutely positioned via `x`/`y`, colored via `colorForButton()` (which
   dispatches to one of three color modes — see "Button color" below —
   Rainbow being the original `colorForMidi()`/`colorForAccent()`
   pure-HSL-from-note-number formula; see Decision Log #4 for why that
   formula itself has no per-note/per-button override layers), labeled with
   note name + optional computer-keyboard key-cap badge (both hideable via
   "Hint" mode, see below).
3. **Audio** — two independent synthesis paths coexist in `playTone()`:
   - Plain waveforms (sine/square/sawtooth/triangle): short fixed-decay
     "pluck," unchanged from the original app.
   - Free-reed instruments (accordion/harmonica/bandoneon/musette): a real
     synthesized voice — see "Reed synthesis" below — that **sustains until
     note-off**, unlike the pluck path.
4. **Input sources**, all funneled through the same `handleNoteOn(note,
   velocity)` / `handleNoteOff(note)` pair so audio, highlighting, and the
   info panel stay in sync regardless of source:
   - Web MIDI (`onMIDIMessage`)
   - Mouse/touch clicks on rendered buttons
   - Uploaded `.mid` file playback (parsed with `@tonejs/midi`, scheduled
     with `setTimeout`, **seekable** — see "MIDI transport" below)
   - Computer keyboard (see "Keyboard mapping" below)

### Reed synthesis (`startReedVoice` / `stopReedVoice`)

Not a sample — pure Web Audio synthesis, chosen deliberately over sampling
because this needs to work as a static site with zero asset files. **This is
the second, real-timbre-informed version of the signal chain** — see Decision
Log #16 for what the original two-oscillator-plus-noise model looked like and
why it was replaced; this section describes the current one only.

Real free-reed instruments name their reed ranks by register:

- `L` — one octave below the note (bass/bassoon reed)
- `M-` — the note's own octave, detuned flat (tremolo/musette partner)
- `M` — the note's own octave, in tune (the "dry" reference reed)
- `M+` — the note's own octave, detuned sharp (tremolo/musette partner)
- `H` — one octave above the note (the accordion's "piccolo" reed). Listed
  for completeness only: `startReedVoice()` has no oscillator for it (see
  the 4 slots below), so no preset currently sounds an `H` rank

`startReedVoice()` always builds all 4 oscillator slots (`oscMflat`, `oscM`,
`oscMsharp`, `oscSub` for `L`) — matching the rest of this codebase's style
of not conditionally building the node graph — and mutes whichever ones a
given preset doesn't use via a 0 gain, rather than skipping their creation.
Per note, the signal chain is:

- `oscMflat`/`oscM`/`oscMsharp`: three oscillators at the note's own pitch.
  `oscM` stays exactly on pitch; `oscMflat`/`oscMsharp` are detuned by the
  **full** `#reedDetune` slider value in opposite directions from `oscM` (not
  halved — `oscM` is the true dry center, unlike an earlier design where the
  only two mid oscillators were a symmetric detuned pair with no dry reed at
  all). Each preset's `voiceMflat`/`voiceM`/`voiceMsharp` (0 or 1) gate that
  oscillator's own `GainNode` on/off.
- `oscSub`: one octave down (`freq / 2`), for the `L` bass reed. `harmMix`
  (0 = off) doubles as both its on/off switch and its blend level — 0 for
  Harmonica and Musette (no bass reed on those real instruments), nonzero for
  Accordion/Bandoneon.
- **Real timbre, not a generic waveform, where data exists**: `oscMflat`/
  `oscM`/`oscMsharp` try to use a `PeriodicWave` built from `accordion-harmonics.js`'s
  `mid` table (`getReedPeriodicWave(ctx, 'mid', note)`); `oscSub` tries the
  same table's `low` register. Each falls back to a plain `sawtooth`/`triangle`
  oscillator type if `window.accordionHarmonics` didn't load or has no table for
  that register. The measured tables are keyed by 7 sampled MIDI notes only
  (`sampleNotes: [53, 60, 65, 72, 77, 84, 93]`) — every played note snaps to
  its *nearest* sampled key's harmonic table (`nearestSampleNote()`) rather
  than interpolating between samples, since the timbre visibly/audibly
  changes with register (accordion reeds get thinner/brighter going up) and
  true per-note morphing wasn't judged worth the complexity. Built
  `PeriodicWave`s are cached per `register:sampleNote` (`reedWaveCache`) since
  the same table gets reused across many notes/octaves.
- A lowpass `BiquadFilterNode` (cutoff/Q differ per instrument preset) —
  still shapes the summed reed signal, same role as before.
- Bandpass-filtered noise, loud on attack and fading (bellows "breath") —
  unchanged in role from the original design.
- An LFO modulating the three mid oscillators' `detune` (vibrato) — same
  role, now driving 3 oscillators instead of 2.
- Headroom: with up to 4 oscillators now summing (vs. 2 previously), overall
  gain is scaled by `0.75 / sqrt(activeVoices)` (`activeVoices` = however many
  of the 4 slots this preset actually turns on) rather than a flat constant —
  a fuller preset (Musette, 3 mid voices) still ends up a bit louder than a
  sparser one (Bandoneon, 1 mid voice + `L`), not identically loud, but none
  of them clip regardless of voice count.
- A wrapping `GainNode` that ramps up on note-on and **only** ramps down on
  `stopReedVoice()` — sustains for exactly as long as the note is held, not a
  fixed duration (unchanged from the original design).

`REED_PRESETS` now has one entry per instrument (`bandoneon`, `accordion`,
`harmonica`, and `musette` — **Musette is new**, a 4th reed-instrument choice
added alongside this rewrite; see `index.html`'s `#instrumentSelect` and
`i18n.js`'s `instrumentMusette` key across all 8 languages), each specifying
`voiceMflat`/`voiceM`/`voiceMsharp`/`harmMix` (which reeds are on) plus
starting `detune`/`breath`/`vibrato`/`filterFreq`/`filterQ` values. Concretely:
Bandoneon is dry M only + `L` (real bandoneons don't beat/tremolo — hence
`detune: 0`); Accordion is dry `M` + sharp `M+` + `L` (an asymmetric wet pair
with a true dry reference reed, not the symmetric M-/M+ "Sax" register);
Harmonica is the same dry-plus-sharp mid pair as Accordion but with no bass
reed (`harmMix: 0`); Musette is the full wet trio (`M-`, `M`, `M+` all on)
with no bass reed, for the lush chorus/beating sound. Three sliders
(`#reedDetune`, `#reedBreath`, `#reedVibrato`) let the user hand-tune
detune/breath/vibrato live; switching the instrument dropdown snaps them to
that preset's defaults via `applyReedPreset()`. Accordion's `vibrato: 45` and
Musette/Harmonica/Bandoneon's vibrato values are calibrated against real
measurements (see `accordion_analysis/results.json` and the "Instrument
provenance"/"Real bandoneon recordings" entries under "Open items") rather
than guessed from nothing — `#reedVibrato`'s slider range was widened (from
an original 0-15) specifically because it couldn't reach the low end of the
measured range otherwise.

These three sliders (and the reed timbre/oscillator chain generally) only
affect `startReedVoice()` — plain waveforms (sine/square/sawtooth/triangle)
never read them at all, and go through the separate short fixed-decay
`playTone()` path instead (see step 3 in "App architecture" above).
`updateReedControlsAvailability()` disables the sliders (native `disabled`
attribute, plus a `.reed-disabled` class toggled on anything marked
`.reed-only` in the markup, for label dimming) whenever a non-reed instrument
is selected, and re-enables them when switching back. Not just cosmetic — it
tells the user these controls are currently inert rather than implying
they'd do something. (The native `disabled` attribute alone dims/disables
only the `<input>` itself, not the label text next to it, and browsers don't
agree on how strongly they dim a disabled range input — the CSS class exists
to dim the *whole* label row consistently and to force a `not-allowed`
cursor, rather than relying on `disabled`'s default appearance alone.)

### Instrument systems (`instruments.js`)

Each selectable system has a small metadata entry — its "spec sheet" —
keyed by the same id as its button array in `mappings.js`. The app used to
know a system only by that id string and pattern-match on it
(`if (layout === '144-einheits')` lived in `bandoneon-utils.js`), with the
dropdown options, panel titles and keyboard anchors all hardcoded for
bandoneon; every new instrument meant another `if` in several files. This
is the same data-driven shape `i18n.js` already uses, where
`window.languageNames` drives the language switcher.

Fields, and who reads them:

| Field | Read by |
|---|---|
| `family` | dropdown `<optgroup>` grouping |
| `i18nKey` / `name` | the option's label — translation if there is one, else the plain `name`, so an untranslated new system still reads correctly |
| `bisonoric` | `false` hides the bellows control, its Space hint and the push/pull legend, and makes Space a no-op — see "Unisonoric systems" below. Defaults to bisonoric when absent |
| `sideLabels` | the two panel headings, in `renderMapping()` |
| `keyboard` | `{ left, right }` naming which anchor set in `keyboard-mapping.js` maps that side's rows onto the computer keyboard |
| `bonusKeys` | extra bindings addressed **by note pair** (bandoneon's F4 → C4/C#4). Row/order-addressed extras live with the anchor set instead — see below |
| `fallbackButtonCount` | `normalizeMapping()`'s placeholder size when a system's data is missing/empty |

**`sideLabels` values may be an i18n key OR literal text.** `t()` returns
its argument unchanged when no translation exists, so `'leftSideBass'`
translates while `'Left hand'` passes straight through — a new system needs
no `i18n.js` edit to get readable headings.

**Two kinds of extra key binding, split by how they address a button:**

- **Row/order-addressed** → lives in the anchor set (`ANCHOR_SETS` in
  `keyboard-mapping.js`), because it's a property of that keyboard *shape*.
  `bandoneonBass`'s F8/F9 are this kind.
- **Note-pair-addressed** → lives in the system's `bonusKeys`, because it's
  a property of that *instrument*. Bandoneon's F4 is this kind, matched by
  note rather than id since the ids differ between the two systems
  (38 vs 36).

**Adding a system**: add its button array to `mappings.js` (or its own
`mappings-*.js`) plus an entry here under the same key. `index.html` needs
no change. `instruments.test.js` checks the two stay in sync in both
directions — an id here with no data, or data with no entry here (an
instrument nobody can select), both fail.

**IDs are permanent.** The saved-custom-mapping `localStorage` key is
`'bandoneon-mapping-v1-' + id`, so renaming an id orphans that user's saved
mapping. Change `name`/`i18nKey` to improve what's displayed; leave the key
alone. `instruments.test.js` pins the two original bandoneon ids for this
reason, and pins `142-rheinische` as first (the dropdown selects its first
option, which is how the old hardcoded markup behaved).

**Grouping is conditional**: `<optgroup>`s appear only once more than one
`family` exists. With today's two bandoneons the dropdown stays flat, which
is exactly how it looked before this refactor.

### Help panel (collapsible legend)

The legend is a native `<details id="helpPanel">`, open by default, with the
collapsed/expanded choice stored under `localStorage` key
`bandoneon-help-v1`. Rationale: the three lines are what a first-time
visitor needs, and dead weight once you know them.

- **Native `<details>`, not a JS accordion** — the disclosure triangle,
  keyboard operation and screen-reader semantics all come free, and it
  still opens/closes with JavaScript disabled. Only the *remembering*
  needs JS, which is the right thing to lose in that case.
- **A small inline `<script>` sits immediately after the element**, not in
  `app.js`, and removes `open` when the saved value is `'closed'`. Same
  reasoning as the theme's pre-paint script in `<head>`: `app.js` runs at
  the end of `<body>` and can be late enough to paint the panel open and
  then snap it shut. The element doesn't exist yet during `<head>`, so the
  script goes right after it instead. **Its hardcoded key must stay in
  sync with `persistedHelpKey` in `app.js`** — same coupling the theme
  script has.
- `app.js` only listens for `toggle`, which fires in both directions and
  for keyboard and programmatic opens too, so there's no click handler to
  keep in sync.
- The `<summary>` is styled as a control (pointer cursor, `--text-bright`,
  hover underline, visible focus ring) rather than another line of prose,
  since once collapsed it's the only part still on screen.

### Unisonoric systems (`bisonoric: false`)

Bisonoric instruments (bandoneon, Anglo, Chemnitzer) sound a different note
on push vs pull, so bellows direction is real state. Unisonoric ones
(English concertina, **all** duets) sound the same note either way, so the
bellows controls describe something that does nothing. `isBisonoric()`
reads the flag; `applyBellowsAvailability()` (called from
`loadMappingForLayout()`) puts `.no-bellows` on `<body>`, and CSS does the
rest:

- `.bellows-only` — the bellows button, its "(Space to toggle)" hint, and
  `legendLine3`'s push/pull notation: hidden.
- `.no-bellows-only` — `legendColorsOnly` ("Colors are by octave."), shown
  in place of `legendLine1`, whose second half tells the reader to press
  Space to switch Open/Close. Swapping the whole line in CSS avoided
  rewriting eight existing translations; the replacement reuses each
  language's own first sentence from `legendLine1`, so the wording matches.
- **Space falls through without `preventDefault()`** rather than being
  swallowed, so it keeps ordinary browser behavior.
- `isOpen` is pinned to `true` — both directions give the same note, but
  this keeps the variable deterministic rather than inheriting whatever the
  last bisonoric system left behind.
- Button tooltips drop to a single note number, since `"Close 60 / Open 60"`
  would print the same number twice under labels for a hidden control.

`instruments.test.js` asserts that a system declaring `bisonoric: false`
has `open === close` on **every** button. Nothing is unisonoric yet so it
passes vacuously today, but it's the guard that catches English/duet data
whose notes still differ per direction — which would otherwise hide the
bellows control over data that still needed it, making some notes
unreachable. Verified against a deliberately broken fake system.

### Keyboard mapping (computer keys → treble buttons, and bass via Caps Lock)

Deliberately scoped to **the lower 4 rows of each side** (bass: see "Left
hand (bass)" at the end of this section) — the
full 6-row (or 5-row, depending on system) hex grid can't map cleanly onto a
flat QWERTY keyboard without badly distorting relative finger positions, and
the upper rows are the least reachable/most decorative ones anyway. This was
an explicit, discussed trade-off, not an oversight.

The design (in `app.js`, roughly lines 43–110 as of this writing) is
data-driven specifically so a **new fingering system's different row
lengths just work** without new code:

- `PHYSICAL_KEYBOARD_ROWS` — the full 10-key physical rows (number row,
  qwerty row, home row, bottom row).
- `DEFAULT_ROW_ANCHORS` — the "normal case" slice of each physical row
  (calibrated against Rheinische, since that was the original system):
  `4-9` / `e-o` / `s-l` / `x-.` (lengths 6/7/8/8).
- `selectKeysForRow(rowIndex, neededLength)` — if a row needs more keys than
  the default anchor provides (as Einheits' rows do: `7,7,8,9` vs.
  Rheinische's `6,7,8,8`), it **extends outward from the anchor** (toward
  the physically-adjacent unused key) rather than needing a special case.
  E.g. Einheits' bottom row needs 9, not 8 → extends left to include `Z`,
  giving `Z X C V B N M , .` instead of shifting the whole row.
- Which row number is "the top of the lower 4" is computed per-layout at
  runtime (`maxRow - 4 + 1`), not hardcoded — Rheinische has 6 treble rows
  (so it's rows 3–6), Einheits has 5 (so it's rows 2–5).

Known accepted imperfection: Einheits' row lengths (`7,7,8,9`) don't
perfectly match the default anchor lengths in every case even after
extension — a couple of Einheits treble buttons in the affected rows may
end up without a keyboard key. This is a physical mismatch between the two
systems' shapes, not a bug, and hasn't been "fixed" further because there's
no non-arbitrary way to decide which button should lose its key.

Note-on capture: pressing a key snapshots `isOpen` **at the moment of
key-down**, not at key-up — matches how a real reed instrument works (the
bellows direction in effect at the moment you press determines the note;
flipping direction while a note is already sounding doesn't retroactively
change it). `heldKeyNotes` (Map of key → note) makes sure the *correct*
note gets released even if bellows direction changed while the key was
held, and guards against OS key-repeat re-triggering.

#### Left hand (bass) — Caps Lock

The same 4 letter rows play the **bass** side while **Caps Lock is on**.
Decided with the user (2026-09); goal is to mimic two-handed playing on
both a desktop and a laptop keyboard.

- **Why Caps Lock:** Space is already the bellows; Tab would break keyboard
  focus navigation of the page's controls; Shift trips Windows' Sticky Keys
  prompt when tapped repeatedly. The page can't stop the OS toggling Caps
  Lock, so the mode isn't a separate flag at all — `syncHandMode()` re-reads
  `event.getModifierState('CapsLock')` on every key and pointer event. The
  keyboard's Caps Lock light is the mode indicator and can never disagree
  with the page. Accepted side effect: leaving the page in bass mode leaves
  Caps Lock on in other apps.
- **Placement** (`BASS_ROW_ANCHORS` in `keyboard-mapping.js`), chosen by a
  least-squares fit of ANSI key centers against the buttons' real `x`
  coordinates over every candidate slice — ~0.26 key-widths average error,
  about half the next best:

  ```
              F8  F9                ← row 1: 𝄌/id4, 0/0/id5
         4 5 6 7 8 9 0              ← row 2 (7)
          R T Y U I O [P]           ← row 3 (142: 6, 144 adds P)
           D F G H J K L [;]        ← row 4 (142: 7, 144 adds ;)
            X C V B N M , .         ← row 5 (8)
  ```

  Bass rows **grow rightward** past the anchor, unlike treble: 144's extra
  button in rows 3/4 is appended at the right end with every other button
  at the same `x` (see "Data provenance"), so growing right keeps every
  shared button on the same key in both layouts.
- **F keys follow their side, like the letters** (user's call): F4 (treble
  C4, above) plays only with Caps Lock off, F8/F9 (bass row 1) only with it
  on — they live in `trebleCodeMap`/`bassCodeMap` like every other key, and
  dim with their side. Bass row 1's other three buttons (2/2, 3/3, 4/4) have no key —
  F5 reloads, F6 focuses the address bar, F7 opens a caret-browsing prompt
  in Chrome and Firefox. On laptops whose F row sends media keys unless Fn
  is held (Mac F8 = play/pause), F8/F9 never reach the page — same
  graceful degradation as F4.
- **Hand is committed at key-down**, like bellows direction: a note held
  through a Caps Lock flip still releases correctly (`heldKeyNotes` stores
  the note, not the button).
- **Active-hand indicator** (`styles.css`, "Active-hand Indicator"): the
  active side's panel title keeps `--panel-title` and gains a `⌨` marker;
  the inactive side's drops to `--muted`. Added because the dimmed key caps
  were the *only* in-app signal and they exist solely in the "Dim inactive
  hand" setting — under "Always on"/"Always off" the page showed nothing
  and the player had to glance at the Caps Lock light (which plenty of
  keyboards don't have). Deliberately **not** gated on `#keyCapSelect`:
  that menu is about labels, this is about which hand is live. Two signals
  rather than one because a colour shift alone is easy to miss and
  unreliable for a colorblind reader. Pure CSS on classes `syncHandMode()`
  already sets, so no re-render. The marker's space is reserved on both
  titles (`visibility`, not `display`) so a Caps Lock flip doesn't shift
  the headings. Known cosmetic edge: it still shows on a touch device,
  where there's no Caps Lock to flip — harmless, and left alone rather than
  gated on `pointer: coarse`, which would wrongly hide it from a tablet
  with a real keyboard attached.
- **Key labels menu** (`#keyCapSelect`, `localStorage`
  `bandoneon-keycaps-v1`): `"dim"` (default — fades every cap, F keys
  included, on the side the keyboard isn't currently playing), `"on"`,
  `"off"`. Pure container classes (`.keycaps-dim`/`.keycaps-off`, plus
  `.bass-keys-active` from `syncHandMode()`), so neither the menu nor a Caps
  Lock flip re-renders. Dimming is opacity only — **key-cap text color must keep following the
  button's own background, never the page theme** (fixed dark, light only
  via `.dark-bg` on Piano's black buttons). An earlier theme-driven color
  went invisible on Piano/Single-color's ivory buttons under Night theme.

### Panels & touch input (phone / tablet)

Two side-by-side panels don't fit a phone: each button falls to its 40px
minimum with only ~46px of spacing and 9-10px labels. **Panels**
(`#panelSelect`, `localStorage` `bandoneon-panels-v1`) shows one side at a
time so it gets the container's full width: `"both"`, `"left"`, `"right"`.
Two devices (or a phone plus a laptop) cover both hands — which is also the
*only* way to play bass on touch, since there's no Caps Lock there.

- **Detection sets the default only.** `NARROW_OR_TOUCH` =
  `(max-width: 900px), (pointer: coarse)` picks `"right"` (treble: the
  melody side, and the one with the fuller keyboard mapping) when nothing
  is saved. An explicit choice is stored and always wins, so a misread
  device costs one dropdown change rather than trapping anyone. While no
  choice is saved, `watchPanelDefault()` keeps following the screen live
  (rotating a tablet, dragging a window narrow); it stops the moment the
  user picks something.
- **`pointer: coarse`, deliberately not `any-pointer: coarse`** — the
  former asks whether the *primary* input is a finger, so a desktop with a
  touch monitor attached stays on "both". A stylus/Wacom pen counts as
  `fine` under either, so neither matches those.
- **Rendering is unchanged** — `applyPanelMode()` only sets `data-panels`
  on `#bandoneonContainer` and CSS hides the other panel, so switching
  needs no re-render and the hidden side's buttons still exist for
  MIDI-driven highlighting. Single-panel mode also bumps the button size
  (`clamp(44px, 9vw, 64px)`), since one panel has twice the width.
- **Press-and-hold replaced the old click blip** (`pointerdown`/`pointerup`
  /`pointercancel` in `renderMapping()`; `pointerHeldNotes` keyed by
  `pointerId`). A note now sounds for as long as it's held, on mouse *and*
  touch, instead of a fixed 220ms. Per-pointer tracking means several
  fingers = a real chord. `setPointerCapture` keeps the release event
  coming even if the finger slides off the button.
  - `renderMapping()` calls `releaseAllPointerNotes()` first: it destroys
    every button element, and with it any pointer capture, so a note held
    across a re-render (e.g. someone taps the Bellows button with a second
    finger, which re-renders) would otherwise sound forever.
  - Keyboard activation of a focused button (Enter) arrives as a click with
    `detail === 0` and no press/release to follow, so **that** path keeps
    the old fixed 220ms blip.
  - `styles.css`'s "Touch Input" block (`touch-action: none`,
    `-webkit-tap-highlight-color`, `user-select`, `-webkit-touch-callout`)
    stops the browser claiming the gesture as a scroll/pinch, or adding the
    long-press selection, callout menu and grey tap flash.

### MIDI transport (upload/play/stop/seek)

`schedulePlaybackFrom(offsetSeconds)` is the one function both "Play" (called
with `0`) and dragging the progress slider (seeking) go through — it clears
any pending `setTimeout`s, force-stops anything currently sounding via
`stopAllActiveNotes()` (see Decision Log — this used to be a real bug), and
reschedules note-on/note-off timers shifted by the offset. The progress bar
(`#midiProgress`, `#midiTime`) is a native `<input type="range">` updated by
a 100ms `setInterval`, paused while the user is actively dragging.

### Internationalization (i18n)

Plain client-side JS string-swap i18n — no build step, no per-language HTML
files, matching the rest of the project's zero-tooling approach. Deliberately
chosen over the more bot/SEO-friendly alternative of generating a static
HTML file per language (real content per URL, crawlable with JS off);
rejected here because this is an interactive tool with a link shared
directly with people, not a content page where search indexing across
languages matters. See Decision Log #12 for the full reasoning and the
trade-off this accepts.

- **`i18n.js`** holds `window.translations` (8 languages: `en`, `ja`,
  `zh-Hans`, `zh-Hant`, `ko`, `es`, `fr`, `de` — each a flat key→string
  dictionary) and `window.languageNames` (native-script labels for the
  switcher `<select id="langSelect">`, populated by `app.js` from this
  object's keys — adding a 9th language needs zero HTML changes, just a new
  entry in both objects).
- **Static markup**: elements carry `data-i18n="key"`; `app.js`'s
  `applyTranslations()` walks `[data-i18n]` and sets `textContent` from
  `t(key)`. The two legend lines contain `<u>` emphasis tags, so they use
  `data-i18n-html` instead (sets `innerHTML`, not `textContent`) — safe here
  since the markup is developer-authored translation strings, not user
  input.
- **Dynamic strings** (MIDI status messages, the Mode/Enable-MIDI button
  text) go through `setI18nText(el, key)` instead of a plain `t(key)`
  assignment — it stamps `data-i18n` onto the element as it sets the text,
  so a mid-session language switch correctly re-renders whatever was last
  shown (e.g. "Playing MIDI...") rather than only the page's original
  load-time text.
- **`document.documentElement.lang`** is set on every `applyTranslations()`
  call. This matters for accessibility, not just cosmetics: a screen reader
  picks pronunciation rules from `lang`, so a language switch that updated
  visible text but left `lang="en"` stuck would mispronounce every word —
  this was an explicit fix, not an incidental one (see Decision Log #12).
- **Detection order**: saved `localStorage` choice → `navigator.language`
  (with a region-based guess for Chinese script: `zh-TW`/`zh-HK`/`zh-MO` →
  Traditional, else Simplified) → English fallback.
- **Translation quality caveat**: all 8 dictionaries were written by the
  assistant in this session, not reviewed by native speakers of any of the
  target languages. Domain terms (waveform names, "musette," bandoneon vs.
  accordion vs. bandoneón vs. Bandoneon spelling per language) were
  researched, but treat these as "plausible machine-assisted translation,"
  not verified the way `mappings.js`'s note data was — worth a native-speaker
  pass before treating any of them as authoritative, especially if a friend
  who speaks one of these languages flags something.

### Theme (Browser / Day / Night)

`#themeSelect` offers three choices, stored under `localStorage` key
`bandoneon-theme-v1`: `"browser"` (default — leaves `data-theme` unset on
`<html>`, so `styles.css`'s `prefers-color-scheme` media query decides),
`"light"`, or `"dark"` (both set `data-theme` explicitly, overriding system
preference). `app.js`'s `applyTheme()`/`setTheme()` do the runtime work;
`detectInitialTheme()` reads the saved choice on load.

The one non-obvious piece: **a duplicate, minimal theme-setting script runs
inline in `index.html`'s `<head>`, before `app.js` loads.** Without it, an
explicit Day/Night choice would flash the wrong theme for a moment on every
reload (page paints with the default/system theme first, then `app.js`
loads and corrects it). The inline script re-reads the same
`bandoneon-theme-v1` localStorage key and sets `data-theme` before first
paint; `app.js`'s own `detectInitialTheme()`/`applyTheme()` then run too
(harmless, idempotent) and additionally sync `#themeSelect`'s displayed
value. **The localStorage key is duplicated as a literal string in both
places** — if it's ever renamed in one, it must be renamed in the other, or
the pre-paint script silently stops working while `app.js` still functions
normally (no error, just the flash-of-wrong-theme bug coming back).

The theme tokens also include `--key-cap` (light-on-dark in Night, dark-on-
light in Day, in all four token blocks) — `.key-cap`'s `color` reads it, so
the on-button computer-keyboard badge stays legible against the page
background instead of being a fixed light gray regardless of theme.

### Hint mode (Default / No hint)

`#hintSelect` offers two choices, stored under `localStorage` key
`bandoneon-hint-v1`: `"default"` (all markings visible, the original
behavior) and `"none"` ("No hint" — meant as a practice mode, so a player
has to recognize notes/positions rather than read them off the button).
Unlike Theme and unlike Button color (below), this one is a pure CSS class
toggle: `applyHintMode()` sets/clears `.hints-off` on `#bandoneonContainer`,
and `styles.css`'s `.hints-off .label-text/.note-text/.key-cap { display:
none }` rule does the rest — no `renderMapping()` call needed, and the
hidden state can't drift out of sync with what `renderMapping()` last built
since it's a container-level class, not per-button markup.

**Two things worth knowing before treating "No hint" as a complete blind
mode:**

- **It doesn't hide the octave rainbow coloring by itself.** Color is a
  wholly separate setting (see "Button color" below) — a player who wants
  *no* visual hints at all needs Hint = "No hint" **and** Button color =
  "Single color" (or "Piano") set together. There's no single combined
  "with markings / without markings" switch; the feature ended up as two
  independent toggles instead.
- **The hover tooltip still reveals everything, regardless of Hint mode.**
  `renderMapping()` unconditionally sets each button's `title` attribute to
  `"{side} • {label} • Close {note} / Open {note}"`, plus `" • Key {keyCap}"`
  when a key-cap exists — none of that is gated on `hintMode`. So a mouse
  user in "No hint" mode can still get the exact note/label/key answer by
  hovering instead of looking. Not fixed as part of this feature; if this
  matters, the tooltip text would need to move to `aria-label` (kept, for
  screen readers) and the visible `title` suppressed specifically when
  `hintMode === 'none'`.

### Button color (Rainbow / Piano / Single color)

`#buttonColorSelect` offers three choices, stored under `localStorage` key
`bandoneon-button-color-v1`: `"rainbow"` (default — the original per-octave
HSL formula, `colorForMidi()`/`colorForAccent()`), `"piano"`, and `"mono"`
("Single color"). Unlike Hint mode, this **can't** be a pure CSS toggle —
`colorForButton(note)` computes each button's actual background/border
color per mode, so a change goes through a full `renderMapping()` (wired via
`setButtonColorMode()`) to take effect.

- **Piano**: natural (white-key) pitch classes get the ivory
  `IVORY_BUTTON` color (`#f4f1e8` / border `#c9c2ae`); accidental (black-key)
  pitch classes get `PIANO_ACCIDENTAL_BUTTON` (`#1c1c1c` / border `#3a3a3a`)
  and are flagged `needsLightText: true`, which `renderMapping()` turns into
  a `.dark-bg` class on that button — `styles.css`'s `.dark-bg` rule
  overrides `.label-text`/`.note-text`/`.key-cap` to a light color for just
  those buttons, independent of the page's own Day/Night theme (a black
  Piano button needs light text even on an otherwise-light Day page).
- **Single color ("mono")**: every button gets the same `IVORY_BUTTON`
  color as Piano's naturals. Chosen deliberately, not an arbitrary pick —
  meant to evoke a real bandoneon's light wood/bone buttons against a dark
  case, per the user's own description of a real instrument (see
  `IVORY_BUTTON`'s comment in `app.js`).
- **Rainbow**: unchanged from the original per-octave formula (Decision Log
  #4) — still the only mode with no manual per-note overrides.

## Data provenance (why the note data should be trusted, and how much)

This matters because a wrong note is a silent, hard-to-notice bug in a music
app, so a fair amount of the session went into verification rather than just
transcription.

- **`142-rheinische`**: originally derived by the user from
  `Bandoneón-142-Flat.svg` (Wikipedia Commons) via a pixel-center-extraction
  pipeline (`data142.csv` + `transform.py`, both user-authored, not part of
  this repo's runtime). Cross-verified note-by-note against two reference
  chart images (`bass.jpg` / `treble.jpg`, "Omar Caccia" branded) by
  matching MIDI-derived note names against the printed labels — full
  agreement.
- **`142-rheinische`'s entire bass/left side (all 5 rows, ids 1–33) had its
  `x` values rescaled by exactly ×0.95, at the user's request, so buttons
  shared with `144-einheits` land at the same visual x position when
  switching layouts mid-session.** Discovered incrementally: the user first
  flagged bass row 3 ("middle row": 6 buttons in 142-rheinische vs. 7 in
  144-einheits) and row 4 ("2nd-lowest row": 7 vs. 8) as visually
  mismatched — in both cases 144-einheits' extra button is appended to the
  *right* end of the row (144's id 19 past 142's id 18; 144's id 27 past
  142's id 25), so those two rows share every button except that one
  trailing extra. Since the two systems' coordinates come from independently
  extracted source diagrams (142 from an SVG, 144 from a PDF — see the
  provenance entries here), there was no inherent guarantee the shared
  buttons lined up in x at all. A least-squares fit of 142's original x
  against 144's x, done independently per row over its shared buttons,
  converged to the *same* factor for both flagged rows — exactly `0.95`,
  ~zero shift — with residuals at essentially floating-point noise
  (<0.00001). That immediately raised the question of whether the other 3
  bass rows (1, 2, 5 — which have *matching* button counts in both systems,
  so no "extra button" to work around) were coincidentally fine or
  suffering the same unaddressed mismatch; checked with the identical
  least-squares approach, and all three fit the *exact same* `0.95` factor
  too. Conclusion: this isn't a rows-3/4-specific quirk, the entire
  142-rheinische bass diagram is uniformly ~5% wider in x than
  144-einheits' — so the same rescale was applied across all 5 rows for
  consistency, not just the two originally flagged.
  **Scope, explicitly**: only `x` was touched, not `y`, not `note`s, not
  `label`s; only the bass/left side (see the next entry for treble).
  **If `142-rheinische` bass data is ever re-extracted from the
  source SVG**, this ×0.95 adjustment across all 5 rows will need to be
  reapplied by hand (or re-derived the same way, against 144-einheits'
  current values) — it lives only in `mappings.js`'s committed numbers, not
  in `transform.py` or `data142.csv`.
- **`142-rheinische`'s treble/right side needed a different fix from bass —
  two single-button corrections, not a per-row rescale — because it turned
  out to already be pixel-identical to `144-einheits` almost everywhere.**
  Treble doesn't have bass's clean 1:1 row correspondence on its face:
  Rheinische has 6 treble rows (counts 4/5/6/7/8/8), Einheits has 5 (counts
  6/7/7/8/9), so which Rheinische row corresponds to which Einheits row
  isn't obvious from counts alone (see "The domain" above — button *count*
  doesn't imply note *arrangement*). The user supplied the missing piece:
  144's id 56 corresponds to 142's button labeled "8/0", 144's id 65
  corresponds to 142's "7/0", and 144's id 64 is an extra button added to
  the *left* (not right, unlike every bass case) of that "7/0" position.
  That pins down the correspondence as **142 row `k` ↔ 144 row `k-1`, for
  k=2..6** — i.e. aligned from the bottom, the same principle
  `keyboard-mapping.js` already uses for the computer-keyboard row
  assignment (`maxRow - N + 1`) — leaving 142's row 1 (topmost, 4 buttons,
  ids 34–37) with **no 144 counterpart at all**, since 144 only has 5 rows
  total and rows 2–6 of 142 already consume all of them. Checking that
  hypothesis with the same least-squares fit used for bass turned up
  something unexpected: rows 2, 3, and 4 fit **perfectly** (residual ~0,
  the "difference" was 10th-decimal-place float noise, not a real
  mismatch) — meaning most of 142's treble side was *already* exactly
  aligned with 144's, unlike bass, which needed a uniform rescale
  everywhere. Only two buttons were real outliers, both the leftmost
  (`order: 1`) button of their row and both a slash-labeled combination
  button rather than a plain numbered one: 142's id 56 (`"8/0"`, row 5) was
  off from 144's id 56 by 0.0093, and 142's id 64 (`"7/0"`, row 6) was off
  from 144's id 65 (the position after 144's left-side extra) by 0.023 —
  both corrected to match 144's value exactly, matching the "adjust 142 to
  follow 144" direction already established for bass, since it's a single
  value copy either way and keeps one system as the consistent reference
  point rather than splitting corrections across both. Row 1 (142's
  topmost, no counterpart) was left as originally extracted — there's
  nothing in 144 to align it against. **Takeaway for future data work**:
  don't assume a whole-row rescale is always the right shape of fix just
  because it was for bass — check the actual residuals per row first, since
  here it would have been the wrong tool (it would have *moved* 6 out of 8
  buttons per row away from an already-correct position, to fix the 1 that
  was actually wrong).
- **`144-einheits`**: built this session from scratch. The user manually
  extracted `data144.csv` (id, x, y — same row-major-id convention as
  `data142.csv`) from `layout-bandoneon-144-einheits.pdf`. Note *labels*
  (as opposed to positions) were extracted programmatically: the PDF was
  rasterized, circle centers were detected with OpenCV
  (`cv2.HoughCircles`), fit to the CSV's normalized coordinates via a
  least-squares affine calibration, and each `id` was matched to its
  nearest detected circle (verified unique, sub-30px typical error) before
  cropping and reading the label at that exact position. This was then
  **independently cross-checked** against a second, separately-sourced PDF
  (`142-144-keyboard-comparison.pdf`) using the identical pipeline. Of 144
  note values (72 open + 72 close), cross-checking surfaced and corrected
  4 specific errors (see Decision Log entry on the `b`/`h` question and the
  three prime-mark misreads); the rest matched across both independent
  sources.
- **Known residual risk, explicitly accepted by the user**: the
  `144-einheits` data has *not* been checked against a real Einheits player
  or instrument — only against two printed/PDF charts, one of which the
  user described as being "from some ancient website" (hence trusting the
  newer comparison PDF more where they disagreed). The user's own words:
  they'll find someone with a real Einheits bandoneon eventually and fix
  any remaining note errors then. **Do not treat `144-einheits` as
  ground-truth-verified against a real instrument** — treat it as
  "carefully cross-checked against two documentary sources," which is a
  meaningfully lower bar.
- `bandoneon-utils.js`'s `genDefaultMapping()` fallback (used only if
  `window.defaultMappings[layout]` is missing/empty) is a **placeholder
  numbered-sequence generator**, not real data for any instrument. It's a
  last-resort fallback, not a system to trust.
- **`144-einheits` button `label`s are NOT sourced numbers, unlike
  `142-rheinische`'s.** The user has never played a real 144-tone Einheits
  instrument and, after checking two sources (an onmusic.org dictionary
  entry and Peter Haas's `bandoneon.petermhaas.de` grifftabellen page —
  which explicitly defers 142/144-tone charts to individual builders'
  websites), there appears to be **no standardized button numbering for
  the 144-tone Einheits system** — it's plausibly builder-specific, and
  some real instruments may be unmarked entirely. Rather than invent a
  numbering and imply false authority, the `label` field for this layout
  is just a plain sequential count in the app's own left-to-right,
  top-to-bottom, bass-then-treble reading order (`1`–`35` = left/bass,
  `36`–`72` = right/treble, matching `id`) — an internal reference number
  for pointing at a specific button, not something printed on a real
  instrument. (It used to read `"E1"`–`"E72"`; the `E` prefix was dropped
  since it read as more official than it was — see the comment directly
  above `"144-einheits"` in `mappings.js`.) The *note values* themselves
  are unaffected by this — see the `144-einheits` provenance entry above,
  which is about pitch data, not labels.

### The harmonic tables are meant to outlive this app

`accordion-harmonics.js` (accordion) and `bandoneon-harmonics.js` exist partly
**as a reusable measured-data asset for the user's other projects** — e.g. a
separate static accordion chord-practice site — not only to feed this app's
reed synth (user, 2026-09). Two consequences worth respecting:

- **Keep them standalone and framework-free.** Both are plain
  `window.<name> = {...}` data files with a generator-script header, no
  imports, no dependency on anything else here. Another static site should
  be able to drop in the file and use it with one `<script>` tag. Don't
  fold them into `app.js`, and don't reshape them to suit this app's
  internals alone.
- **The file was renamed for exactly this reason** (2026-09): it used to be
  `reed-harmonics.js` / `window.reedHarmonics`, which read as if it covered
  every free reed when it's accordion-only. Done while this repo was still
  the sole consumer, specifically so the chord-practice project starts from
  the honest name. **The generator script that writes it
  (`accordion_analysis/generate_periodic_waves.py`) is not in this repo** —
  only its notes and plots are — so it still emits the old name and global.
  Rename them there before regenerating, or you'll get an unreferenced
  `reed-harmonics.js` dropped alongside this one and no error to tell you.

**What the data actually shows** (analysis run 2026-09; 7 sampled keys ×
3 registers for accordion, 25 measured notes for bandoneon):

- **Brightness falls with pitch — the one pattern strong enough to build
  on.** Accordion's `low` register is perfectly monotonic across all 7
  keys: spectral tilt +0.4 dB/oct at MIDI 53 down to −15.9 dB/oct at 93,
  centroid 5.64 → 1.23. Bandoneon agrees independently at r = −0.878
  (tilt vs log f0, n = 25). Physically expected, and consistent across two
  different instruments and two separate recording sessions.
- **High notes go nearly pure**: harmonics above 0.1 amplitude drop from
  10 to 2–3 by the top of the range. The odd/even ratio *looks* like it
  explodes there (up to 26:1), but that's an artifact of everything except
  the fundamental falling to near-zero — not real odd-harmonic character.
- **Bandoneon reed beat is ~constant in Hz, not in cents**: 0.58–0.96 Hz,
  mean 0.84, and **uncorrelated with pitch** (r = 0.006, n = 14 reliable).
  If a real bandoneon voice is ever built, that argues for modeling detune
  as a fixed *beat rate* rather than `REED_PRESETS`' fixed `detune` in
  cents (a constant cents value would make the beat rate climb with pitch).

**What the data is too thin to support** — do not draw these conclusions:

- **Open vs close timbre**: only **4** note pairs overlap between the two
  bellows directions. Mean tilt difference −1.67 dB/oct, but the spread is
  −4.9 to +2.3 — the sign flips. Unusable as-is; needs the same notes
  recorded both directions.
- **Left vs right side**: fully confounded with pitch (left mean f0 205 Hz
  vs right 848 Hz), so the apparent side difference is just the
  brightness-vs-pitch pattern again.
- **Accordion's `hi` register**: non-monotonic and noisy (tilt jumps back
  up at keys 77/84), unlike `low`/`mid`. It's also the register nothing
  reads yet — treat it as unvalidated.
- **8 of 210 accordion amplitudes sit pinned at exactly 1.9953** = +6.0 dB,
  a ceiling in the analysis rather than a measurement. All are in `low` at
  keys 53/60/65 (the loudest notes), so those particular partials are
  clipped and understate nothing — they *overstate* by saturating.
- **No repeat takes anywhere**, so there are no error bars. A single bad
  take is one bad data point with nothing to reveal it.

## Decision log (with reasoning, in roughly chronological order)

Recording *why*, not just *what*, since a lot of these decisions came from
ruling out a simpler-looking alternative for a specific reason — worth
knowing before "simplifying" something back to the naive version.

1. **Reed synthesis is fully synthesized, not sampled.** Constraint: static
   GitHub Pages site, no asset pipeline wanted. Trade-off accepted:
   synthesis will never be quite as convincing as a sampled reed, but stays
   zero-dependency and infinitely tunable via sliders.

2. **Reed notes sustain until note-off; plain waveforms still use the
   original fixed 0.35s decay.** Changing *all* instruments to sustain
   would have been a bigger behavior change than asked for; reed instrument
   physically sustains as long as air moves over the reed, so only that
   path was changed.

3. **This surfaced a real bug**: the Stop button used to only clear the
   on-screen highlight (`stopHighlighting()`), never actually calling
   `stopTone()`. Harmless under the old fixed-decay model (sound stopped
   itself shortly regardless); would have left a reed note droning forever
   under the new sustain-until-release model. Fixed by having Stop (and MIDI
   seeking) call a proper `stopAllActiveNotes()` that force-releases
   everything currently active, not just visually.

4. **Button color is now `colorForMidi(note)` — a pure computed HSL
   formula — and nothing else.** (Later extended, not reverted: see #15 —
   `colorForButton()` now dispatches to this formula only under "Rainbow"
   mode; Piano/Single-color use fixed palettes instead. The point standing
   here is narrower than it originally read: no *per-note/per-button
   manual override* layer was reintroduced, not that no other mode exists.)
   Originally `findButtonColor()` checked
   four fallback layers (per-note override → per-button override →
   `color-ranges.js` lookup table → an undefined-in-any-file
   `defaultButtonColors` array → the formula). That undefined variable was
   a live `ReferenceError` waiting to happen for any note outside
   `color-ranges.js`'s covered range. Rather than patch the bug, the whole
   fallback chain was deleted at the user's request — it was more
   indirection than the feature justified. `color-ranges.js` is still
   `<script>`-loaded by `index.html` (harmless, now inert) but nothing
   reads `window.buttonColorRanges` anymore.

5. **`row`/`order` were added as explicit fields, replacing an implicit
   "id happens to be assigned in row-major order" convention.** The
   original bandoneon-utils.js comment literally called `id` "a dummy id...
   because there are duplicate notes" — it was never meant to carry
   ordering meaning, yet the keyboard-mapping feature needed row grouping,
   and initially borrowed `id`'s ordering as a stand-in. That's a fragile,
   undocumented contract (silently breaks if anyone ever reorders entries).
   Row boundaries were derived from the `id`-ordering + verified
   note-for-note against the reference chart images before being written
   as an explicit field, via a one-time migration script
   (`add_row_order.js`, already run — the *output* is what's in
   `mappings.js` now, not the script itself).

6. **`normalizeMapping()` was silently stripping `row`/`order` on every
   load** (it only copied a fixed set of known fields) — caught and fixed
   in the same pass as adding the fields, since otherwise they'd have been
   dead on arrival for both the built-in defaults and any custom uploaded
   mapping.

7. **Layout keys renamed `"142"`/`"144"` → `"142-rheinische"` /
   `"144-einheits"`, and the old placeholder `"144"` (which was a literal
   note-for-note copy of `"142"`'s data, never real) was fully replaced**
   with genuine Einheits data once it existed. Reasoning: button-count
   alone doesn't determine note arrangement (see "The domain" above) — a
   bare `"144"` key would become actively ambiguous the moment a second
   144-button system was ever added, so it was worth fixing before that
   happened rather than after.

8. **Keyboard-row starting point (`KEYBOARD_ROW_START`) made dynamic**,
   computed as `maxRow - 4 + 1` per loaded layout, instead of a hardcoded
   `3`. Rheinische has 6 treble rows; Einheits has only 5. A hardcoded
   "rows 3-6" would have silently mapped zero buttons to the bottom
   keyboard row (`X-.`) the moment Einheits was loaded, since Einheits has
   no row 6.

9. **Keyboard key-sets made data-driven** (`PHYSICAL_KEYBOARD_ROWS` +
   `DEFAULT_ROW_ANCHORS` + `selectKeysForRow()`) instead of hardcoded
   per-row arrays, specifically so that (a) Einheits' longer rows (9-button
   bottom row vs. Rheinische's 8) extend outward (`Z` added, matching the
   user's explicit request) rather than needing a special case, and (b) a
   future third system with yet another row-length profile should work
   without touching this code at all, as long as it provides `row`/`order`
   data and its row lengths fit within 10 physical keys per row.

10. **The `b` vs. `h` note-letter question** (German Helmholtz convention:
    `h` = B-natural, `b` = B♭, vs. plain English where `b` always means
    natural). Resolved empirically, not by assumption: the position known
    to be B-natural (independently verified against the user's own
    already-correct `mappings.js` data) was labeled `b'''` in *both* PDF
    sources, including at the one spot where the original single-source PDF
    showed a stray `h''` — the newer, more-trusted comparison PDF showed
    `b''` at that same calibrated position. Conclusion: `b` = B-natural
    throughout; the lone `h` was a transcription slip in the older source,
    not a deliberate second symbol. All notes encoded accordingly.

11. **Two compatibility banners added (`index.html`, first things in
    `<body>`), because a no-JS visitor and a too-old-JS visitor fail
    completely differently and need separate handling.** `app.js` uses
    ES2020 syntax throughout (optional chaining `?.`, nullish coalescing
    `??`, plus `async`/`await`, arrow functions, template literals) with no
    build step, no transpiler, no polyfills — whatever's in the file is
    exactly what ships. That sets a real compatibility floor: roughly
    Chrome/Edge 80+, Firefox 74+, Safari 13.1+ (all ~March 2020). Below
    that, `app.js` is a hard `SyntaxError` at parse time, not a missing
    feature.
    - A `<noscript>` block covers **JS fully disabled** — straightforward,
      renders exactly when scripting is off.
    - That alone isn't enough: `<noscript>` **never fires when JS is
      enabled but a script fails to parse** — the visitor's browser is
      running JS, so scripting isn't "disabled." Without a second
      mechanism, a too-old browser gets total silence: blank keyboard, dead
      buttons, no explanation, no console message visible to a normal
      user — arguably worse than the no-JS case, which at least explains
      itself.
    - Fixed with a small inline probe, deliberately written in pre-ES2015
      syntax (`var`, `function` expressions, string concatenation — no
      `let`/`const`, arrow functions, template literals, or optional
      chaining) so the probe itself can run on the very browsers it's
      testing. It does `new Function('return null?.x ?? 1')` inside a
      `try`/`catch`: the `Function` constructor compiles its argument
      immediately, throwing synchronously on unsupported syntax without the
      function ever needing to be called — so construction alone is the
      parse test. On failure, `document.write` inserts a visible banner
      before anything else loads.
    - Both banners share one `.compat-banner` CSS class (in `styles.css`)
      for consistent styling, since they're the same *kind* of message
      (this won't work, here's why) even though they trigger on opposite
      conditions (JS off vs. JS on-but-ancient).
    - Not fixed further: no attempt was made to widen the actual
      compatibility floor (e.g. rewriting `?.`/`??` to `&&`/ternary chains
      to support browsers back to ~2017). That's real, mechanical work
      across ~9 call sites for a trade-off (readability, for supporting
      devices that are rare among people likely to receive this link) the
      user hasn't asked for — the banners just make the existing floor
      *visible* instead of silent.

12. **i18n implemented as client-side JS string-swap, not per-language
    static HTML files — a deliberate trade-off, not the default choice.**
    The static-file approach (real, pre-rendered HTML per language, crawlable
    by any bot including with JS off, correct `lang` per file) is more
    robust for content/SEO purposes, but needs a build step to generate the
    files from a template — a real cost for a project that's otherwise
    zero-tooling. Client-side swap was chosen instead because this app's
    audience is people the link gets shared with directly (the whole reason
    languages were added — friends who speak them), not search engines
    discovering it in their language; bot-crawlability across languages
    doesn't matter here the way it might for a content site. Accepted
    trade-off: a crawler that doesn't execute JS only ever sees the English
    default. Two things were fixed specifically because "just swap the
    text" alone (the user's own prior experience: their personal site did
    exactly this and it caused problems) breaks accessibility if left there:
    `document.documentElement.lang` is updated on every language switch
    (screen readers pick pronunciation rules from it — leaving it stuck on
    `en` while showing German text would mispronounce everything), and
    dynamic status strings re-stamp their own `data-i18n` key via
    `setI18nText()` so a language switch mid-session re-renders the actual
    last-shown status, not just the page's original load-time text.

13. **Button highlight intensity fixed to track each note's own velocity,
    not the loudest note anyone happened to be holding at the same time.**
    `updateButtonHighlights()` used to compute one `maxVel` across every
    currently-active note and paint that same brightness onto every lit
    button — so a softly-played note held alongside a hard-hit one would
    visually read as equally loud, which is exactly backwards for a feature
    meant to show velocity. Fixed by tracking velocity per-button
    (`buttonVelocities`, a `Map` from button id to the velocity of the note
    lighting it) instead of one shared max. Same pass also fixed the
    alpha formula: `maxVel / 160` capped at `0.6` meant the cap was already
    reached at velocity 96, so the top quarter of the MIDI velocity range
    (96–127) was visually indistinguishable even for a single note in
    isolation; changed to `vel / 127 * 0.6` so the full 0–127 range maps
    onto the full 0–0.6 alpha range.
    - **Related, smaller fix in the same investigation**: mouse clicks and
      computer-keyboard presses used to simulate different velocities (127
      vs. 100) for no real reason — neither input method carries an actual
      velocity signal, so there was nothing to justify them disagreeing.
      Unified under one named constant, `SIMULATED_VELOCITY = 100`, used by
      both, so they can't silently drift apart again.

14. **Keyboard matching switched from `KeyboardEvent.key` to `.code`.**
    `key` reports the *character* a key produces, which changes under Shift
    (and, for letters, Caps Lock) — the handler already lowercased letters
    to absorb that, but the top number row and the `; , . /` punctuation
    keys have no such fix: Shift+`;` reports `:`, a different string
    entirely, so holding Shift silently broke those specific buttons (they
    just wouldn't sound). `code` reports physical key *position* instead
    (e.g. `'KeyA'`, `'Semicolon'`, `'Digit1'`) and is immune to every
    modifier, fixing this for good — and as a side effect makes the mapping
    stay pinned to the same physical keys across non-QWERTY OS keyboard
    layouts (AZERTY, Dvorak, etc.), the same way WASD-style game controls
    are typically bound. `keyboard-mapping.js` now defines
    `PHYSICAL_KEYBOARD_CODES` index-parallel to the existing
    `PHYSICAL_KEYBOARD_ROWS` (characters), and `computeKeyAssignments()`
    returns both `key` and `code` per assignment — `code` for matching
    (`keyboardCodeMap`, `heldKeyNotes`, both renamed/rekeyed from the old
    `keyboardKeyMap`), `key` still only for the on-screen key-cap label.
    **Known limitation, not fixed here**: the key-cap badge still always
    shows the QWERTY character, so a non-QWERTY player's physical keycap
    won't visually match it (right finger position, different printed
    letter). Properly relabeling it per actual layout would need
    `navigator.keyboard.getLayoutMap()`, which is Chromium-only and
    permission-gated — left as a known gap rather than solved.

15. **Hint (Default/No hint) and Button color (Rainbow/Piano/Single color)
    were added as two independent toggles, not one combined "with markings
    / without markings" mode**, because they need fundamentally different
    mechanisms: Hint is purely presentational (a container CSS class can
    hide/show existing DOM, see `.hints-off` in styles.css) while Button
    color changes the actual computed background/border per button (needs
    `colorForButton()` + a `renderMapping()` pass). Splitting them keeps
    Hint's toggle free of any re-render cost, at the cost of there being no
    single switch for "show me nothing" — a fully blind practice mode needs
    both set together (Hint: No hint, Button color: Single color). See
    "Hint mode" and "Button color" above for the full behavior, including
    the known gap that the hover tooltip leaks the answer regardless of
    Hint mode.

16. **Reed synthesis rewritten from a generic 2-oscillator model to a
    4-voice, measured-timbre model, and a 4th instrument (Musette) added.**
    The original design (two detuned `sawtooth` oscillators as a symmetric
    wet pair, no dry reed, plus one `triangle` sub-oscillator) was a
    reasonable first pass but didn't reflect how a real free-reed instrument
    is actually voiced (a true in-tune `M` reed plus separately-switchable
    `M-`/`M+` tremolo partners and an `L` bass reed), and used a generic
    waveform everywhere rather than anything measured from a real
    instrument. Replaced with the model described in "Reed synthesis" above:
    4 always-built oscillator slots (`M-`/`M`/`M+`/`L`) individually
    gain-gated per preset, each trying a real-timbre `PeriodicWave` built
    from `accordion-harmonics.js`'s Fourier-analyzed accordion recordings
    (`getReedPeriodicWave()`, nearest-sampled-key snapping, cached per
    `register:sampleNote`) before falling back to a plain
    `sawtooth`/`triangle` if that data isn't available. `REED_PRESETS` grew a
    4th instrument, Musette (full `M-`+`M`+`M+` wet trio, no bass reed), and
    each preset's `voiceMflat`/`voiceM`/`voiceMsharp`/`harmMix` fields
    replace what used to be an implicit "always 2 mid + 1 sub" structure.
    Headroom compensation (`0.75 / sqrt(activeVoices)`) was added at the same
    time since up to 4 summed oscillators (vs. 2 before) pushed some presets
    noticeably louder than others. **Net effect on the "Open items" wet-reed
    recording work below**: the harmonic-*timbre* measurements
    (`accordion_analysis/results.json` → `accordion-harmonics.js`) are now wired
    into `app.js` via this rewrite — that item should no longer be read as
    "not yet wired in." The separate *velocity-layered* (loud/weak) recording
    analysis remains unwired, since that work was inconclusive (see its own
    "Open items" entry) — don't conflate the two: one measures how the
    harmonic *spectrum* differs per note/register (done, wired in), the other
    would measure how the spectrum differs per *velocity* at a fixed note
    (attempted, inconclusive, not wired in).

17. **`reed-harmonics.js` renamed to `accordion-harmonics.js`** (global
    `window.reedHarmonics` → `window.accordionHarmonics`), 2026-09. The old
    name claimed the whole free-reed family while holding accordion-only
    measurements, which matters more now that the harmonic tables are meant
    to be reused by the user's other static projects (see "The harmonic
    tables are meant to outlive this app"). Done at the user's go-ahead
    precisely *because* this repo was still the only consumer — the cost of
    renaming rises the moment a second project points at the old name.
    Touched: the data file's own header and global, `index.html`'s
    `<script>` tag, `app.js`'s `getReedPeriodicWave()` and two comments, and
    every mention in this document. Verified by grep that no reference to
    the old name survives in the repo. **Two things the rename did NOT
    fix**, both pre-existing and still open:
    - The generator script is outside this repo and still writes the old
      name/global (see that section's warning).
    - Every reed instrument, `bandoneon` included, still sounds from this
      accordion table. `bandoneon-harmonics.js` remains loaded by nothing.
      The rename makes that mismatch *visible* rather than fixing it, which
      was part of the point — the old generic name disguised it.

18. **Instrument metadata extracted to `instruments.js` (Phase 1 of a
    planned concertina expansion), 2026-09.** Researched adding Anglo /
    English / German / Chemnitzer concertinas and found the *variable
    button count wasn't the obstacle* — the data model already carries
    explicit `row`/`order`/`x`/`y` per button with no fixed count anywhere,
    and `keyboard-mapping.js` was built for exactly this. The obstacle was
    bandoneon assumptions hardcoded across four files. Rather than add a
    second instrument family on top of that (and pay to touch the same
    places twice), the metadata layer went in first.
    **Deliberately a behavior-preserving refactor**: the dropdown renders
    identically (hence the conditional-`<optgroup>` rule), translations
    still come from the same `layout142`/`layout144` keys via `data-i18n`,
    and ids are unchanged so saved mappings survive. If anything *looks*
    different, that's a bug, not the feature.
    Still hardcoded, by design, for later phases: panel titles
    (`leftSideBass`/`rightSideTreble`), the keyboard row anchors, and the
    bellows control's unconditional presence. `bisonoric` and `sideLabels`
    are populated but read by nothing yet.
    The remaining concertina blockers are written up under "Open items".

19. **Phase 2: panel titles and keyboard anchors made data-driven, 2026-09.**
    `renderMapping()` reads `sideLabels`; `assignKeyboardKeys()` reads
    `keyboard` (named anchor sets) and `bonusKeys` instead of calling
    `computeKeyAssignments`/`computeBassKeyAssignments` directly and
    note-searching for C4/C#4 inline. `keyboard-mapping.js` gained
    `ANCHOR_SETS` plus `computeAssignmentsFor()`/
    `computeFunctionKeyAssignmentsFor()`; the three bandoneon-specific
    wrappers stayed, as the readable shorthand the unit tests use and as
    the documented meaning of each set.
    **Verified behavior-preserving by diffing the two code paths**: the old
    hardcoded logic and the new metadata-driven one produce *identical*
    bindings on both systems — 33 on 142-rheinische, 36 on 144-einheits,
    same key → same button id throughout, F4 landing on id 38/36
    respectively. An unknown or absent anchor-set name yields no keys for
    that side rather than throwing, so a half-specified system degrades
    instead of borrowing bandoneon row shapes by accident;
    `instruments.test.js` guards against the typo that would cause it.

20. **Phase 3: unisonoric support, 2026-09.** See "Unisonoric systems"
    above for the mechanism. Built before any unisonoric data exists,
    deliberately: the English concertina is the system whose *shape* most
    challenges this app's assumptions (unisonoric, and notes alternate
    between hands so neither side is bass or treble), and finding that out
    while also entering 48 buttons of data would have confused two kinds of
    failure. Both bandoneons are untouched — `bisonoric` defaults to true
    when a system omits it. Verified with fake systems rather than real
    data: a valid unisonoric one passes the new data guard, a deliberately
    mislabelled bisonoric one fails it.

## Testing

`bandoneon-utils.test.js` and `keyboard-mapping.test.js` cover the project's
two pure, DOM-free modules (`bandoneon-utils.js`, `keyboard-mapping.js`) —
plain Node scripts, no framework or dependency, using only Node's built-in
`assert`. Run either with e.g. `node bandoneon-utils.test.js`; both print
per-test ✓/✗ and a summary line, and set a non-zero exit code on any
failure (so `node bandoneon-utils.test.js && node keyboard-mapping.test.js`
chains cleanly if that's ever wired into anything).

They attach to the browser-global pattern these two files use
(`window.bandoneonUtils`, `window.keyboardMapping`) via `global.window =
global;` before `require()`-ing them unmodified — no `module.exports` was
added to either file, so they still load fine as plain `<script>` tags in
`index.html`, identical to before.

**Deliberately not covered**: `app.js` itself (DOM rendering, Web Audio,
Web MIDI — see the earlier "why no test suite" reasoning: mocking all of
that is high effort for low confidence, since what actually matters is
whether it sounds/looks right, which a unit test can't judge) and
`mappings.js`'s actual note data (that's a correctness question about real
instruments, verified by cross-checking against reference charts — see
"Data provenance" above — not a logic question a test would catch).

`keyboard-mapping.js` was pulled out of `app.js` specifically to make this
possible: it used to be inline, DOM-adjacent code (`assignKeyboardKeys()`
mutated `app.js`'s own `keyboardCodeMap`/`mapping` state directly). Now
`keyboard-mapping.js` exposes a pure `computeKeyAssignments(rightSideButtons)`
that returns assignments without mutating anything, and `app.js`'s
`assignKeyboardKeys()` just applies that result to its own state. Confirmed
behavior-identical to the pre-extraction inline version by comparing its
output against both real layouts in `mappings.js` before and after the
refactor.

## Known dead code / cleanup candidates

- `color-ranges.js` — loaded but unused (see Decision Log #4). Safe to
  delete the `<script>` tag in `index.html` and the file itself, whenever
  convenient; not urgent.
- `add_row_order.js` — a one-time migration script, already run. Its output
  is baked into `mappings.js`. Not referenced by the running app. Fine to
  delete, or keep as a paper trail for how `row`/`order` were derived — up
  to you.

## Open items / natural next steps

- **Concertina support, phase 4** (Phases 1-3 done — see Decision Log
  #18-20). The engine is ready; what's left is data:
  - **Phase 4 — data entry.** Start with **Anglo 30-button C/G**: bisonoric
    (so it needs no new concepts), the most common concertina, only 30
    buttons. Unlike the bandoneon, concertina rows are *regular*, so `x`/`y`
    can be computed from an arc formula rather than pixel-extracted from a
    diagram — that was the expensive part of the bandoneon data and it's
    avoidable here.
  - Systems worth knowing about, from the research: Anglo (20/30/38/40,
    bisonoric, 2 diatonic rows a fifth apart + accidental row), English (48/
    56/64, **unisonoric**, 4 staggered rows, notes *alternate between
    hands* — so neither side is "bass" or "treble"), German (Uhlig's
    original 20, bisonoric, ancestor of both Anglo and bandoneon),
    Chemnitzer (38/39/51/52 **per side**, bisonoric, the bandoneon's
    closest relative), duets (Maccann/Crane/Hayden, 35-80, unisonoric).
    Note that count is only one axis: **bisonoric-vs-unisonoric, key
    (C/G vs G/D), and maker variant (Wheatstone vs Jeffries differ in the
    accidental row at the *same* button count)** vary independently, which
    is why ids look like `anglo-30-cg` rather than a bare number.
  - Chart sources (images/HTML, not machine-readable — hand entry):
    [concertina.com/fingering](http://www.concertina.com/fingering/index.htm)
    covers every system including all duet variants;
    [concertina.info FAQ](https://www.concertina.info/tina.faq/images/finger3.htm)
    has C/G Anglo and 48-button English charts.

- **Bass F9: 0/0 or 4/4? (unconfirmed, user, 2026-09.)** F8 is fixed on
  bass row 1's 𝄌 (id4). Its F-key partner is 0/0 (id5, F9) for now,
  because that pairing fits the geometry better (~0.26 vs ~0.52 key-widths
  average error). The user isn't sure whether real players use 4/4 or 0/0
  more. If it turns out to be 4/4, change `BASS_FUNCTION_KEYS` in
  `keyboard-mapping.js` to F8 → order 3, F9 → order 4, and update the
  matching test in `keyboard-mapping.test.js`. A one-line data change.

- **"No hint" mode's hover tooltip still reveals the answer.** See Decision
  Log #15 / the "Hint mode" section above — `renderMapping()`'s `title`
  attribute isn't gated on hint mode, so a mouse user can hover instead of
  looking. If this is meant as a real practice/quiz mode, worth moving that
  text to `aria-label` (for screen readers) and suppressing the visible
  `title` when Hint = "No hint".
- **`i18n.js`'s 8 translation dictionaries need a native-speaker review.**
  See the "Internationalization" section's caveat above — they were written
  by the assistant, not verified by anyone fluent in the target languages.
  The user's own stated reason for adding these specific 8 languages was
  friends who speak them; if/when one of those friends actually uses the
  page, that's the natural point to collect corrections.
- **`144-einheits` bass side is real data now** (this session finished it),
  but per "Data provenance" above, treat it as "cross-checked against
  documents," not "verified against a real instrument." The user
  specifically plans to verify against a real Einheits player later and
  will fix any remaining note errors then — don't be surprised if some
  come in.
- **Third+ fingering systems** (110-button variant, concertina, Chemnitzer
  were mentioned as "someday, not now"): the data model (`row`/`order`/`x`/
  `y`/`open`/`close` per button, keyed by a compound `"count-system"`
  layout string) and the keyboard-mapping code (`keyboard-mapping.js`'s
  `PHYSICAL_KEYBOARD_ROWS` + anchor-extension) were both designed with this
  in mind, but *only one* additional system (Einheits) has actually been
  added, so the generalization is proven for exactly one extra case, not
  battle-tested across many. If a genuinely different *geometry* (not just
  different row lengths — e.g. concertina's layout isn't diagonal-hex the
  same way) comes up, expect to need real design work, not just new data.
  `keyboard-mapping.test.js`'s regression-guard test is the fastest way to
  sanity-check a new system's row lengths didn't break the extension logic.
- **No test suite covers `app.js`, `mappings.js`'s note data, or anything
  DOM/audio/MIDI-related** — see "Testing" above for why, and what's
  covered instead (`bandoneon-utils.js`, `keyboard-mapping.js`). That's a
  deliberate scope choice given this project's size and deployment model,
  not an oversight to "finish" — but worth re-examining if either untested
  area keeps growing in complexity.
- **Instrument provenance** (came up while discussing the recordings below,
  worth keeping on record since neither instrument's origin is derivable
  from the audio itself): the accordion is an Italian **Serenellini**. The
  user's own estimate is that its "wet" reed pair (M vs M-/M+) is tuned
  **~11-12 cents** per side — `accordion_analysis/reinterpret_registers.py`'s
  higher-register measurements (G3, C5: 5-8c) landed closer to this than
  the lower-register ones (C3, G2: 51-64c) did, so 11-12c is the figure to
  treat as this accordion's actual spec, not an average of everything
  measured (see the next item for why the low-register numbers are less
  trustworthy). The bandoneon is second-hand, marked **"Arno Arnold"** — per
  the user, Arno Arnold was a relative of the historically significant
  Alfred Arnold (legendary in tango circles), and some early Arno Arnold
  instruments are known to have used old Alfred Arnold stock parts. Whether
  *this* instrument does is unverified — a Taiwan repair shop the user
  consulted couldn't confirm it either (specialists in this instrument are
  scarce outside Europe/South America), so treat it as unresolved rather
  than pursue further unless new information surfaces.
- **Velocity-layered reed recordings** — first pass recorded and analyzed
  (`accordion_analysis/analyze_loud_weak.py`, using `mid *(loud|weak).wav`
  in `samples/accordion/`), but inconclusive: the user's audio interface
  gain knob slipped between takes, decoupling `rms_db` from actual playing
  force (a pure gain change doesn't corrupt the harmonic-*balance*
  measurement itself — it's normalized to each file's own fundamental, so
  gain cancels out — but it does mean loudness can no longer be used as the
  x-axis for a clean brightness curve). One signal came through anyway: the
  2nd harmonic brightened under "loud" in 6 of 7 notes (avg +5.9dB), which
  is plausibly real. Nothing from this is wired into `app.js` yet. If
  redone, keep the gain knob fixed across soft/normal/loud takes of the
  same note so `rms_db` is trustworthy again.
- **Real bandoneon recordings** — done: 25 notes across both bellows
  directions and both sides, in `samples/bandoneon/{open,close}/{left,right}/`.
  Analyzed by `analyze_bandoneon.py` (harmonics, pitch, reed-beat, attack)
  and exported by `generate_bandoneon_waves.py` into `bandoneon-harmonics.js`
  (same linear-harmonic-table format as `accordion-harmonics.js`, keyed by
  bellows/side/note instead of register/MIDI-key since a bandoneon button is
  one fixed pitch, not a switchable stop) — **generated but not yet wired
  into `app.js`**; that's the natural next step whenever a real bandoneon
  voice is wanted. Findings (full detail in `bandoneon_results.json`):
  - **Tuning**: 24 of 25 notes measured 5-22 cents sharp of standard A440;
    one (`C2`) measured 11.4c flat. Reads like this instrument was built to
    a reference pitch other than 440Hz rather than being randomly out of
    tune, but that's a guess pending someone who knows the instrument.
  - **Reed-beat**: remarkably consistent, ~0.8-1.4Hz across nearly the
    whole range, both sides, both bellows directions (one outlier at
    6.25Hz, flagged low-confidence off a short note) — a cleaner, more
    consistent result than the accordion's own wet-stop measurement below.
  - **The ML/MM-octave assumption in the previous version of this entry was
    wrong.** It assumed "ML" meant a Low reed sounding an *octave* below a
    Mid reed, like the accordion's bass register. Checking every note for
    energy at exactly half its fundamental (the smoking gun an octave-down
    reed would leave, since a reed has no partial below its own
    fundamental) found nothing anywhere — all -42 to -74dB, i.e. absent.
    That points to "L" and "M" naming different reed *plates/materials*
    paired at the *same* pitch (parallel to how "MM" pairs two of the same
    type) rather than different octaves — **unconfirmed, needs the user
    (or someone who knows this instrument) to verify**, since it changes
    how any future bandoneon voice should be built.
- **Wet-reed ("stop") accordion recordings** — first pass
  (`samples/accordion/registers/{L&M,L&M&M+,M&M+,M-&M&M+}.wav`) recorded as
  short passages rather than held notes, so `analyze_registers.py` had to
  auto-segment them (error-prone) and most segments came out under 1.5
  seconds — too short to resolve a sub-few-Hz beat precisely. Also
  discovered along the way: `L&M` isn't a beating pair at all (L and M are
  an octave apart; only pairs containing both M and M+/M- actually beat),
  and the beat-to-cents conversion needs the *full* measured beat (not
  half) when one reed (M) is the stationary dry reference — see
  `reinterpret_registers.py`'s docstring for the derivation. Redo agreed
  with the user: **one note per file** (not a passage), held **5-8
  seconds**, **3-4 notes** across the range is enough. Once that lands, both
  scripts above are ready to reprocess it as-is. **Separate from, and not to
  be confused with, the harmonic-timbre measurements below** — this item is
  specifically about measuring the *beat rate/cents* of wet reed pairs, which
  is still open regardless of the timbre work being wired in.
- **Accordion harmonic-timbre measurements are wired into `app.js`.**
  `accordion_analysis/results.json`'s per-note Fourier analysis (harmonics
  1-10, per reed rank, at 7 sampled keys) was exported to `accordion-harmonics.js`
  and is now read live by `startReedVoice()`/`getReedPeriodicWave()` — see
  Decision Log #16 and "Reed synthesis" above. Only the `low`/`mid` registers
  are actually used; the file's `hi` table is measured and present but not
  yet wired to a third oscillator rank. This is distinct from the
  *velocity-layered* (loud/weak) recordings described next, which remain
  unwired.
