// Tests for instruments.js — the per-system metadata that drives the layout
// dropdown, and (from later phases) panel titles, bellows behavior and
// keyboard anchors. Plain Node, no framework: run with
// `node instruments.test.js`.
//
// These are deliberately cheap consistency checks rather than logic tests:
// instruments.js is data, and the failure mode for bad data here is a blank
// dropdown or a silently unreachable instrument, which no other test would
// catch. A typo'd key is the specific thing being guarded against — the id
// must match mappings.js exactly, since the app looks the button array up
// by the same string.
const assert = require('assert');
const { test, summary } = require('./test-helpers.js');

global.window = global;
require('./mappings.js');
require('./mappings-concertina.js');
require('./keyboard-mapping.js');
require('./instruments.js');

const systems = window.instrumentSystems;
const families = window.instrumentFamilies;
const ids = Object.keys(systems);

console.log('instruments.js');

test('every system has the fields the app reads', () => {
  ids.forEach((id) => {
    const s = systems[id];
    assert.ok(s.family, id + ': missing family');
    assert.ok(s.i18nKey || s.name, id + ': needs an i18nKey or a name to display');
    assert.strictEqual(typeof s.bisonoric, 'boolean', id + ': bisonoric must be true/false');
    assert.ok(s.sideLabels && s.sideLabels.left && s.sideLabels.right, id + ': missing sideLabels');
  });
});

test('every system id has matching button data in mappings.js', () => {
  ids.forEach((id) => {
    assert.ok(
      Array.isArray(window.defaultMappings[id]) && window.defaultMappings[id].length > 0,
      id + ': no button array under this exact key in mappings.js'
    );
  });
});

test('every button array in mappings.js is reachable from the dropdown', () => {
  // The other direction: data present but not listed here is an instrument
  // nobody can select.
  Object.keys(window.defaultMappings).forEach((id) => {
    assert.ok(systems[id], id + ': in mappings.js but missing from instrumentSystems');
  });
});

test('every family used by a system has a display entry', () => {
  ids.forEach((id) => {
    assert.ok(families[systems[id].family], systems[id].family + ': no entry in instrumentFamilies');
  });
});

test('every keyboard anchor name resolves to a real set in keyboard-mapping.js', () => {
  // A typo here wouldn't throw — computeAssignmentsFor() returns [] for an
  // unknown set — so the instrument would just silently have no keys.
  ids.forEach((id) => {
    const kb = systems[id].keyboard || {};
    Object.keys(kb).forEach((side) => {
      assert.ok(
        window.keyboardMapping.ANCHOR_SETS[kb[side]],
        id + '.' + side + ': unknown anchor set "' + kb[side] + '"'
      );
    });
  });
});

test('every bonusKey names a button that actually exists in that system', () => {
  ids.forEach((id) => {
    (systems[id].bonusKeys || []).forEach((bonus) => {
      assert.ok(bonus.code, id + ': bonusKey needs a code');
      const side = bonus.side === 'left' ? 'left' : 'right';
      const found = window.defaultMappings[id].some((b) =>
        (b.side === 'left' ? 'left' : 'right') === side &&
        (b.open && b.open.note) === bonus.open &&
        (b.close && b.close.note) === bonus.close);
      assert.ok(found, id + ': no ' + side + ' button with close ' + bonus.close + '/open ' + bonus.open);
    });
  });
});

test('a unisonoric system\'s buttons must sound the same note both directions', () => {
  // The whole point of bisonoric: false is that bellows direction doesn't
  // change the note. If a future English/duet data file has differing
  // open/close notes, the app would hide the bellows control while the data
  // still behaved bisonorically — a note you could never reach. No system
  // is unisonoric yet, so today this passes vacuously and stands guard for
  // when one lands.
  ids.filter((id) => systems[id].bisonoric === false).forEach((id) => {
    window.defaultMappings[id].forEach((b) => {
      const open = b.open && b.open.note !== undefined ? b.open.note : b.open;
      const close = b.close && b.close.note !== undefined ? b.close.note : b.close;
      assert.strictEqual(open, close, id + ' button ' + b.id + ': unisonoric but open ' + open + ' != close ' + close);
    });
  });
});

test('every system: unique button ids, one button per side/row/order, notes in MIDI range', () => {
  ids.forEach((id) => {
    const seenIds = new Set();
    const seenSlots = new Set();
    window.defaultMappings[id].forEach((b) => {
      assert.ok(!seenIds.has(b.id), id + ': duplicate button id ' + b.id);
      seenIds.add(b.id);
      const slot = b.side + '/' + b.row + '/' + b.order;
      assert.ok(!seenSlots.has(slot), id + ': two buttons at ' + slot);
      seenSlots.add(slot);
      [b.open, b.close].forEach((def) => {
        const note = def && def.note !== undefined ? def.note : def;
        assert.ok(note >= 0 && note <= 127, id + ' button ' + b.id + ': note ' + note + ' out of MIDI range');
      });
    });
  });
});

