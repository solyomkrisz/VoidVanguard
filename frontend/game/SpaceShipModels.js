import Shape from "/game/Shape.js";
import Block from "/game/Block.js";
import { SpriteID } from "/game/texture/Texture.js";
import Model from "/game/Model.js";
import { createBlock } from "/game/BlockTypes.js";
import Thruster from "/game/Thruster.js";

const THRUSTER_SHAPE = new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5);

function makeThruster(x, y, hasGimbal = false, gimbalRange = 15) {
  return new Thruster({
    x, y,
    shape: THRUSTER_SHAPE,
    spriteID: SpriteID.THRUSTER,
    mass: 1, health: 1, Isp: 100, massFlowRate: 100,
    hasGimbal, gimbalRange,
  });
}

function clampDifficulty(difficulty) {
  return Math.max(1, Math.min(15, Math.floor(difficulty || 1)));
}

function pickArchetypeByDifficulty(difficulty, rng = Math.random) {
  if (difficulty <= 3) {
    const r = rng();
    if (r < 0.30) return "SCOUT";
    if (r < 0.55) return "FIGHTER";
    if (r < 0.73) return "DART";
    if (r < 0.88) return "SENTINEL";
    return "SKIFF";
  }

  if (difficulty <= 7) {
    const r = rng();
    if (r < 0.28) return "FIGHTER";
    if (r < 0.48) return "CORVETTE";
    if (r < 0.63) return "GUNSHIP";
    if (r < 0.74) return "LANCER";
    if (r < 0.83) return "RAMMER";
    if (r < 0.91) return "RAIDER";
    return "BOMBER";
  }

  if (difficulty <= 11) {
    const r = rng();
    if (r < 0.18) return "RAIDER";
    if (r < 0.34) return "GUNSHIP";
    if (r < 0.49) return "STALKER";
    if (r < 0.63) return "CRUISER";
    if (r < 0.73) return "FIGHTER";
    if (r < 0.82) return "RAMMER";
    if (r < 0.92) return "DESTROYER";
    return "BOMBER";
  }

  const r = rng();
  if (r < 0.13) return "RAIDER";
  if (r < 0.26) return "INTERCEPTOR";
  if (r < 0.39) return "GUNSHIP";
  if (r < 0.50) return "STALKER";
  if (r < 0.59) return "CRUISER";
  if (r < 0.68) return "DESTROYER";
  if (r < 0.76) return "BOMBER";
  if (r < 0.84) return "RAMMER";
  if (r < 0.93) return "DREADNOUGHT";
  return "FIGHTER";
}

function createCore() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return core;
}

function getLocalPositionKey(object) {
  const lp = object?.localPosition;
  if (!lp || lp.length < 2) return null;
  return `${lp[0]},${lp[1]}`;
}

function sanitizeBlueprintObjects(objects) {
  const occupied = new Set();
  const sanitized = [];

  for (const object of objects) {
    const key = getLocalPositionKey(object);

    if (!key) {
      sanitized.push(object);
      continue;
    }

    if (occupied.has(key)) continue;

    occupied.add(key);
    sanitized.push(object);
  }

  return sanitized;
}

