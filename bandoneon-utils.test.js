// Tests for bandoneon-utils.js's pure, DOM-free functions. Plain Node, no
// framework: run with `node bandoneon-utils.test.js`.
//
// bandoneon-utils.js attaches itself to window.bandoneonUtils (it's a
// browser <script>, not a CommonJS module) — aliasing `global.window` to
// `global` itself lets it be require()'d unmodified here and still land its
// export somewhere this file can read it back from.
const assert = require('assert');
const { test, summary } = require('./test-helpers.js');

global.window = global;
require('./bandoneon-utils.js');
const { normalizeMapping, findMatchingButtons } = window.bandoneonUtils;

console.log('bandoneon-utils.js');

// ---- normalizeMapping(): placeholder-generator fallback ----------------
// (genDefaultMapping is intentionally a placeholder, not real instrument
// data — see handoff.md's "Data provenance" section. These tests pin down
// its *shape*, not its musical correctness.)

test('normalizeMapping: empty raw + known layout falls back to a full-size placeholder', () => {
  const result = normalizeMapping([], '144-einheits');
  assert.strictEqual(result.length, 144);
  const result142 = normalizeMapping(null, '142-rheinische');
  assert.strictEqual(result142.length, 142);
});

test('normalizeMapping: empty raw + unrecognized layout returns an empty mapping, not a crash', () => {
  const result = normalizeMapping([], 'some-future-layout');
  assert.deepStrictEqual(result, []);
});

// ---- normalizeMapping(): normalizing real button entries ---------------

test('normalizeMapping: numeric open/close shorthand becomes {note} objects', () => {
  const [button] = normalizeMapping([{ id: 5, side: 'left', open: 60, close: 62 }], '142-rheinische');
  assert.strictEqual(button.open.note, 60);
  assert.strictEqual(button.close.note, 62);
});

test('normalizeMapping: object-form open/close keeps its own note/x/y/color', () => {
  const [button] = normalizeMapping(
    [{ id: 1, side: 'right', open: { note: 60, x: 0.1, y: 0.2, color: 'red' }, close: { note: 62 } }],
    '142-rheinische'
  );
  assert.strictEqual(button.open.note, 60);
  assert.strictEqual(button.open.x, 0.1);
  assert.strictEqual(button.open.y, 0.2);
  assert.strictEqual(button.open.color, 'red');
});

test('normalizeMapping: missing id defaults to array index + 1', () => {
  const [first, second] = normalizeMapping(
    [{ side: 'left', open: 60, close: 60 }, { side: 'left', open: 61, close: 61 }],
    '142-rheinische'
  );
  assert.strictEqual(first.id, 1);
  assert.strictEqual(second.id, 2);
});

test('normalizeMapping: missing label defaults to String(id)', () => {
  const [button] = normalizeMapping([{ id: 7, side: 'left', open: 60, close: 60 }], '142-rheinische');
  assert.strictEqual(button.label, '7');
});

test('normalizeMapping: side is "left" only for the literal string "left", else "right"', () => {
  const [left, right, typo] = normalizeMapping(
    [
      { id: 1, side: 'left', open: 1, close: 1 },
      { id: 2, side: 'right', open: 1, close: 1 },
      { id: 3, side: 'LEFT', open: 1, close: 1 } // not the exact literal 'left'
    ],
    '142-rheinische'
  );
  assert.strictEqual(left.side, 'left');
  assert.strictEqual(right.side, 'right');
  assert.strictEqual(typo.side, 'right'); // documents current strict-equality behavior
});

test('normalizeMapping: x/y prefer top-level, then close, then open', () => {
  const [fromTop] = normalizeMapping([{ id: 1, side: 'left', x: 0.5, y: 0.6, open: 1, close: 1 }], '142-rheinische');
  assert.strictEqual(fromTop.x, 0.5);
  assert.strictEqual(fromTop.y, 0.6);

  const [fromClose] = normalizeMapping(
    [{ id: 1, side: 'left', open: 1, close: { note: 1, x: 0.3, y: 0.4 } }],
    '142-rheinische'
  );
  assert.strictEqual(fromClose.x, 0.3);
  assert.strictEqual(fromClose.y, 0.4);

  const [fromOpen] = normalizeMapping(
    [{ id: 1, side: 'left', open: { note: 1, x: 0.7, y: 0.8 }, close: 1 }],
    '142-rheinische'
  );
  assert.strictEqual(fromOpen.x, 0.7);
  assert.strictEqual(fromOpen.y, 0.8);
});

test('normalizeMapping: row/order pass through only when numeric, else undefined', () => {
  const [withRow, withoutRow] = normalizeMapping(
    [
      { id: 1, side: 'left', row: 3, order: 2, open: 1, close: 1 },
      { id: 2, side: 'left', open: 1, close: 1 }
    ],
    '142-rheinische'
  );
  assert.strictEqual(withRow.row, 3);
  assert.strictEqual(withRow.order, 2);
  assert.strictEqual(withoutRow.row, undefined);
  assert.strictEqual(withoutRow.order, undefined);
});

// ---- findMatchingButtons() ----------------------------------------------

const sampleMapping = [
  { id: 1, side: 'left', open: { note: 60 }, close: { note: 62 } },
  { id: 2, side: 'right', open: { note: 64 }, close: { note: 60 } }, // shares note 60 on close
];

test('findMatchingButtons: isOpen=true matches only on the open note', () => {
  const matches = findMatchingButtons(sampleMapping, 60, true);
  assert.deepStrictEqual(matches.map((b) => b.id), [1]);
});

test('findMatchingButtons: isOpen=false matches only on the close note', () => {
  const matches = findMatchingButtons(sampleMapping, 60, false);
  assert.deepStrictEqual(matches.map((b) => b.id), [2]);
});

test('findMatchingButtons: isOpen omitted matches either open or close', () => {
  const matches = findMatchingButtons(sampleMapping, 60);
  assert.deepStrictEqual(matches.map((b) => b.id).sort(), [1, 2]);
});

test('findMatchingButtons: no match returns an empty array', () => {
  assert.deepStrictEqual(findMatchingButtons(sampleMapping, 999), []);
});

test('findMatchingButtons: non-array mapping returns an empty array instead of throwing', () => {
  assert.deepStrictEqual(findMatchingButtons(null, 60), []);
});

summary('bandoneon-utils.test.js');
