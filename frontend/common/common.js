export const DATA_STRUCTURE =
  typeof Float32Array !== "undefined" ? Float32Array : Array;

export const EPSILON = 0.01;

export function LERP(a, b, alpha) {
  return a + (b - a) * alpha;
}
