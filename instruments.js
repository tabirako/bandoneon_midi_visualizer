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
      sideLabels: { left: 'leftSideBass', right: 'rightSideTreble' },
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
      fallbackButtonCount: 144
    }
  };

  // Display names for the <optgroup> headings, used only once more than one
  // family exists (with a single family the dropdown stays flat, exactly as
  // it looks today). i18nKey optional, same rule as above.
  window.instrumentFamilies = {
    bandoneon: { name: 'Bandoneon' }
  };
})();
