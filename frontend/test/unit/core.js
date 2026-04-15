import { results, describe, it, expect } from "../../common/unittest.js";
import { LERP, clamp } from "../../common/common.js"; // Function to test

results.init(); // Must call to reset it

describe("LERP", () => {
  it("should return a value in the interval [a, b] if alpha is in [0, 1], and extrapolate beyond [a, b] when alpha is not in [0, 1]", () => {
    const a = 1;
    const b = 2;
    const alpha = 1;

    const result = LERP(a, b, alpha);

    expect(result).toBe(2);
  });
});

describe("clamp", () => {
  it("should return the input if it is within [min, max], otherwise return the closest bound", () => {
    const n = 1;
    const min = 10;
    const max = 20;

    const result = clamp(n, min, max);

    expect(result).toBe(min);
  });
});

results.see();
