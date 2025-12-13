import Shape from "./Shape.js";
import Block from "./Block.js";
import { SpriteID } from "./texture/Texture.js";
import Model from "./Model.js";

// BASE COLLIDERS
// (base block) rectangle collider
const rectCollider = new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5);
// (temporary) triangle collider
const triCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5);
// (small block) small rectangle collider
const smallRectCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.15, 0.15, 0.15, 0.15, 0.15, -0.15, -0.15, -0.15);
// SPECIAL TURRET COLLIDERS
// S.U.L.O - Szingularitás-alapú Ultra-Lézer Oscillátor
const suloTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.01, 1, 0.01, 1, 0.1, -0.5, -0.1, -0.5);
// Aphelion
const aphelionTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.065, 1, 0.065, 1, 0.3, -0.5, -0.3, -0.5);
// Sigma-Impulzuságyú
const sigmaTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.25, 1, 0.25, 1, 0.2, -0.5, -0.2, -0.5);
// TURRET COLLIDERS
// normal turret collider
const n1TurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.1, 0.25, 0.1, 0.25, 0.15, -0.5, -0.15, -0.5);
// normal taller turret turret collider
const n2TurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.1, 0.35, 0.1, 0.35, 0.15, -0.5, -0.15, -0.5);
// normal tallest turret collider
const n3TurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.1, 0.5, 0.1, 0.5, 0.15, -0.5, -0.15, -0.5);
// SIDE TURRET COLLIDERS
// right side turret collider
const r1SideTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.10, 0.25, 0.1, 0.25, 0.15, -0.375, -0.5, -0.35);
// right side taller turret collider
const r2SideTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.10, 0.35, 0.1, 0.35, 0.15, -0.375, -0.5, -0.35);
// right side tallest turret collider
const r3SideTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.10, 0.5, 0.1, 0.5, 0.15, -0.375, -0.5, -0.35);
// SIDE TURRET COLLIDERS
// left side turret collider
const l1SideTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, 0.10, 0.25, -0.1, 0.25, -0.15, -0.375, 0.5, -0.35);
// left side taller turret collider
const l2SideTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, 0.10, 0.35, -0.1, 0.35, -0.15, -0.375, 0.5, -0.35);
// left side tallest turret collider
const l3SideTurretCollider = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, 0.10, 0.5, -0.1, 0.5, -0.15, -0.375, 0.5, -0.35);

// starting player model 
const PLAYER = [
  new Block(0, 0, rectCollider, SpriteID.TEST, 50),
  new Block(1, 0, rectCollider, SpriteID.TEST, 50),
  new Block(-1, 0, rectCollider, SpriteID.TEST, 50),
  new Block(-2, 0, l1SideTurretCollider, SpriteID.TEST, 50),
  new Block(2, 0, r1SideTurretCollider, SpriteID.TEST, 50),
  new Block(0, 1, n1TurretCollider, SpriteID.TEST, 50),
];

// scout models, scouts for resources and is not/lightly armed
const SCOUT1 = [
  new Block(0, 0, rectCollider, SpriteID.TEST, 30),
];
const SCOUT2 = [
  new Block(0, 0, rectCollider, SpriteID.TEST, 40),
  new Block(0, 1, aphelionTurretCollider, SpriteID.TEST, 20),
  new Block(1, 0, r3SideTurretCollider, SpriteID.TEST, 20),
  new Block(-1, 0, l3SideTurretCollider, SpriteID.TEST, 20),
];

// debug model with all the blocks (temp)
const DEBUG_MODEL = [
  new Block(0, 0, rectCollider, SpriteID.TEST, 50),
  new Block(1, 0, rectCollider, SpriteID.TEST, 30),
  new Block(-1, 0, rectCollider, SpriteID.TEST, 50),
  new Block(2, 0, rectCollider, SpriteID.TEST, 40),
  new Block(-2, 0, rectCollider, SpriteID.TEST, 40),
  new Block(0, 1, rectCollider, SpriteID.TEST, 45),
  new Block(1, 1, rectCollider, SpriteID.TEST, 45),
  new Block(-1, 1, rectCollider, SpriteID.TEST, 45),
  new Block(0, 2, triCollider, SpriteID.TEST, 35),
];

const MODELS = {
    PLAYER: new Model(PLAYER),
    SCOUT1: new Model(SCOUT1),
    SCOUT2: new Model(SCOUT2),
    DEBUG_MODEL: new Model(DEBUG_MODEL),
};

export default MODELS;
