// Tiny zero-dependency test runner shared by the *.test.js files in this
// project. No framework, no npm install — this project has no build step
// or dependencies by design (see handoff.md), so tests stay plain Node
// scripts runnable with e.g. `node bandoneon-utils.test.js`.
//
// Each *.test.js file calls test(name, fn) for each case (fn should throw,
// typically via Node's built-in `assert` module, to fail) and calls
// summary() once at the end to print totals and set the process exit code.
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    console.log('  ✗ ' + name);
    console.log('    ' + err.message);
  }
}

function summary(fileLabel) {
  console.log('');
  console.log(fileLabel + ': ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

module.exports = { test, summary };
