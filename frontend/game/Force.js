/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Force.js
 * Szerep: 2D ero-vektor cached merettel es irannyal a fizikai szamitasokhoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";

export default class Force {
  static DIRTY = Object.freeze({
    NONE: 0,
    VECTOR: 1 << 0,
  });

  // Letrehozza az erovektort, es elokesziti a gyorsan lekerdezheto hossz/irany cache-t.
  constructor(x = 0, y = 0) {
    this.vector = vec2.fromValues(x, y);
    this.dirty = Force.DIRTY.VECTOR;
    this._magnitude = vec2.len(this.vector);
    this._direction = vec2.normalize(vec2.create(), this.vector);
  }

  // Egy mar meglevo vektor alapjan allitja at az erot.
  setFromVec(vec) {
    vec2.copy(this.vector, this.vector, vec);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  // Kozvetlen x/y komponensekkel allitja be az erot.
  setFromXY(x, y) {
    vec2.set(this.vector, x, y);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  // Hossz + irany parbol epiti ujra az erovektort.
  setFromMagDir(magnitude, direction) {
    vec2.copy(this.vector, direction);
    vec2.scale(this.vector, this.vector, magnitude);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  // Megforditja az ero iranyat, mintha ellentetes hatas lepne fel.
  negate() {
    vec2.scale(this.vector, this.vector, -1);

    return this;
  }

  // Hozzaad egy masik erovektort a jelenlegi eredohöz.
  apply(force) {
    vec2.add(this.vector, this.vector, force.vector);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  // Lenullazza az erot.
  reset() {
    vec2.reset(this.vector);
    this.dirty |= Force.DIRTY.VECTOR;

    return this;
  }

  // Ha valtozott a vektor, ujraszamolja a cache-elt hosszt es iranyt.
  update() {
    if (this.dirty === Force.DIRTY.NONE) return;

    this._magnitude = vec2.len(this.vector);
    this._direction = vec2.normalize(this._direction, this.vector);

    this.dirty &= ~Force.DIRTY.VECTOR;
  }

  // A legutobb frissitett ero-nagysagot adja vissza.
  magnitude() {
    return this._magnitude;
  }

  // A legutobb frissitett ero-iranyt adja vissza.
  direction() {
    return this._direction;
  }
}
