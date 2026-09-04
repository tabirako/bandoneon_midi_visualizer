// Computer-keyboard mapping for the lower 4 rows of the treble (right) side.
// Exposes window.keyboardMapping with:
// - PHYSICAL_KEYBOARD_ROWS, DEFAULT_ROW_ANCHORS (data)
// - selectKeysForRow(rowIndex, neededLength)
// - computeKeyAssignments(rightSideButtons)
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
  // The slice used when a row's button count matches the common case
  // (Rheinische's lower 4 rows: 6, 7, 8, 8). {start, length} are indices
  // into the corresponding PHYSICAL_KEYBOARD_ROWS entry above.
  var DEFAULT_ROW_ANCHORS = [
    { start: 3, length: 7 }, // '4'-'0'
    { start: 2, length: 7 }, // 'e'-'o'
    { start: 1, length: 8 }, // 's'-'l'
    { start: 1, length: 8 }  // 'x'-'.'
  ];

  // Picks `neededLength` keys from physical row `rowIndex`. Matches the
  // default anchor when possible; when more keys are needed, extends toward
  // the outer edge of the row (lower index first) so the "standard" keys
  // (e.g. X-.) stay in place and only gain a neighbor (Z) rather than
  // shifting.
  function selectKeysForRow(rowIndex, neededLength) {
    var physicalRow = PHYSICAL_KEYBOARD_ROWS[rowIndex];
    var anchor = DEFAULT_ROW_ANCHORS[rowIndex];
    var start = anchor.start;
    var length = Math.min(neededLength, anchor.length);
    if (neededLength > anchor.length) {
      var extra = neededLength - anchor.length;
      start = Math.max(0, anchor.start - extra);
      length = Math.min(neededLength, physicalRow.length - start);
    }
    return physicalRow.slice(start, start + length);
  }

  // Pure: takes the treble ("right" side) buttons and returns the
  // key -> button assignments for the lower 4 rows, without touching any
  // button, Map, or other state. Caller (assignKeyboardKeys() in app.js)
  // applies the result to keyboardKeyMap / button.keyCap.
  //
  // `rightSideButtons` items need `row` (1-indexed, top row = 1), `order`
  // (1-indexed position within the row, left-to-right), and whatever the
  // caller wants back on the assignment (typically the button object
  // itself).
  function computeKeyAssignments(rightSideButtons) {
    var maxRow = rightSideButtons.reduce(function (max, b) {
      return Math.max(max, b.row || 0);
    }, 0);
    var keyboardRowStart = Math.max(1, maxRow - PHYSICAL_KEYBOARD_ROWS.length + 1);
    var assignments = []; // { key, button }

    for (var i = 0; i < PHYSICAL_KEYBOARD_ROWS.length; i++) {
      var rowNumber = keyboardRowStart + i;
      var rowButtons = rightSideButtons
        .filter(function (b) { return b.row === rowNumber; })
        .sort(function (a, b) { return a.order - b.order; });
      var keys = selectKeysForRow(i, rowButtons.length);
      rowButtons.forEach(function (button, idx) {
        var key = keys[idx];
        if (!key) return;
        assignments.push({ key: key, button: button });
      });
    }
    return assignments;
  }

  window.keyboardMapping = {
    PHYSICAL_KEYBOARD_ROWS: PHYSICAL_KEYBOARD_ROWS,
    DEFAULT_ROW_ANCHORS: DEFAULT_ROW_ANCHORS,
    selectKeysForRow: selectKeysForRow,
    computeKeyAssignments: computeKeyAssignments
  };
})();
