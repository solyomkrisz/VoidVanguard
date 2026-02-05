import Shape from "./Shape.js";
import Block from "./Block.js";
import { SpriteID, TextureID } from "./texture/Texture.js";
import Model from "./Model.js";
import { createBlock } from "./BlockTypes.js";
import Thruster from "./Thruster.js";

const offset = 0;
// starting player model
const PLAYER = [
  createBlock(0, 0, "BLOCK_12"),
  createBlock(1 - offset, 0, "BLOCK_12"),
  createBlock(-1 + offset, 0, "BLOCK_12"),
  createBlock(0, 1 - offset, "TURRET_12"),
  new Thruster({
    x: -1, y: -1, shape: new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5), spriteID: TextureID.BLOCK_1, mass: 1, health: 1, Isp: 100, massFlowRate: 100, hasGimbal: true, gimbalRange: 15
  }),
  new Thruster({
    x: 1, y: -1, shape: new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5), spriteID: TextureID.BLOCK_1, mass: 1, health: 1, Isp: 100, massFlowRate: 100, hasGimbal: true, gimbalRange: 15
  })
];

// scout models, scouts for resources and is not/lightly armed
const SCOUT1 = [
  createBlock(0, 0, 'BLOCK_1'),
];
const SCOUT2 = [
  createBlock(0, 0, 'BLOCK_1'),
  createBlock(0, 1, 'BLOCK_1'),
  createBlock(-1, 0, 'BLOCK_1'),
  createBlock(0, -1, 'BLOCK_1'),
];

// debug model with all the blocks (temp)
const DEBUG_MODEL = [
  createBlock(0, 0, 'BLOCK_1'),
  createBlock(1, 0, 'BLOCK_2'),
  createBlock(-1, 0, 'BLOCK_3'),
  createBlock(-2, 0, 'BLOCK_3'),
  createBlock(2, 0, 'BLOCK_4'),
  createBlock(0, 1, 'BLOCK_5'),
  createBlock(1, 1, 'BLOCK_6'),
  createBlock(-1, 1, 'BLOCK_7'),
  createBlock(0, -1, 'BLOCK_8'),
  createBlock(1, -1, 'BLOCK_9'),
  createBlock(-1, -1, 'BLOCK_10'),
];

const MODELS = {
    PLAYER: new Model(PLAYER),
    SCOUT1: new Model(SCOUT1),
    SCOUT2: new Model(SCOUT2),
    DEBUG_MODEL: new Model(DEBUG_MODEL),
};

export default MODELS;