function getArchetypeBlueprint(selected, blockType, turretType) {
  switch (selected) {
    case "DART":
      return {
        speedMultiplier: 1.28,
        turnRateMultiplier: 1.38,
        objects: [
          createCore(),
          makeThruster(0, -1, true, 15),
        ],
      };

    case "SENTINEL":
      return {
        speedMultiplier: 0.82,
        turnRateMultiplier: 0.85,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock( 1, 0, blockType),
          createBlock(-1, 1, turretType),
          createBlock( 1, 1, turretType),
          makeThruster(0, -1, false),
        ],
      };

    case "SKIFF":
      return {
        speedMultiplier: 1.02,
        turnRateMultiplier: 1.06,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock( 1, 0, blockType),
          createBlock( 0, 1, turretType),
          makeThruster(-1, -1, true, 12),
          makeThruster( 1, -1, true, 12),
        ],
      };

    case "SCOUT":
      return {
        speedMultiplier: 1.1,
        turnRateMultiplier: 1.18,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(0, 1, turretType),
          makeThruster(0, -1, true, 10),
        ],
      };

    case "FIGHTER":
      return {
        speedMultiplier: 1.0,
        turnRateMultiplier: 1.0,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(-1, 1, turretType),
          createBlock(1, 1, turretType),
          makeThruster(-1, -1, true, 12),
          makeThruster(1, -1, true, 12),
        ],
      };

    case "CORVETTE":
      return {
        speedMultiplier: 0.95,
        turnRateMultiplier: 0.92,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock( 1, 0, blockType),
          createBlock(-1, 1, turretType),
          createBlock( 0, 1, turretType),
          createBlock( 1, 1, turretType),
          makeThruster(-1, -1, true, 12),
          makeThruster( 1, -1, true, 12),
        ],
      };

    case "LANCER":
      return {
        speedMultiplier: 1.22,
        turnRateMultiplier: 1.15,
        objects: [
          createCore(),
          createBlock(-1,  0, blockType),
          createBlock( 1,  0, blockType),
          createBlock( 0,  1, blockType),
          createBlock( 0,  2, blockType),
          createBlock(-1,  2, turretType),
          createBlock( 1,  2, turretType),
          makeThruster(-1, -1, true, 13),
          makeThruster( 1, -1, true, 13),
        ],
      };

    case "RAIDER":
      return {
        speedMultiplier: 1.18,
        turnRateMultiplier: 1.2,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(0, 1, turretType),
          createBlock(-1, 1, turretType),
          makeThruster(-1, -1, true, 14),
          makeThruster(1, -1, true, 14),
        ],
      };

    case "INTERCEPTOR":
      return {
        speedMultiplier: 1.3,
        turnRateMultiplier: 1.28,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(0, 1, turretType),
          createBlock(0, 2, turretType),
          makeThruster(-1, -1, true, 15),
          makeThruster(1, -1, true, 15),
        ],
      };

    case "RAMMER":
      return {
        speedMultiplier: 1.36,
        turnRateMultiplier: 1.22,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(0, 1, blockType),
          createBlock(-1, 1, blockType),
          createBlock(1, 1, blockType),
          createBlock(0, 2, blockType),
          makeThruster(-1, -1, true, 15),
          makeThruster(1, -1, true, 15),
        ],
      };

    case "CRUISER":
      return {
        speedMultiplier: 0.84,
        turnRateMultiplier: 0.82,
        objects: [
          createCore(),
          createBlock(-1,  0, blockType),
          createBlock( 1,  0, blockType),
          createBlock(-2,  0, blockType),
          createBlock( 2,  0, blockType),
          createBlock(-1, -1, blockType),
          createBlock( 1, -1, blockType),
          createBlock(-2,  1, turretType),
          createBlock(-1,  1, turretType),
          createBlock( 1,  1, turretType),
          createBlock( 2,  1, turretType),
          makeThruster(-2, -1, true, 13),
          makeThruster( 0, -1),
          makeThruster( 2, -1, true, 13),
        ],
      };

    case "STALKER":
      return {
        speedMultiplier: 1.15,
        turnRateMultiplier: 1.12,
        objects: [
          createCore(),
          createBlock(-1,  0, blockType),
          createBlock( 1,  0, blockType),
          createBlock(-2,  0, blockType),
          createBlock( 2,  0, blockType),
          createBlock(-2,  1, turretType),
          createBlock( 0,  1, turretType),
          createBlock( 2,  1, turretType),
          makeThruster(-1, -1, true, 14),
          makeThruster( 1, -1, true, 14),
        ],
      };

    case "GUNSHIP":
      return {
        speedMultiplier: 0.9,
        turnRateMultiplier: 0.88,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(-2, 0, blockType),
          createBlock(2, 0, blockType),
          createBlock(0, 1, blockType),
          createBlock(0, 2, turretType),
          createBlock(-2, 1, turretType),
          createBlock(2, 1, turretType),
          makeThruster(-2, -1, true, 14),
          makeThruster(2, -1, true, 14),
          makeThruster(-1, -1),
          makeThruster(1, -1),
        ],
      };

    case "BOMBER":
      return {
        speedMultiplier: 0.72,
        turnRateMultiplier: 0.75,
        objects: [
          createCore(),
          createBlock(-1,  0, blockType),
          createBlock( 1,  0, blockType),
          createBlock(-2,  0, blockType),
          createBlock( 2,  0, blockType),
          createBlock(-1, -1, blockType),
          createBlock( 1, -1, blockType),
          createBlock(-3,  0, turretType),
          createBlock( 3,  0, turretType),
          createBlock(-1,  1, turretType),
          createBlock( 0,  1, turretType),
          createBlock( 1,  1, turretType),
          makeThruster(-1, -2),
          makeThruster( 1, -2),
        ],
      };

    case "DREADNOUGHT":
      return {
        speedMultiplier: 0.60,
        turnRateMultiplier: 0.62,
        objects: [
          createCore(),
          createBlock(-1,  0, blockType),
          createBlock( 1,  0, blockType),
          createBlock(-2,  0, blockType),
          createBlock( 2,  0, blockType),
          createBlock(-3,  0, blockType),
          createBlock( 3,  0, blockType),
          createBlock(-1,  1, blockType),
          createBlock( 0,  1, blockType),
          createBlock( 1,  1, blockType),
          createBlock(-2,  1, blockType),
          createBlock( 2,  1, blockType),
          createBlock(-1, -1, blockType),
          createBlock( 0, -1, blockType),
          createBlock( 1, -1, blockType),
          createBlock(-3,  1, turretType),
          createBlock(-1,  2, turretType),
          createBlock( 0,  2, turretType),
          createBlock( 1,  2, turretType),
          createBlock( 3,  1, turretType),
          makeThruster(-3, -1, true, 15),
          makeThruster( 3, -1, true, 15),
          makeThruster(-1, -2),
          makeThruster( 0, -2),
          makeThruster( 1, -2),
        ],
      };

    case "DESTROYER":
    default:
      return {
        speedMultiplier: 0.78,
        turnRateMultiplier: 0.78,
        objects: [
          createCore(),
          createBlock(-1, 0, blockType),
          createBlock(1, 0, blockType),
          createBlock(-2, 0, blockType),
          createBlock(2, 0, blockType),
          createBlock(-1, 1, blockType),
          createBlock(0, 1, blockType),
          createBlock(1, 1, blockType),
          createBlock(-2, 1, turretType),
          createBlock(0, 2, turretType),
          createBlock(2, 1, turretType),
          makeThruster(-2, -1, true, 15),
          makeThruster(2, -1, true, 15),
          makeThruster(-1, -1),
          makeThruster(1, -1),
        ],
      };
  }
}

