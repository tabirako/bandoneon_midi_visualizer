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
| `index.html` | Markup + controls. No logic beyond wiring element IDs. |
| `app.js` | All application logic: rendering, audio synthesis, MIDI I/O. Keyboard-mapping *logic* now lives in `keyboard-mapping.js`; `app.js` just applies its result to its own state (`assignKeyboardKeys()`). |
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
mutated `app.js`'s own `keyboardKeyMap`/`mapping` state directly). Now
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
