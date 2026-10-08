const assert = require("node:assert/strict");
const s = require("./app.js");
function near(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) < tolerance, actual + " differs from " + expected);
}
near(s.quantile(.975), 1.95996398454);
near(s.quantile(.95), 1.64485362695);
near(s.pValue(2.33, "two", "z", 24), .01980615112);
near(s.quantile(.975, "t", 7), 2.364624251);
near(s.quantile(.975, "t", 63), 1.998340543);
near(s.quantile(.975, "t", 1), 12.706204736, 1e-5);
near(s.pValue(-2.5166, "two", "t", 7), .04000891517);
near(s.cdf(0, "t", 1), .5);
near(s.quantile(.5), 0);
assert.equal(s.quantile(0), -Infinity);
assert.equal(s.quantile(1), Infinity);
for (const kind of ["z", "t"]) {
  for (const df of [1, 2, 7, 24, 100, 10000]) {
    for (let i = 1; i < 100; i += 1) {
      const p = i / 100;
      near(s.cdf(s.quantile(p, kind, df), kind, df), p, 2e-6);
      near(s.pValue(s.quantile(1 - p / 2, kind, df), "two", kind, df), p, 2e-6);
    }
  }
}
console.log("All numerical checks passed.");
