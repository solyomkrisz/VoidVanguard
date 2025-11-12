import * as MATRIX from "./common.js";

export function identity() {
  const res = new MATRIX.DATA_STRUCTURE(4);

  if (MATRIX.DATA_STRUCTURE != Float32Array) {
    res[1] = 0;
    res[2] = 0;
  }

  res[0] = 1;
  res[3] = 1;

  return res;
}

export function fromRotation(target, rad) {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  target[0] = cos;
  target[1] = sin;
  target[2] = -sin;
  target[3] = cos;

  return target;
}
