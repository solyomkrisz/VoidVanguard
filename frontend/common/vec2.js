import * as MATRIX from "./common.js";

export function create() {
  const res = new MATRIX.DATA_STRUCTURE(2);

  if (MATRIX.DATA_STRUCTURE != Float32Array) {
    res[0] = 0;
    res[1] = 0;
  }

  return res;
}

export function set(target, x, y) {
  target[0] = x;
  target[1] = y;

  return target;
}

export function clone(source) {
  const res = new MATRIX.DATA_STRUCTURE(2);

  res[0] = source[0];
  res[1] = source[1];

  return res;
}

export function copy(target, source) {
  target[0] = source[0];
  target[1] = source[1];

  return target;
}

export function fromValues(x, y) {
  return new MATRIX.DATA_STRUCTURE([x, y]);
}

export function scale(target, source, s) {
  target[0] = source[0] * s;
  target[1] = source[1] * s;

  return target;
}

export function reset(target) {
  target[0] = 0;
  target[1] = 0;

  return target;
}

export function rotate(target, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);

  const [x, y] = target;

  target[0] = x * c + y * -s;
  target[1] = x * s + y * c;

  return target;
}

export function add(target, v1, v2) {
  target[0] = v1[0] + v2[0];
  target[1] = v1[1] + v2[1];

  return target;
}

export function subtract(target, v1, v2) {
  target[0] = v1[0] - v2[0];
  target[1] = v1[1] - v2[1];

  return target;
}

export function multiply(target, v1, v2) {
  target[0] = v1[0] * v2[0];
  target[1] = v1[1] * v2[1];

  return target;
}

export function normalize(target, v) {
  let x = v[0],
    y = v[1];

  const len = Math.sqrt(x * x + y * y);

  if (len > 1) {
    target[0] /= len;
    target[1] /= len;
  }

  return target;
}

export function dot(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}

export function cross(v1, v2) {
  return v1[0] * v2[1] - v1[1] * v2[0];
}

export function addScaled(target, a, b, scale) {
  target[0] = a[0] + b[0] * scale;
  target[1] = a[1] + b[1] * scale;
  return target;
}

export function subScaled(target, a, b, scale) {
  target[0] = a[0] - b[0] * scale;
  target[1] = a[1] - b[1] * scale;
  return target;
}

export function len(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

export function transformMat2(target, m, v) {
  let x = v[0],
    y = v[1];

  target[0] = m[0] * x + m[2] * y;
  target[1] = m[1] * x + m[3] * y;

  return target;
}

export function isEqual(v1, v2, epsilon = MATRIX.EPSILON) {
  return (
    Math.abs(v1[0] - v2[0]) <= epsilon && Math.abs(v1[1] - v2[1]) <= epsilon
  );
}

export function lerp(target, a, b, t) {
  let ax = a[0],
    ay = a[1],
    bx = b[0],
    by = b[1];

  target[0] = ax + (bx - ax) * t;
  target[1] = ay + (by - ay) * t;

  return target;
}

export function floor(target) {
  let x = target[0],
    y = target[1];

  target[0] = Math.floor(x);
  target[1] = Math.floor(y);

  return target;
}

export function ceil(target) {
  let x = target[0],
    y = target[1];

  target[0] = Math.ceil(x);
  target[1] = Math.ceil(y);

  return target;
}

export function round(target) {
  let x = target[0],
    y = target[1];

  target[0] = Math.round(x);
  target[1] = Math.round(y);

  return target;
}

export function toVec3(target, source) {
  target[0] = source[0];
  target[1] = source[1];
  target[2] = 1;

  return target;
}

export const crt = create;
export const sub = subtract;
export const mul = multiply;
