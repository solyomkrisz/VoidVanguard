import * as MATRIX from "./common.js";

export function create(size) {
  const res = new MATRIX.DATA_STRUCTURE(size);

  if (MATRIX.DATA_STRUCTURE !== Float32Array) {
    for (let i = 0; i < size; i++) res[i] = 0;
  }

  return res;
}

export function reset(target) {
  for (let i = 0; i < target.length; i++) target[i] = 0;

  return target;
}

export function fromValues(...values) {
  return new MATRIX.DATA_STRUCTURE(values);
}
