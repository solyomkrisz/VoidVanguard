import * as MATRIX from "./common.js";

export function create() {
  const res = new MATRIX.DATA_STRUCTURE(3);

  if (MATRIX.DATA_STRUCTURE != Float32Array) {
    res[0] = 0;
    res[1] = 0;
    res[2] = 0;
  }

  return res;
}

export function get(x, y, z) {
  const res = new MATRIX.DATA_STRUCTURE(3);

  res[0] = x;
  res[1] = y;
  res[2] = z;

  return res;
}

export function set(target, x, y, z) {
  target[0] = x;
  target[1] = y;
  target[2] = z;

  return target;
}

export function add(target, v1, v2) {
  target[0] = v1[0] + v2[0];
  target[1] = v1[1] + v2[1];
  target[2] = v1[2] + v2[2];

  return target;
}

export function subtract(target, v1, v2) {
  target[0] = v1[0] - v2[0];
  target[1] = v1[1] - v2[1];
  target[2] = v1[2] - v2[2];

  return target;
}

export function copy(target, source) {
  target[0] = source[0];
  target[1] = source[1];
  target[2] = source[2];

  return target;
}

export function toVec2(target, vec3) {
  target[0] = vec3[0];
  target[1] = vec3[1];

  return target;
}

export function transformMat3(m, v) {
  let x = v[0],
    y = v[1],
    z = v[2];

  return new MATRIX.DATA_STRUCTURE([
    m[0] * x + m[3] * y + m[6] * z,
    m[1] * x + m[4] * y + m[7] * z,
    m[2] * x + m[5] * y + m[8] * z,
  ]);
}

export function transformMat3Into(target, m, v) {
  let x = v[0],
    y = v[1],
    z = v[2];

  target[0] = m[0] * x + m[3] * y + m[6] * z;
  target[1] = m[1] * x + m[4] * y + m[7] * z;
  target[2] = m[2] * x + m[5] * y + m[8] * z;

  return target;
}

export const crt = create;
export const sub = subtract;
