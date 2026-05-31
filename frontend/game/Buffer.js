/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Buffer.js
 * Szerep: Elore lefoglalt ideiglenes vektor- es matrixbuffer a frame kozbeni allokacio csokkentesere.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";
import * as vec3 from "/common/vec3.js";
import * as mat2 from "/common/mat2.js";
import * as mat3 from "/common/mat3.js";
import Collision from "/game/Collision.js";
import Force from "/game/Force.js";

export default class Buffer {
  constructor() {
    // A frame kozben gyakran ujrahasznalt tombok, vektorok, matrixok es ideiglenes objektumok itt egy helyen elore le vannak foglalva.
    this.arrn_1 = [];
    this.arrn_2 = [];
    this.arrn_3 = [];

    this.vec2_1 = vec2.create();
    this.vec2_2 = vec2.create();
    this.vec2_3 = vec2.create();

    this.vec3_1 = vec3.create();
    this.vec3_2 = vec3.create();
    this.vec3_3 = vec3.create();

    this.mat2_1 = mat2.identity();
    this.mat2_2 = mat2.identity();
    this.mat2_3 = mat2.identity();

    this.mat3_1 = mat3.identity();
    this.mat3_2 = mat3.identity();
    this.mat3_3 = mat3.identity();

    this.collision_1 = new Collision();
    this.collision_2 = new Collision();

    this.force_1 = new Force();
    this.force_2 = new Force();
  }
}
