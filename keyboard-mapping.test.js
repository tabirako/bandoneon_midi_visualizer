// Tests for keyboard-mapping.js's pure row-selection logic. Plain Node, no
// framework: run with `node keyboard-mapping.test.js`.
//
// This is the code that already produced one real bug (142-rheinische's
// bottom-ish row starting from '3' instead of '4') — see handoff.md's
// decision log. These tests exist specifically to pin that class of bug
// down so it can't silently regress when a new layout is added.
const assert = require('assert');
const { test, summary } = require('./test-helpers.js');

global.window = global;
require('./keyboard-mapping.js');
const { selectKeysForRow, computeKeyAssignments, PHYSICAL_KEYBOARD_ROWS } = window.keyboardMapping;

console.log('keyboard-mapping.js');

// ---- selectKeysForRow() --------------------------------------------------

test('selectKeysForRow: exact anchor length returns the anchor slice as-is', () => {
  // Row 0 anchor is {start: 3, length: 7} -> '4' through '0'.
  assert.deepStrictEqual(selectKeysForRow(0, 7), ['4', '5', '6', '7', '8', '9', '0']);
});

test('selectKeysForRow: fewer than the anchor takes the first N keys from the anchor start', () => {
  assert.deepStrictEqual(selectKeysForRow(0, 3), ['4', '5', '6']);
});

test('selectKeysForRow: more than the anchor extends toward the lower index (leftward)', () => {
  // Row 0 anchor length 7; asking for 9 should extend left by 2, keeping
  // the anchor's own keys ('4'-'0') unshifted and prepending '2','3'.
  assert.deepStrictEqual(selectKeysForRow(0, 9), ['2', '3', '4', '5', '6', '7', '8', '9', '0']);
});

test('selectKeysForRow: bottom row extending by 1 adds "z", matching Einheits\' 9-button row', () => {
  // Row 3 anchor is {start: 1, length: 8} -> 'x' through '.'. This is the
  // exact case documented in the file header comment.
  assert.deepStrictEqual(
    selectKeysForRow(3, 9),
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.']
  );
});

test('selectKeysForRow: asking for more keys than the physical row has clamps to the full row, no crash', () => {
  const keys = selectKeysForRow(0, 15);
  assert.strictEqual(keys.length, 10);
  assert.deepStrictEqual(keys, PHYSICAL_KEYBOARD_ROWS[0]);
});

// ---- computeKeyAssignments() ---------------------------------------------

function makeButton(id, row, order) {
  return { id, row, order };
}

test('computeKeyAssignments: only the lower 4 rows (relative to the highest row) get keys', () => {
  // 6 total rows (like Rheinische treble), 1 button per row/order slot.
  const buttons = [
    makeButton('r1', 1, 1),
    makeButton('r2', 2, 1),
    makeButton('r3', 3, 1),
    makeButton('r4', 4, 1),
    makeButton('r5', 5, 1),
    makeButton('r6', 6, 1)
  ];
  const assignments = computeKeyAssignments(buttons);
  const assignedIds = assignments.map((a) => a.button.id).sort();
  // Rows 1-2 are above the lower 4 (rows 3-6) and should get no key.
  assert.deepStrictEqual(assignedIds, ['r3', 'r4', 'r5', 'r6']);
});

test('computeKeyAssignments: within a row, keys are assigned in `order`, not array order', () => {
  const buttons = [
    makeButton('second', 4, 2),
    makeButton('first', 4, 1),
    makeButton('third', 4, 3)
  ];
  // Single-row system: row 4 is the only (and therefore bottom) row, so it
  // lands on physical row index 3 (the last of the lower 4).
  const assignments = computeKeyAssignments(buttons);
  const byId = Object.fromEntries(assignments.map((a) => [a.button.id, a.key]));
  const rowKeys = PHYSICAL_KEYBOARD_ROWS[3];
  const anchorStart = window.keyboardMapping.DEFAULT_ROW_ANCHORS[3].start;
  assert.strictEqual(byId.first, rowKeys[anchorStart]);
  assert.strictEqual(byId.second, rowKeys[anchorStart + 1]);
  assert.strictEqual(byId.third, rowKeys[anchorStart + 2]);
});

test('computeKeyAssignments: a row needing more buttons than physically fit leaves the overflow unassigned, not crashed', () => {
  // Row 0's physical row only has 10 keys total; ask for 12 buttons in it.
  const buttons = [];
  for (let i = 1; i <= 12; i++) buttons.push(makeButton('b' + i, 1, i));
  const assignments = computeKeyAssignments(buttons);
  // At most 10 of the 12 can get a physical key.
  assert.ok(assignments.length <= 10);
  assert.ok(assignments.length >= 1);
});

test('computeKeyAssignments: reproduces the real Rheinische/Einheits row layouts (regression guard)', () => {
  // Mirrors mappings.js's actual row/order shape for both systems' lower 4
  // treble rows, without depending on mappings.js itself. If this ever
  // fails after touching keyboard-mapping.js, the on-screen key caps for a
  // real layout just changed — check it's intentional.
  function buttonsForRow(row, count) {
    const out = [];
    for (let i = 1; i <= count; i++) out.push(makeButton('r' + row + '-' + i, row, i));
    return out;
  }

  // Rheinische: 6 total rows, lower 4 are [6, 7, 8, 8] buttons.
  const rheinische = [].concat(
    buttonsForRow(3, 6),
    buttonsForRow(4, 7),
    buttonsForRow(5, 8),
    buttonsForRow(6, 8)
  );
  const rheinischeKeys = computeKeyAssignments(rheinische).map((a) => a.key);
  assert.ok(rheinischeKeys.includes('4')); // bottom-of-number-row start, not '3'
  assert.ok(!rheinischeKeys.includes('3'));

  // Einheits: 5 total rows, lower 4 are [7, 7, 8, 9] buttons.
  const einheits = [].concat(
    buttonsForRow(2, 7),
    buttonsForRow(3, 7),
    buttonsForRow(4, 8),
    buttonsForRow(5, 9)
  );
  const einheitsKeys = computeKeyAssignments(einheits).map((a) => a.key);
  assert.ok(einheitsKeys.includes('z')); // the 9-button bottom row extends to include Z
});

summary('keyboard-mapping.test.js');
