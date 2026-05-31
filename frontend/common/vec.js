/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/vec.js
 * Szerep: Tetszoleges hosszu vektorok alapmuveletei a valasztott adattaroloval.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as MATRIX from "./common.js";

// Ures, tetszoleges hosszu vektort keszit a hasznalt adattipussal.
export function create(size) {
  const res = new MATRIX.DATA_STRUCTURE(size);

  if (MATRIX.DATA_STRUCTURE !== Float32Array) {
    for (let i = 0; i < size; i++) res[i] = 0;
  }

  return res;
}

// Masolatot keszit egy mar letezo vektorrol.
export function clone(source) {
  const res = new MATRIX.DATA_STRUCTURE(source.length);

  for (let i = 0; i < source.length; i++) {
    res[i] = source[i];
  }

  return res;
}

// A kapott vektor minden elemet nullara allitja.
export function reset(target) {
  for (let i = 0; i < target.length; i++) target[i] = 0;

  return target;
}

// A megadott ertekekbol uj vektort epít.
export function fromValues(...values) {
  return new MATRIX.DATA_STRUCTURE(values);
}
