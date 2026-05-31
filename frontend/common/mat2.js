/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/mat2.js
 * Szerep: 2x2 matrix segedek foleg 2D forgatasokhoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as MATRIX from "./common.js";

// 2D identitasmatrixot ad vissza.
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

// Forgatasi matrixot ir a targetbe a kapott szog alapjan.
export function fromRotation(target, rad) {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  target[0] = cos;
  target[1] = sin;
  target[2] = -sin;
  target[3] = cos;

  return target;
}
