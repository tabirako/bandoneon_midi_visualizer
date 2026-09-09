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
| `keyboard-mapping.js` | `window.keyboardMapping` — `selectKeysForRow()` and `computeKeyAssignments()`, the pure logic that turns a layout's `row`/`order` data into computer-keyboard key caps. Extracted out of `app.js` specifically so it's unit-testable (see `keyboard-mapping.test.js`) and so adding a new fingering system's row-length data doesn't require touching DOM-coupled code. |
| `mappings.js` | `window.defaultMappings` — the actual button/note layout data for each supported system. This is the file most likely to be wrong in some small way; see "Data provenance" below before trusting any single note blindly. |
| `color-ranges.js` | Currently **dead code** — see "Known dead code" below. Still loaded by `index.html` but nothing reads `window.buttonColorRanges` anymore. |
| `add_row_order.js` | One-time migration script (already run) that added `row`/`order` fields to the Rheinische data. Kept for reference/history, not part of the runtime app. Not referenced by `index.html`. |
| `test-helpers.js`, `bandoneon-utils.test.js`, `keyboard-mapping.test.js` | Plain Node test files, no framework/dependencies — run with e.g. `node bandoneon-utils.test.js`. See "Testing" below. |

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
   absolutely positioned via `x`/`y`, colored via `colorForMidi()` (pure
   HSL-from-note-number formula — see Decision Log for why it's *only*
   this), labeled with note name + optional computer-keyboard key-cap badge.
3. **Audio** — two independent synthesis paths coexist in `playTone()`:
   - Plain waveforms (sine/square/sawtooth/triangle): short fixed-decay
     "pluck," unchanged from the original app.
   - Free-reed instruments (accordion/harmonica/bandoneon): a real
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
because this needs to work as a static site with zero asset files. Signal
chain per note:

- Two detuned `sawtooth` oscillators (reed-pair "beating"/chorus — real
  accordions tune two physical reeds a few cents apart on purpose)
- One `triangle` sub-oscillator an octave down (body/warmth)
- A lowpass `BiquadFilterNode` (shapes the buzzy sawtooth into something
  reed-like; cutoff/Q differ per instrument preset)
- Bandpass-filtered noise, loud on attack and fading (bellows "breath")
- An LFO modulating both main oscillators' `detune` (vibrato)
- A wrapping `GainNode` that ramps up on note-on and **only** ramps down on
  `stopReedVoice()` — i.e. it sustains for exactly as long as the note is
  held, not a fixed duration.

`REED_PRESETS` (accordion/harmonica/bandoneon) are just different starting
values for detune/breath/vibrato/filter — same signal graph throughout.
Three sliders (`#reedDetune`, `#reedBreath`, `#reedVibrato`) let the user
hand-tune these live; switching the instrument dropdown snaps them to that
preset's defaults.

These three sliders only affect `startReedVoice()`'s signal chain — plain
waveforms (sine/square/sawtooth/triangle) never read them at all (see
`playTone()`). `updateReedControlsAvailability()` disables the sliders
(native `disabled` attribute, plus a `.reed-disabled` class toggled on
anything marked `.reed-only` in the markup, for label dimming) whenever a
non-reed instrument is selected, and re-enables them when switching back.
Not just cosmetic — it tells the user these controls are currently inert
rather than implying they'd do something.

### Keyboard mapping (computer keys → treble buttons)

Deliberately scoped to **the lower 4 rows of the treble side only** — the
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
   formula — and nothing else.** Originally `findButtonColor()` checked
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
