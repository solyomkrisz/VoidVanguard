/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/mat3.js
 * Szerep: 3x3 matrix segedek kamera- es homogen koordinata transzformokhoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as MATRIX from "./common.js";
import { LERP } from "./common.js";

// Ures 3x3 matrixot keszit.
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

// 3x3 identitasmatrixot hoz letre.
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

// A megadott 9 elembol uj 3x3 matrixot rak ossze.
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

// A matrix minden elemet egyszerre beirja a target taroloba.
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
// A kamera aktualis nezeti matrixat szamolja ki a jatekos interpolalt helyzete alapjan.
export function cam(target, aspectRatio, scale, alpha, player) {
  let scaleX = scale, scaleY = scale;

  if (aspectRatio >= 1) scaleX = scale / aspectRatio;
  else scaleY = scale * aspectRatio;

  const [ppx, ppy] = player.previousPosition;
  const [pcx, pcy] = player.position;

  const playerInterpX = LERP(ppx, pcx, alpha);
  const playerInterpY = LERP(ppy, pcy, alpha);

  const tx = -(playerInterpX * scaleX);
  const ty = -(playerInterpY * scaleY);

  target[0] = scaleX;
  target[4] = scaleY;
  target[6] = tx;
  target[7] = ty;

  return target;
}

// prettier-ignore
// A kamera inverz matrixat adja, amikor kepernyorol vilagkoordinatara kell visszavaltani.
export function camInverse(target, aspectRatio, scale, alpha, player) {
  let scaleX = scale,
    scaleY = scale;

  if (aspectRatio >= 1) scaleX = scale / aspectRatio;
  else scaleY = scale * aspectRatio;

  target[0] = 1 / scaleX;
  target[4] = 1 / scaleY;
  target[6] = player.position[0];
  target[7] = player.position[1];

  return target;
}