export function createEnemyModelByDifficulty(difficulty, archetype = "AUTO", rng = Math.random) {
  const d = clampDifficulty(difficulty);
  const blockType = `BLOCK_${d}`;
  const turretType = `TURRET_${d}`;
  const selected = archetype === "AUTO" ? pickArchetypeByDifficulty(d, rng) : archetype;
  const blueprint = getArchetypeBlueprint(selected, blockType, turretType);
  const sanitizedObjects = sanitizeBlueprintObjects(blueprint.objects);
  const baseSpeed = 1.55 + d * 0.075;
  const maxSpeed = baseSpeed * blueprint.speedMultiplier;
  const turnRate = (1.05 + maxSpeed * 0.62) * blueprint.turnRateMultiplier;

  return {
    archetype: selected,
    model: new Model(sanitizedObjects),
    maxSpeed,
    turnRate,
  };
}

const offset = 0;
// starting player model - CORE block is the non-removable center
const coreBlock = createBlock(0, 0, "CORE");
coreBlock.isRemovable = false;

const PLAYER = [
  coreBlock,
  createBlock(1 - offset, 0, "BLOCK_15"),
  createBlock(-1 + offset, 0, "BLOCK_15"),
  createBlock(0, 1 - offset, "BLOCK_15"),
  createBlock(0, 2 - offset, "TURRET_15"),
  createBlock(-1, -1 - offset, "BLOCK_15"),
  createBlock(1, -1 - offset, "BLOCK_15"),
  createBlock(1, 1 - offset, "TURRET_15"),
  createBlock(-1, 1 - offset, "TURRET_15"),
  new Thruster({
    x: -1, y: -2, shape: new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5), spriteID: SpriteID.THRUSTER, mass: 1, health: 1, Isp: 100, massFlowRate: 100, hasGimbal: true, gimbalRange: 15
  }),
  new Thruster({
    x: 1, y: -2, shape: new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5), spriteID: SpriteID.THRUSTER, mass: 1, health: 1, Isp: 100, massFlowRate: 100, hasGimbal: true, gimbalRange: 15
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

// ── Enemy ship archetypes ────────────────────────────────────────────

// ── Beginner archetypes ──────────────────────────────────────────────

// ENEMY_DART — bare-minimum speed demon: core + 1 gimballed thruster, no turret
// Layout (y↑):
//   [C]
//  [THR]
function buildEnemyDart() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    makeThruster(0, -1, true, 15),
  ];
}