['anglo-30-cg', 'anglo-30-cg-jeffries'].forEach((anglo) => test(anglo + ': all 30 buttons reach a key, and the rows spell ascending arpeggios', () => {
  // Guards the rowOffset path: without it a 3-row instrument is pushed up
  // onto the number row and the bottom row silently loses its keys.
  const sys = systems[anglo];
  const buttons = window.defaultMappings[anglo];
  let keyed = 0;
  ['left', 'right'].forEach((side) => {
    const mine = buttons.filter((b) => b.side === side);
    assert.strictEqual(mine.length, 15, side + ' hand should have 15 buttons');
    keyed += window.keyboardMapping.computeAssignmentsFor(mine, sys.keyboard[side]).length;
  });
  assert.strictEqual(keyed, 30, 'every Anglo button should get a keyboard key');

  // The transcription's strongest cross-check: each diatonic row's push
  // notes run straight up its own major arpeggio across both hands.
  [[2, [48, 55, 60, 64, 67, 72, 76, 79, 84, 88]],  // C row: C3 G3 C4 E4 G4 C5 E5 G5 C6 E6
   [3, [59, 62, 67, 71, 74, 79, 83, 86, 91, 95]]   // G row: B3 D4 G4 B4 D5 G5 B5 D6 G6 B6
  ].forEach(([row, expected]) => {
    const push = buttons
      .filter((b) => b.row === row)
      .sort((a, b) => (a.side === 'left' ? 0 : 100) + a.order - ((b.side === 'left' ? 0 : 100) + b.order))
      .map((b) => b.close.note);
    assert.deepStrictEqual(push, expected, 'row ' + row + ' push notes');
  });
}));

test('anglo-30-cg-jeffries differs from Wheatstone only in the right-hand accidental row', () => {
  // Three charts agree on this; see mappings-concertina.js.
  const wheat = window.defaultMappings['anglo-30-cg'];
  const jeff = window.defaultMappings['anglo-30-cg-jeffries'];
  assert.strictEqual(jeff.length, wheat.length);
  const accidentals = [];
  jeff.forEach((b, i) => {
    const w = wheat[i];
    assert.deepStrictEqual([b.id, b.side, b.row, b.order, b.x, b.y], [w.id, w.side, w.row, w.order, w.x, w.y]);
    if (b.side === 'right' && b.row === 1) accidentals.push([b.close.note, b.open.note]);
    else assert.deepStrictEqual([b.close.note, b.open.note], [w.close.note, w.open.note], 'button ' + b.id + ' should match Wheatstone');
  });
  //                 D#/C#     C#/D#     G#/G      C#/Bb     A/D
  assert.deepStrictEqual(accidentals, [[75, 73], [73, 75], [80, 79], [85, 82], [81, 86]]);
  // Deriving must not alias the Wheatstone objects.
  assert.strictEqual(wheat[15].close.note, 73, 'Wheatstone data was mutated');
});

test('anglo-german-20-cg is anglo-30-cg without its accidental row, on the same keys', () => {
  const a30 = window.defaultMappings['anglo-30-cg'];
  const g20 = window.defaultMappings['anglo-german-20-cg'];
  const sys30 = systems['anglo-30-cg'];
  const sys20 = systems['anglo-german-20-cg'];
  const lower = a30.filter((b) => b.row !== 1);
  assert.strictEqual(g20.length, 20);
  const codeOf = (buttons, sys, b) => window.keyboardMapping
    .computeAssignmentsFor(buttons.filter((x) => x.side === b.side), sys.keyboard[b.side])
    .find((x) => x.button === b).code;
  g20.forEach((b, i) => {
    const w = lower[i];
    assert.deepStrictEqual([b.side, b.row, b.order, b.x, b.close.note, b.open.note],
      [w.side, w.row - 1, w.order, w.x, w.close.note, w.open.note], 'button ' + b.id);
    assert.strictEqual(codeOf(g20, sys20, b), codeOf(a30, sys30, w), 'button ' + b.id + ' should keep its 30-button key');
  });
  // The disputed button (see mappings-concertina.js): B3 push / A3 pull.
  const low = g20.find((b) => b.side === 'left' && b.row === 2 && b.order === 1);
  assert.deepStrictEqual([low.close.note, low.open.note], [59, 57]);
  assert.strictEqual(a30[0].close.note, 52, 'deriving must not mutate anglo-30-cg');
});

