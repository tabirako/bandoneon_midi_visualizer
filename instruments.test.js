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