// ENEMY_SENTINEL — defensive turret platform: 2 side blocks, 2 front turrets, 1 rear thruster
// Layout (y↑):
//   [T1][T1]
//   [B1][C][B1]
//      [THR]
function buildEnemySentinel() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_1"),
    createBlock( 1,  0, "BLOCK_1"),
    createBlock(-1,  1, "TURRET_1"),
    createBlock( 1,  1, "TURRET_1"),
    makeThruster(0, -1, false),
  ];
}

// ENEMY_SKIFF — balanced entry craft: 2 side blocks, 1 forward turret, 2 rear thrusters
// Layout (y↑):
//      [T1]
//   [B1][C][B1]
//   [THR]   [THR]
function buildEnemySkiff() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_1"),
    createBlock( 1,  0, "BLOCK_1"),
    createBlock( 0,  1, "TURRET_1"),
    makeThruster(-1, -1, true, 12),
    makeThruster( 1, -1, true, 12),
  ];
}

// ── Mid-low archetypes (difficulty 4–7) ─────────────────────────────

// ENEMY_CORVETTE — three-turret line cruiser: core + 2 blocks + 3 forward turrets
// Layout (y↑):
//   [T4][T4][T4]
//   [B4][C][B4]
//   [THR]   [THR]
function buildEnemyCorvette() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_4"),
    createBlock( 1,  0, "BLOCK_4"),
    createBlock(-1,  1, "TURRET_4"),
    createBlock( 0,  1, "TURRET_4"),
    createBlock( 1,  1, "TURRET_4"),
    makeThruster(-1, -1, true, 12),
    makeThruster( 1, -1, true, 12),
  ];
}

// ENEMY_LANCER — fast needle: elongated forward hull, 2 tip turrets, 2 gimballed thrusters
// Layout (y↑):
//   [T5][T5]
//      [B5]
//      [B5]
//   [B5][C][B5]
//   [THR]   [THR]
function buildEnemyLancer() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_5"),
    createBlock( 1,  0, "BLOCK_5"),
    createBlock( 0,  1, "BLOCK_5"),
    createBlock( 0,  2, "BLOCK_5"),
    createBlock(-1,  2, "TURRET_5"),
    createBlock( 1,  2, "TURRET_5"),
    makeThruster(-1, -1, true, 13),
    makeThruster( 1, -1, true, 13),
  ];
}

// ── Mid-high archetypes (difficulty 8–11) ───────────────────────────

// ENEMY_CRUISER — armored heavy patrol: wide wings, 4 turrets, 3 thrusters
// Layout (y↑):
//   [T9][T9]   [T9][T9]
//   [B9][B9][C][B9][B9]
//        [B9]   [B9]
//   [THR]  [THR]  [THR]
function buildEnemyCruiser() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_9"),
    createBlock( 1,  0, "BLOCK_9"),
    createBlock(-2,  0, "BLOCK_9"),
    createBlock( 2,  0, "BLOCK_9"),
    createBlock(-1, -1, "BLOCK_9"),
    createBlock( 1, -1, "BLOCK_9"),
    createBlock(-2,  1, "TURRET_9"),
    createBlock(-1,  1, "TURRET_9"),
    createBlock( 1,  1, "TURRET_9"),
    createBlock( 2,  1, "TURRET_9"),
    makeThruster(-2, -1, true, 13),
    makeThruster( 0, -1),
    makeThruster( 2, -1, true, 13),
  ];
}

// ENEMY_STALKER — agile flanker: wide spread, 3 turrets, 2 fast gimballed thrusters
// Layout (y↑):
//   [T9]   [T9]   [T9]
//   [B9][B9][C][B9][B9]
//       [THR]   [THR]
function buildEnemyStalker() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_9"),
    createBlock( 1,  0, "BLOCK_9"),
    createBlock(-2,  0, "BLOCK_9"),
    createBlock( 2,  0, "BLOCK_9"),
    createBlock(-2,  1, "TURRET_9"),
    createBlock( 0,  1, "TURRET_9"),
    createBlock( 2,  1, "TURRET_9"),
    makeThruster(-1, -1, true, 14),
    makeThruster( 1, -1, true, 14),
  ];
}

// ENEMY_SCOUT — swift interceptor: 1 turret, 1 center thruster
// Layout (y↑):
//      [T1]
//   [B1][C][B1]
//      [THR]
function buildEnemyScout() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_1"),
    createBlock( 1,  0, "BLOCK_1"),
    createBlock( 0,  1, "TURRET_1"),
    makeThruster( 0, -1),
  ];
}