test('english-48: G3-C7 chromatic, naturals alternate hands, six accidentals on both hands', () => {
  // The transcription's cross-checks (see mappings-concertina.js).
  const buttons = window.defaultMappings['english-48'];
  assert.strictEqual(buttons.filter((b) => b.side === 'left').length, 24);
  assert.strictEqual(buttons.filter((b) => b.side === 'right').length, 24);
  const notes = buttons.map((b) => b.close.note);
  const pitches = [...new Set(notes)].sort((a, b) => a - b);
  assert.deepStrictEqual(pitches, Array.from({ length: 42 }, (_, i) => 55 + i), 'every semitone G3-C7 exactly once or twice');
  const doubled = pitches.filter((n) => notes.filter((m) => m === n).length === 2);
  assert.deepStrictEqual(doubled, [56, 63, 68, 75, 80, 87], 'G#/Ab and D#/Eb in each octave');
  doubled.forEach((n) => {
    const sides = buttons.filter((b) => b.close.note === n).map((b) => b.side).sort();
    assert.deepStrictEqual(sides, ['left', 'right'], 'duplicate ' + n + ' should be one per hand');
  });
  // White notes step hand to hand: G3 R, A3 L, B3 R, C4 L, D4 R ...
  const naturals = pitches.filter((n) => [0, 2, 4, 5, 7, 9, 11].includes(n % 12));
  naturals.forEach((n, i) => {
    const side = buttons.find((b) => b.close.note === n).side;
    assert.strictEqual(side, i % 2 === 0 ? 'right' : 'left', 'natural ' + n + ' on the wrong hand');
  });
});

// Both English keyboard layouts (the provisional choice may flip back, see
// keyboard-mapping.js): the one in use, and the one kept for switching.
[['englishColumns', 32, 81, 'G3-A5'],  // option 3, in use
 ['englishRows', 40, 88, 'G3-E6']      // option 1, kept
].forEach(([set, keyCount, top, range]) => test('english-48 ' + set + ': both hands share the keyboard without collisions, covering ' + range, () => {
  const buttons = window.defaultMappings['english-48'];
  const codes = new Map();
  ['Left', 'Right'].forEach((hand) => {
    window.keyboardMapping.computeAssignmentsFor(buttons.filter((b) => b.side === hand.toLowerCase()), set + hand)
      .forEach(({ code, button }) => {
        assert.ok(!codes.has(code), code + ' assigned twice (hands collide)');
        codes.set(code, button);
      });
  });
  assert.strictEqual(codes.size, keyCount);
  const keyed = new Set([...codes.values()].map((b) => b.close.note));
  for (let n = 55; n <= top; n++) assert.ok(keyed.has(n), 'no key for MIDI ' + n);
}));

test('english-48 uses the column layout, lowest note of each row on the bottom key', () => {
  const sys = systems['english-48'];
  assert.deepStrictEqual(sys.keyboard, { left: 'englishColumnsLeft', right: 'englishColumnsRight' });
  const buttons = window.defaultMappings['english-48'];
  const keyOf = (note) => {
    const b = buttons.find((x) => x.close.note === note && x.side === (note === 60 || note === 57 ? 'left' : 'right'));
    const a = window.keyboardMapping.computeAssignmentsFor(buttons.filter((x) => x.side === b.side), sys.keyboard[b.side])
      .find((x) => x.button === b);
    return a && a.code;
  };
  // C4 is the left hand's middle-finger row bottom; A3 its ring-finger row bottom.
  assert.strictEqual(keyOf(60), 'KeyC');
  assert.strictEqual(keyOf(57), 'KeyX');
  // G3 is the right hand's middle-finger row bottom; D4 one up.
  assert.strictEqual(keyOf(55), 'Comma');
  assert.strictEqual(keyOf(62), 'KeyK');
});

test('the two original bandoneon ids are unchanged (saved mappings depend on them)', () => {
  // localStorage key is 'bandoneon-mapping-v1-' + id, so renaming either of
  // these would orphan a user's saved custom mapping.
  assert.ok(systems['142-rheinische'], '142-rheinische must keep its id');
  assert.ok(systems['144-einheits'], '144-einheits must keep its id');
});

test('142-rheinische stays first, so it remains the default selection', () => {
  // The dropdown selects its first option by default; that used to be the
  // first hardcoded <option> in index.html.
  assert.strictEqual(ids[0], '142-rheinische');
});

summary('instruments.test.js');
