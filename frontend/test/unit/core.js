import { results, describe, it, expect } from "/common/unittest.js";
import {
  LERP,
  getAngleDiff,
  clamp,
  inCircle,
  isEqual,
  setFieldValue,
  lookupProperty,
  smoothstep,
  extractForm,
  isInViewport,
} from "/common/common.js"; // Function to test

results.init(); // Must call to reset it

describe("LERP", () => {
  it("should return a value in the interval [a, b] if alpha is in [0, 1], and extrapolate beyond [a, b] when alpha is not in [0, 1]", () => {
    const a = 1;
    const b = 2;
    const alpha = 1;

    const result = LERP(a, b, alpha);

    expect(result).toBe(2);
  });

  it("should extrapolate below range", () => {
    expect(LERP(10, 20, -1)).toBe(0);
  });

  it("should extrapolate above range", () => {
    expect(LERP(10, 20, 2)).toBe(30);
  });
});

describe("getAngleDiff", () => {
  it("should normalize angle difference", () => {
    const a = Math.PI;
    const b = -Math.PI;

    const diff = getAngleDiff(a, b);

    expect(Math.abs(diff) < Math.PI).toBe(true);
  });

  it("should return ~0 for identical angles", () => {
    expect(getAngleDiff(Math.PI / 2, Math.PI / 2)).toBe(0);
  });

  it("should correctly wrap around across -PI/PI boundary", () => {
    const a = Math.PI - 0.1;
    const b = -Math.PI + 0.1;

    const diff = getAngleDiff(a, b);

    expect(Math.abs(diff) < 0.3).toBe(true);
  });
});

describe("inCircle", () => {
  it("should detect point inside circle", () => {
    expect(inCircle(0, 0, 0, 0, 5)).toBe(true);
  });

  it("should detect point outside circle", () => {
    expect(inCircle(10, 10, 0, 0, 5)).toBe(false);
  });
});

describe("clamp", () => {
  it("should return max when value exceeds max", () => {
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it("should return min when value is below min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("should return value when inside range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("smoothstep", () => {
  it("should return 0 at t = 0", () => {
    expect(smoothstep(0)).toBe(0);
  });

  it("should return 1 at t = 1", () => {
    expect(smoothstep(1)).toBe(1);
  });

  it("should stay in [0,1] range", () => {
    const values = [0, 0.2, 0.5, 0.8, 1];

    const allValid = values.every((t) => {
      const v = smoothstep(t);
      return v >= 0 && v <= 1;
    });

    expect(allValid).toBe(true);
  });
});

describe("isEqual", () => {
  it("should return true when values at path are equal", () => {
    const a = { user: { id: 1 } };
    const b = { user: { id: 1 } };

    expect(isEqual(a, b, "user.id")).toBe(true);
  });

  it("should return false when values differ", () => {
    const a = { user: { id: 1 } };
    const b = { user: { id: 2 } };

    expect(isEqual(a, b, "user.id")).toBe(false);
  });

  it("should handle missing paths safely", () => {
    const a = {};
    const b = {};

    expect(isEqual(a, b, "user.id")).toBe(true);
  });
});

describe("setFieldValue", () => {
  it("should set checkbox correctly", () => {
    const input = document.createElement("input");
    input.type = "checkbox";

    setFieldValue(input, true);

    expect(input.checked).toBe(true);
  });

  it("should set normal input value", () => {
    const input = document.createElement("input");

    setFieldValue(input, "hello");

    expect(input.value).toBe("hello");
  });

  it("should select correct radio option", () => {
    const form = document.createElement("form");

    const r1 = document.createElement("input");
    r1.type = "radio";
    r1.name = "choice";
    r1.value = "a";

    const r2 = document.createElement("input");
    r2.type = "radio";
    r2.name = "choice";
    r2.value = "b";

    form.appendChild(r1);
    form.appendChild(r2);

    setFieldValue(form.elements.namedItem("choice"), "b");

    expect(r2.checked).toBe(true);
  });
});

describe("lookupProperty", () => {
  it("should resolve nested path", () => {
    const obj = { a: { b: { c: 42 } } };

    expect(lookupProperty(obj, "a.b.c")).toBe(42);
  });

  it("should return undefined for invalid path", () => {
    const obj = { a: {} };

    expect(lookupProperty(obj, "a.b.c")).toBe(undefined);
  });

  it("should resolve array index paths", () => {
    const obj = { items: ["a", "b", "c"] };

    expect(lookupProperty(obj, "items.1")).toBe("b");
  });

  it("should treat numeric strings as indices", () => {
    const obj = { a: ["x"] };

    expect(lookupProperty(obj, "a.0")).toBe("x");
  });
});

describe("extractForm", () => {
  it("should extract values from form inputs", () => {
    const form = document.createElement("form");

    const input = document.createElement("input");
    input.name = "username";
    input.value = "test";

    form.appendChild(input);

    const result = extractForm(form);

    expect(result.username).toBe("test");
  });

  it("should skip empty values when includeEmpty is false", () => {
    const form = document.createElement("form");

    const input = document.createElement("input");
    input.name = "email";
    input.value = "";

    form.appendChild(input);

    const result = extractForm(form, false);

    expect(result.email).toBe(undefined);
  });

  it("should include empty values when flag is true", () => {
    const form = document.createElement("form");

    const input = document.createElement("input");
    input.name = "email";
    input.value = "";

    form.appendChild(input);

    const result = extractForm(form, true);

    expect(result.email).toBe("");
  });
});

describe("isInViewport", () => {
  it("should return false for null input", () => {
    expect(isInViewport(null)).toBe(false);
  });
});

results.see();