// ENEMY_FIGHTER — standard combatant: 2 flanking turrets, 2 thrusters
// Layout (y↑):
//   [T3]   [T3]
//   [B3][C][B3]
//   [THR]   [THR]
function buildEnemyFighter() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_3"),
    createBlock( 1,  0, "BLOCK_3"),
    createBlock(-1,  1, "TURRET_3"),
    createBlock( 1,  1, "TURRET_3"),
    makeThruster(-1, -1, true, 10),
    makeThruster( 1, -1, true, 10),
  ];
}

// ENEMY_GUNSHIP — heavy strike craft: wide wing span, 3 turrets, 4 thrusters
// Layout (y↑):
//            [T6]
//   [T6][B5][B5][C][B5][B5][T6]
//        [B5]         [B5]
//       [THR][THR]   [THR][THR]
function buildEnemyGunship() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_5"),
    createBlock( 1,  0, "BLOCK_5"),
    createBlock(-2,  0, "BLOCK_5"),
    createBlock( 2,  0, "BLOCK_5"),
    createBlock( 0,  1, "BLOCK_5"),
    createBlock( 0,  2, "TURRET_6"),
    createBlock(-2,  1, "TURRET_6"),
    createBlock( 2,  1, "TURRET_6"),
    createBlock(-1, -1, "BLOCK_5"),
    createBlock( 1, -1, "BLOCK_5"),
    makeThruster(-2, -1, true, 12),
    makeThruster( 2, -1, true, 12),
    makeThruster(-1, -2),
    makeThruster( 1, -2),
  ];
}

// ENEMY_DESTROYER — battle cruiser: broad armored hull, 3 front turrets, 4 thrusters
// Layout (y↑):
//   [T8][B7][T8][B7][T8]
//   [B7][B7][C][B7][B7]
//      [B7][B7][B7]
//     [THR]   [THR]
//     [THR]   [THR]
function buildEnemyDestroyer() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_7"),
    createBlock( 1,  0, "BLOCK_7"),
    createBlock(-2,  0, "BLOCK_7"),
    createBlock( 2,  0, "BLOCK_7"),
    createBlock(-1,  1, "BLOCK_7"),
    createBlock( 0,  1, "BLOCK_7"),
    createBlock( 1,  1, "BLOCK_7"),
    createBlock(-2,  1, "BLOCK_7"),
    createBlock( 2,  1, "BLOCK_7"),
    createBlock(-1, -1, "BLOCK_7"),
    createBlock( 0, -1, "BLOCK_7"),
    createBlock( 1, -1, "BLOCK_7"),
    createBlock(-2,  2, "TURRET_8"),
    createBlock( 0,  2, "TURRET_8"),
    createBlock( 2,  2, "TURRET_8"),
    makeThruster(-2, -1, true, 15),
    makeThruster( 2, -1, true, 15),
    makeThruster(-1, -2),
    makeThruster( 1, -2),
  ];
}

// ENEMY_RAIDER — fast flanker: 2 turrets, 2 gimballed thrusters
// Layout (y↑):
//   [T4][T4]
//   [B4][C][B4]
//   [THR]   [THR]
function buildEnemyRaider() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_4"),
    createBlock( 1,  0, "BLOCK_4"),
    createBlock( 0,  1, "TURRET_4"),
    createBlock(-1,  1, "TURRET_4"),
    makeThruster(-1, -1, true, 14),
    makeThruster( 1, -1, true, 14),
  ];
}

// ENEMY_INTERCEPTOR — high-speed pursuit craft: forward double-turret, 2 gimballed thrusters
// Layout (y↑):
//      [T10]
//      [T10]
//   [B10][C][B10]
//   [THR]   [THR]
function buildEnemyInterceptor() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_10"),
    createBlock( 1,  0, "BLOCK_10"),
    createBlock( 0,  1, "TURRET_10"),
    createBlock( 0,  2, "TURRET_10"),
    makeThruster(-1, -1, true, 15),
    makeThruster( 1, -1, true, 15),
  ];
}

// ENEMY_RAMMER — armored battering ram: dense block tower, 2 gimballed thrusters
// Layout (y↑):
//      [B8]
//   [B8][B8][B8]
//   [B8][C][B8]
//   [THR]   [THR]
function buildEnemyRammer() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_8"),
    createBlock( 1,  0, "BLOCK_8"),
    createBlock( 0,  1, "BLOCK_8"),
    createBlock(-1,  1, "BLOCK_8"),
    createBlock( 1,  1, "BLOCK_8"),
    createBlock( 0,  2, "BLOCK_8"),
    makeThruster(-1, -1, true, 15),
    makeThruster( 1, -1, true, 15),
  ];
}

