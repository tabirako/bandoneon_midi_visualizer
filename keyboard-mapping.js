// Computer-keyboard mapping for the lower 4 rows of each side: treble
// (right) normally, bass (left) while Caps Lock is on — see app.js.
// Exposes window.keyboardMapping with:
// - PHYSICAL_KEYBOARD_ROWS, PHYSICAL_KEYBOARD_CODES, DEFAULT_ROW_ANCHORS,
//   BASS_ROW_ANCHORS, BASS_FUNCTION_KEYS (data)
// - selectKeysForRow(rowIndex, neededLength)   (treble anchors)
// - selectCodesForRow(rowIndex, neededLength)  (treble anchors)
// - computeKeyAssignments(rightSideButtons) -> [{ key, code, button }]
// - computeBassKeyAssignments(leftSideButtons) -> [{ key, code, button }]
// - computeBassFunctionKeyAssignments(leftSideButtons) -> same shape
//
// Pulled out of app.js (which still does the actual DOM/state wiring via
// assignKeyboardKeys()) so this logic is pure and unit-testable — see
// keyboard-mapping.test.js — the same reasoning bandoneon-utils.js already
// followed. This is also exactly the code a new fingering system's
// different row lengths touch, so keeping it separate and tested is meant
// to make that expansion safer, not just tidier.
//
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
(function () {
  var PHYSICAL_KEYBOARD_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];
  // KeyboardEvent.code equivalents of the row above, same indices. `code`
  // identifies a key by its physical position on a US-ANSI-reference
  // layout and is unaffected by Shift/Caps Lock or the OS's active
  // keyboard-layout/language setting — unlike `event.key`, which reports
  // the actual character produced (so e.g. Shift+';' is ':', a different
  // string, and an AZERTY user's key in this same physical spot reports a
  // completely different character). app.js's keydown/keyup handlers match
  // on `code` for this reason; the `key` characters above are kept only for
  // the on-screen key-cap labels (which intentionally still show the
  // QWERTY character — see the event.code discussion in the chat/handoff
  // for why that's a separate, harder problem than matching itself).
  var PHYSICAL_KEYBOARD_CODES = [
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash']
  ];
  // The slice used when a row's button count matches the common case
  // (Rheinische's lower 4 rows: 6, 7, 8, 8). {start, length} are indices
  // into the corresponding PHYSICAL_KEYBOARD_ROWS entry above.
  var DEFAULT_ROW_ANCHORS = [
    { start: 3, length: 7 }, // '4'-'0'
    { start: 2, length: 7 }, // 'e'-'o'
    { start: 1, length: 8 }, // 's'-'l'
    { start: 1, length: 8 }  // 'x'-'.'
  ];

  // Bass (left side) counterpart of DEFAULT_ROW_ANCHORS, used while Caps
  // Lock is on (see app.js). Bass rows 2-5 go on the same 4 physical rows;
  // bass row 1 (5 buttons) has no 5th letter row to go to, so only two of
  // its buttons get keys, via BASS_FUNCTION_KEYS below.
  //
  // Chosen by least-squares fit of physical ANSI key centers against the
  // buttons' real x coordinates (mappings.js), over every candidate slice:
  // this set, with the bottom row on X-., averages ~0.26 key-widths from
  // where each button actually sits — about half the error of the next
  // best (bottom row on Z-, 0.48, or C-/ 0.50).
  //
  // Unlike treble, bass rows GROW RIGHTWARD past the anchor: the two rows
  // whose length differs between systems (row 3: 6 in 142 vs 7 in 144;
  // row 4: 7 vs 8) differ by one button appended at the RIGHT end, every
  // other button shared at the same x (see handoff.md's data provenance
  // notes). Growing right keeps every shared button on the same key in
  // both layouts; 144's extra one just takes the next key over.
  var BASS_ROW_ANCHORS = [
    { start: 3, length: 7 }, // '4'-'0'  (bass row 2)
    { start: 3, length: 6 }, // 'r'-'o'  (bass row 3; 144's 7th -> 'p')
    { start: 2, length: 7 }, // 'd'-'l'  (bass row 4; 144's 8th -> ';')
    { start: 1, length: 8 }  // 'x'-'.'  (bass row 5)
  ];

  // Bass row 1's keyed buttons, by row/order (identical on both systems).
  // Like the letter keys, these play only in bass mode (Caps Lock on).
  //
  // OPEN QUESTION (user, 2026-09): whether real players reach for 4/4 or
  // 0/0 more often is unconfirmed. The 𝄌 button (order 4) is the fixed
  // one; its F-key partner is either 0/0 (order 5, current) or 4/4
  // (order 3). Current choice follows the geometry fit (~0.26 vs ~0.52
  // key-widths average error). To switch to 4/4, change these to
  // F8 -> order 3 and F9 -> order 4.
  var BASS_FUNCTION_KEYS = [
    { key: 'F8', code: 'F8', row: 1, order: 4 }, // 142: 𝄌, 144: 4
    { key: 'F9', code: 'F9', row: 1, order: 5 }  // 142: 0/0, 144: 5
  ];

  // Picks `neededLength` keys from physical row `rowIndex`. Matches the
  // anchor when possible; when more keys are needed, extends from the
  // anchor so its own keys stay in place and only gain a neighbor rather
  // than shifting — toward the lower index (treble: X-. gains Z) unless
  // `growRight` (bass: R-O gains P).
  // Shared by the key/code selectors so the `key` and `code` rows above
  // (which are index-parallel) always pick the same slice.
  // `fixed` never extends past the anchor: a longer row's extra (highest-
  // order) buttons just get no key. Needed when two hands share one
  // keyboard row, where growing would steal the other hand's keys.
  function selectIndicesForRow(rowIndex, neededLength, anchors, growRight, fixed) {
    var physicalRow = PHYSICAL_KEYBOARD_ROWS[rowIndex];
    var anchor = anchors[rowIndex];
    var start = anchor.start;
    var length = Math.min(neededLength, anchor.length);
    if (neededLength > anchor.length && !fixed) {
      if (!growRight) {
        var extra = neededLength - anchor.length;
        start = Math.max(0, anchor.start - extra);
      }
      length = Math.min(neededLength, physicalRow.length - start);
    }
    return { start: start, length: length };
  }

  function selectKeysForRow(rowIndex, neededLength) {
    var idx = selectIndicesForRow(rowIndex, neededLength, DEFAULT_ROW_ANCHORS, false);
    return PHYSICAL_KEYBOARD_ROWS[rowIndex].slice(idx.start, idx.start + idx.length);
  }

  function selectCodesForRow(rowIndex, neededLength) {
    var idx = selectIndicesForRow(rowIndex, neededLength, DEFAULT_ROW_ANCHORS, false);
    return PHYSICAL_KEYBOARD_CODES[rowIndex].slice(idx.start, idx.start + idx.length);
  }

  // Shared core of computeKeyAssignments()/computeBassKeyAssignments().
  // Maps the lower 4 rows of `sideButtons` (relative to its highest row
  // number) onto the 4 physical rows.
  // `rowOffset` skips that many physical rows from the top before placing
  // anything. Without it an instrument with fewer than 4 rows gets pushed
  // up onto the number row (the clamp below bottoms out at 1), which is the
  // least comfortable row on the keyboard. A 3-row Anglo passes offset 1 to
  // sit on QWERTY/ASDF/ZXCV instead. `anchors` is indexed by PHYSICAL row,
  // so a set using an offset leaves the skipped entries null.
  function assignLowerRows(sideButtons, anchors, growRight, rowOffset, fixed) {
    var offset = rowOffset || 0;
    var usableRows = PHYSICAL_KEYBOARD_ROWS.length - offset;
    var maxRow = sideButtons.reduce(function (max, b) {
      return Math.max(max, b.row || 0);
    }, 0);
    var keyboardRowStart = Math.max(1, maxRow - usableRows + 1);
    var assignments = []; // { key, code, button }

    for (var i = 0; i < usableRows; i++) {
      var physicalRow = i + offset;
      var rowNumber = keyboardRowStart + i;
      var rowButtons = sideButtons
        .filter(function (b) { return b.row === rowNumber; })
        .sort(function (a, b) { return a.order - b.order; });
      var idx = selectIndicesForRow(physicalRow, rowButtons.length, anchors, growRight, fixed);
      var keys = PHYSICAL_KEYBOARD_ROWS[physicalRow].slice(idx.start, idx.start + idx.length);
      var codes = PHYSICAL_KEYBOARD_CODES[physicalRow].slice(idx.start, idx.start + idx.length);
      rowButtons.forEach(function (button, j) {
        var key = keys[j];
        if (!key) return;
        assignments.push({ key: key, code: codes[j], button: button });
      });
    }
    return assignments;
  }

  // Pure: takes the treble ("right" side) buttons and returns the
  // key/code -> button assignments for the lower 4 rows, without touching
  // any button, Map, or other state. Caller (assignKeyboardKeys() in
  // app.js) applies the result to its code maps / button.keyCap.
  //
  // `rightSideButtons` items need `row` (1-indexed, top row = 1), `order`
  // (1-indexed position within the row, left-to-right), and whatever the
  // caller wants back on the assignment (typically the button object
  // itself).
  function computeKeyAssignments(rightSideButtons) {
    return assignLowerRows(rightSideButtons, DEFAULT_ROW_ANCHORS, false);
  }

  // Same as computeKeyAssignments(), for the bass ("left" side) buttons'
  // lower 4 rows, using BASS_ROW_ANCHORS.
  function computeBassKeyAssignments(leftSideButtons) {
    return assignLowerRows(leftSideButtons, BASS_ROW_ANCHORS, true);
  }

  // Matches row/order-addressed extra bindings (e.g. BASS_FUNCTION_KEYS)
  // against a side's buttons, same { key, code, button } shape. A binding
  // whose button doesn't exist in this layout is just skipped.
  function matchFunctionKeys(sideButtons, functionKeys) {
    var assignments = [];
    functionKeys.forEach(function (fk) {
      var button = sideButtons.find(function (b) {
        return b.row === fk.row && b.order === fk.order;
      });
      if (button) assignments.push({ key: fk.key, code: fk.code, button: button });
    });
    return assignments;
  }

  function computeBassFunctionKeyAssignments(leftSideButtons) {
    return matchFunctionKeys(leftSideButtons, BASS_FUNCTION_KEYS);
  }

  // ---- Anchor sets -------------------------------------------------------
  // A named bundle of "how does one side's rows map onto the keyboard":
  // the per-row anchor slices, which way a longer-than-anchor row grows,
  // and any row/order-addressed extra keys. A system names the set it wants
  // per side in instruments.js (`keyboard: { left, right }`), instead of
  // app.js hardcoding the bandoneon's two. A new instrument with a
  // different row shape adds an entry here and points at it — no changes to
  // the assignment code itself.
  //
  // `growRight` is the difference documented on BASS_ROW_ANCHORS: treble
  // grows leftward from its anchor (X-. gains Z), bass grows rightward
  // (R-O gains P) so buttons shared between 142 and 144 keep the same key.
  // A 30-button Anglo is 15 buttons a hand — 3 rows of 5 — so BOTH hands fit
  // on one keyboard at once, left hand on the left half of each row and
  // right hand on the right half, mirroring how you actually hold the
  // instrument. That's why anglo systems set `handSwitch: 'none'` instead of
  // sharing keys via Caps Lock the way the much larger bandoneon must.
  //   Q W E R T | Y U I O P   accidental row
  //   A S D F G | H J K L ;   C row
  //   Z X C V B | N M , . /   G row
  var ANGLO_LEFT_ANCHORS = [
    null, // number row unused — see rowOffset
    { start: 0, length: 5 }, // q-t
    { start: 0, length: 5 }, // a-g
    { start: 0, length: 5 }  // z-b
  ];
  var ANGLO_RIGHT_ANCHORS = [
    null,
    { start: 5, length: 5 }, // y-p
    { start: 5, length: 5 }, // h-;
    { start: 5, length: 5 }  // n-/
  ];

  // English 48 (24 buttons a hand in 4 rows of 5-7): too many for 40 keys,
  // and its scales alternate hands on every note, so a Caps Lock hand
  // switch would make even a scale unplayable. Both hands share the
  // keyboard (handSwitch: 'none'). Two layouts exist; instruments.js picks
  // one by name.
  // PROVISIONAL (user, 2026-09): the choice might change again after
  // discussing it with a real English concertina player. See handoff.md's
  // Open items for the reasoning behind each option.
  //
  // IN USE -- englishColumns (option 3): one finger per instrument row, as
  // on the real instrument (Lachenal's diagram: each finger lies along one
  // row, the hand over its lower part). A typing finger's natural line is a
  // keyboard COLUMN, so each row runs up one column, lowest note on the
  // bottom (Z) row. Only each row's lowest 4 buttons get a key: 32 keys,
  // G3-A5 chromatic.
  //   left  pinky..index = rows 1-4:  1QAZ 2WSX 3EDC 4RFV
  //   right index..pinky = rows 1-4:  7UJM 8IK, 9OL. 0P;/
  var ENGLISH_LEFT_COLUMNS = [0, 1, 2, 3];
  var ENGLISH_RIGHT_COLUMNS = [6, 7, 8, 9];
  //
  // KEPT FOR SWITCHING BACK -- englishRows (option 1): each instrument row
  // on a keyboard row, 5 keys a hand, pitch rising left to right, with
  // `fixed` so a 6-7 button row stops at its own 5 keys instead of spilling
  // into the other hand's half. Widest range (40 keys, G3-E6), but it is
  // the on-screen drawing turned 90 degrees.
  //   1 2 3 4 5 | 6 7 8 9 0   accidental row
  //   Q W E R T | Y U I O P   natural row
  //   A S D F G | H J K L ;   natural row
  //   Z X C V B | N M , . /   accidental row
  var HALF_LEFT_ANCHORS = [
    { start: 0, length: 5 },
    { start: 0, length: 5 },
    { start: 0, length: 5 },
    { start: 0, length: 5 }
  ];
  var HALF_RIGHT_ANCHORS = [
    { start: 5, length: 5 },
    { start: 5, length: 5 },
    { start: 5, length: 5 },
    { start: 5, length: 5 }
  ];

  // Column mode: data row i goes up physical column columns[i-1], order 1
  // on the bottom keyboard row. Buttons past the keyboard's 4 rows get no
  // key (the highest-order ones, since order runs low -> high).
  function assignColumns(sideButtons, columns) {
    var bottom = PHYSICAL_KEYBOARD_ROWS.length - 1;
    var assignments = [];
    sideButtons.forEach(function (button) {
      var col = columns[button.row - 1];
      var physicalRow = bottom - (button.order - 1);
      if (col === undefined || physicalRow < 0) return;
      assignments.push({
        key: PHYSICAL_KEYBOARD_ROWS[physicalRow][col],
        code: PHYSICAL_KEYBOARD_CODES[physicalRow][col],
        button: button
      });
    });
    return assignments;
  }

  var ANCHOR_SETS = {
    bandoneonTreble: { anchors: DEFAULT_ROW_ANCHORS, growRight: false },
    bandoneonBass: { anchors: BASS_ROW_ANCHORS, growRight: true, functionKeys: BASS_FUNCTION_KEYS },
    angloLeft: { anchors: ANGLO_LEFT_ANCHORS, growRight: true, rowOffset: 1 },
    angloRight: { anchors: ANGLO_RIGHT_ANCHORS, growRight: true, rowOffset: 1 },
    englishColumnsLeft: { columns: ENGLISH_LEFT_COLUMNS },
    englishColumnsRight: { columns: ENGLISH_RIGHT_COLUMNS },
    englishRowsLeft: { anchors: HALF_LEFT_ANCHORS, fixed: true },
    englishRowsRight: { anchors: HALF_RIGHT_ANCHORS, fixed: true }
  };

  // Both return [] for an unknown/absent set name rather than throwing, so
  // a system that names no anchor set for a side (or names a typo'd one)
  // simply gets no keyboard keys on that side.
  function computeAssignmentsFor(sideButtons, setName) {
    var set = ANCHOR_SETS[setName];
    if (!set) return [];
    if (set.columns) return assignColumns(sideButtons, set.columns);
    return assignLowerRows(sideButtons, set.anchors, !!set.growRight, set.rowOffset, !!set.fixed);
  }

  function computeFunctionKeyAssignmentsFor(sideButtons, setName) {
    var set = ANCHOR_SETS[setName];
    if (!set || !set.functionKeys) return [];
    return matchFunctionKeys(sideButtons, set.functionKeys);
  }

  window.keyboardMapping = {
    PHYSICAL_KEYBOARD_ROWS: PHYSICAL_KEYBOARD_ROWS,
    PHYSICAL_KEYBOARD_CODES: PHYSICAL_KEYBOARD_CODES,
    DEFAULT_ROW_ANCHORS: DEFAULT_ROW_ANCHORS,
    BASS_ROW_ANCHORS: BASS_ROW_ANCHORS,
    BASS_FUNCTION_KEYS: BASS_FUNCTION_KEYS,
    ANCHOR_SETS: ANCHOR_SETS,
    selectKeysForRow: selectKeysForRow,
    selectCodesForRow: selectCodesForRow,
    // Named-set API — what app.js uses now.
    computeAssignmentsFor: computeAssignmentsFor,
    computeFunctionKeyAssignmentsFor: computeFunctionKeyAssignmentsFor,
    // Bandoneon-specific wrappers, kept as the readable shorthand the
    // tests use and as the documented meaning of each anchor set.
    computeKeyAssignments: computeKeyAssignments,
    computeBassKeyAssignments: computeBassKeyAssignments,
    computeBassFunctionKeyAssignments: computeBassFunctionKeyAssignments
  };
})();
