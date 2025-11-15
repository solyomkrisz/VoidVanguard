import * as MATRIX from "./common.js";

export function create() {
  const res = new MATRIX.DATA_STRUCTURE(9);

  if (MATRIX.DATA_STRUCTURE != Float32Array) {
    res[0] = 0;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;
    res[4] = 0;
    res[5] = 0;
    res[6] = 0;
    res[7] = 0;
    res[8] = 0;
  }

  return res;
}

export function identity() {
  const res = new MATRIX.DATA_STRUCTURE(9);

  if (MATRIX.DATA_STRUCTURE != Float32Array) {
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;
    res[5] = 0;
    res[6] = 0;
    res[7] = 0;
  }

  res[0] = 1;
  res[4] = 1;
  res[8] = 1;

  return res;
}

export function get(m00, m10, m20, m01, m11, m21, m02, m12, m22) {
  const res = new MATRIX.DATA_STRUCTURE(9);

  res[0] = m00;
  res[1] = m10;
  res[2] = m20;
  res[3] = m01;
  res[4] = m11;
  res[5] = m21;
  res[6] = m02;
  res[7] = m12;
  res[8] = m22;

  return res;
}

export function set(target, m00, m10, m20, m01, m11, m21, m02, m12, m22) {
  target[0] = m00;
  target[1] = m10;
  target[2] = m20;
  target[3] = m01;
  target[4] = m11;
  target[5] = m21;
  target[6] = m02;
  target[7] = m12;
  target[8] = m22;

  return target;
}

// prettier-ignore
export function cam(target, aspectRatio, scale, player) {
  let scaleX = scale, scaleY = scale;

  if (aspectRatio >= 1) scaleX = scale / aspectRatio;
  else scaleY = scale * aspectRatio;

  const tx = -(player.position[0] * scaleX);
  const ty = -(player.position[1] * scaleY);

  target[0] = scaleX;
  target[4] = scaleY;
  target[6] = tx;
  target[7] = ty;

  return target;
}