// ENEMY_BOMBER — slow heavy bomber: wide wings, 5 turrets, 2 rear thrusters
// Layout (y↑):
//   [T][T12][T]
//   [T11][B11][B11][C][B11][B11][T11]
//             [B11]   [B11]
//             [THR]   [THR]
function buildEnemyBomber() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_11"),
    createBlock( 1,  0, "BLOCK_11"),
    createBlock(-2,  0, "BLOCK_11"),
    createBlock( 2,  0, "BLOCK_11"),
    createBlock(-1, -1, "BLOCK_11"),
    createBlock( 1, -1, "BLOCK_11"),
    createBlock(-3,  0, "TURRET_11"),
    createBlock( 3,  0, "TURRET_11"),
    createBlock(-1,  1, "TURRET_12"),
    createBlock( 0,  1, "TURRET_12"),
    createBlock( 1,  1, "TURRET_12"),
    makeThruster(-1, -2),
    makeThruster( 1, -2),
  ];
}

// ENEMY_DREADNOUGHT — flagship: massive armored hull, 5 turrets, 5 thrusters
// Layout (y↑):
//   [T15]   [T15][T15][T15]   [T15]
//   [B15][B15][B15][C][B15][B15][B15]
//        [B15][B15] [B15][B15]
//        [THR]       [THR]
//   [THR]     [THR]     [THR]
function buildEnemyDreadnought() {
  const core = createBlock(0, 0, "CORE");
  core.isRemovable = false;
  return [
    core,
    createBlock(-1,  0, "BLOCK_15"),
    createBlock( 1,  0, "BLOCK_15"),
    createBlock(-2,  0, "BLOCK_15"),
    createBlock( 2,  0, "BLOCK_15"),
    createBlock(-3,  0, "BLOCK_15"),
    createBlock( 3,  0, "BLOCK_15"),
    createBlock(-1,  1, "BLOCK_15"),
    createBlock( 0,  1, "BLOCK_15"),
    createBlock( 1,  1, "BLOCK_15"),
    createBlock(-2,  1, "BLOCK_15"),
    createBlock( 2,  1, "BLOCK_15"),
    createBlock(-1, -1, "BLOCK_15"),
    createBlock( 0, -1, "BLOCK_15"),
    createBlock( 1, -1, "BLOCK_15"),
    createBlock(-3,  1, "TURRET_15"),
    createBlock(-1,  2, "TURRET_15"),
    createBlock( 0,  2, "TURRET_15"),
    createBlock( 1,  2, "TURRET_15"),
    createBlock( 3,  1, "TURRET_15"),
    makeThruster(-3, -1, true, 15),
    makeThruster( 3, -1, true, 15),
    makeThruster(-1, -2),
    makeThruster( 0, -2),
    makeThruster( 1, -2),
  ];
}

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

export const MODELFACTORY = {
  PLAYER:               () => new Model(PLAYER),
  SCOUT1:               () => new Model(SCOUT1),
  SCOUT2:               () => new Model(SCOUT2),
  DEBUG_MODEL:          () => new Model(DEBUG_MODEL),
  ENEMY_DART:           () => new Model(buildEnemyDart()),
  ENEMY_SENTINEL:       () => new Model(buildEnemySentinel()),
  ENEMY_SKIFF:          () => new Model(buildEnemySkiff()),
  ENEMY_SCOUT:          () => new Model(buildEnemyScout()),
  ENEMY_FIGHTER:        () => new Model(buildEnemyFighter()),
  ENEMY_CORVETTE:       () => new Model(buildEnemyCorvette()),
  ENEMY_LANCER:         () => new Model(buildEnemyLancer()),
  ENEMY_RAIDER:         () => new Model(buildEnemyRaider()),
  ENEMY_INTERCEPTOR:    () => new Model(buildEnemyInterceptor()),
  ENEMY_RAMMER:         () => new Model(buildEnemyRammer()),
  ENEMY_GUNSHIP:        () => new Model(buildEnemyGunship()),
  ENEMY_CRUISER:        () => new Model(buildEnemyCruiser()),
  ENEMY_STALKER:        () => new Model(buildEnemyStalker()),
  ENEMY_DESTROYER:      () => new Model(buildEnemyDestroyer()),
  ENEMY_BOMBER:         () => new Model(buildEnemyBomber()),
  ENEMY_DREADNOUGHT:    () => new Model(buildEnemyDreadnought()),
}

export default MODELS;
