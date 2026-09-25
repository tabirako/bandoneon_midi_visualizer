// Instrument "spec sheets" — one entry per selectable system, keyed by the
// SAME id as window.defaultMappings in mappings.js. Think of this file as
// the table of contents: mappings.js holds the (large) per-button data,
// this holds the small amount the app needs to know *about* a system.
//
// Why it exists: the app used to know a system only by its id string and
// pattern-match on it (`if (layout === '144-einheits')`), with everything
// else — the dropdown options, the panel titles, the keyboard anchors —
// hardcoded for bandoneon. Every new instrument meant another `if` in
// several files. Moving that knowledge into data means adding an
// instrument is (mostly) adding data, not editing code. Same approach
// i18n.js already uses: window.languageNames drives the language dropdown,
// so a new language needs no HTML or code change.
//
// Adding a system: add its button array to mappings.js (or its own
// mappings-*.js file) and an entry here under the same key. Nothing in
// index.html needs touching — app.js builds the dropdown from this object.
//
// IDs ARE PERMANENT. The saved-custom-mapping localStorage key is
// 'bandoneon-mapping-v1-' + id, so renaming an id orphans anyone's saved
// mapping for it. Change `name`/`i18nKey` to improve what's displayed;
// leave the key alone.
(function () {
  window.instrumentSystems = {
    '142-rheinische': {
      family: 'bandoneon',
      // i18nKey wins when present (these two already have translations in
      // all 8 languages); `name` is the fallback for a system that ships
      // before anyone has translated it.
      i18nKey: 'layout142',
      name: '142-tone (Rheinische)',
      bisonoric: true,
      // Panel headings. A value with a matching i18n key is translated;
      // anything else passes through as literal text, because t() returns
      // its argument unchanged when no translation exists. So a new system
      // can just say `left: 'Left hand'` without touching i18n.js.
      sideLabels: { left: 'leftSideBass', right: 'rightSideTreble' },
      // Which named anchor set in keyboard-mapping.js maps each side's rows
      // onto the computer keyboard. Omit a side to give it no keys.
      keyboard: { left: 'bandoneonBass', right: 'bandoneonTreble' },
      // Extra bindings addressed by NOTE PAIR rather than row/order (that
      // kind lives with the anchor set, as bandoneonBass's F8/F9 do).
      // C4/C#4 sits in the topmost treble row, which the lower-4-rows
      // assignment never reaches, so this important central button would
      // otherwise have no key at all. Matched by note rather than id
      // because the ids differ between the two systems (38 vs 36).
      bonusKeys: [
        { code: 'F4', key: 'F4', side: 'right', close: 60, open: 61 }
      ],
      // Historical placeholder size used only when a system's button data
      // is missing/empty (see normalizeMapping). It's the *note* count, not
      // the button count (142 notes = 71 buttons × push/pull) — preserved
      // exactly as it was rather than corrected, so this refactor changes
      // no behavior. Worth revisiting on its own.
      fallbackButtonCount: 142
    },

    '144-einheits': {
      family: 'bandoneon',
      i18nKey: 'layout144',
      name: '144-tone (Einheits)',
      bisonoric: true,
      sideLabels: { left: 'leftSideBass', right: 'rightSideTreble' },
      keyboard: { left: 'bandoneonBass', right: 'bandoneonTreble' },
      bonusKeys: [
        { code: 'F4', key: 'F4', side: 'right', close: 60, open: 61 }
      ],
      fallbackButtonCount: 144
    },

    // Standard 30-button Anglo in C/G, Wheatstone/Lachenal layout — the
    // common one; Jeffries differs in the accidental row (see Open items).
    // Button data lives in mappings-concertina.js.
    'anglo-30-cg': {
      family: 'anglo',
      // No i18nKey: a system can ship before anyone translates it, and
      // sideLabels/name fall through t() as literal text.
      name: 'Anglo 30-button (C/G)',
      bisonoric: true,
      // Not "bass"/"treble": an Anglo's left hand is the low half of the
      // same diatonic rows, not a separate bass keyboard.
      sideLabels: { left: 'Left hand', right: 'Right hand' },
      keyboard: { left: 'angloLeft', right: 'angloRight' },
      // 15 buttons a hand fit on one keyboard side by side, so both hands
      // play at once and there's nothing for Caps Lock to switch between.
      handSwitch: 'none',
      fallbackButtonCount: 30
    }
  };

  // Display names for the <optgroup> headings, used only once more than one
  // family exists (with a single family the dropdown stays flat, exactly as
  // it looks today). i18nKey optional, same rule as above.
  window.instrumentFamilies = {
    bandoneon: { name: 'Bandoneon' },
    anglo: { name: 'Anglo concertina' }
  };
})();
