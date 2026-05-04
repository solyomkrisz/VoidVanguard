import Block from "/game/Block.js";
import { SpriteID } from "/game/texture/Texture.js";
import Shape from "/game/Shape.js";
import * as vec from "/common/vec.js";

// #region SHAPE COLLIDERS
// BLOCK COLLIDERS

// (BASE BLOCK) RECTANGLE COLLIDER
const RECTCOLLIDER = new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5);

// SMALL RECTANGLE COLLIDER
const S_RECTCOLLIDER = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.15, 0.15, 0.15, 0.15, 0.15, -0.15, -0.15, -0.15);

// THRUSTER COLLIDER (full top height, trimmed bottom)
const THRUSTER_COLLIDER = new Shape(true, Shape.MERGE_MODE.AABB, -0.5, 0.5, 0.5, 0.5, 0.5, -0.35, -0.5, -0.35);

// TURRET COLLIDERS
const N1_TURRET_COLLIDER = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.1, 0, 0.1, 0, 0.15, -0.5, -0.15, -0.5); // TURRET
const N2_TURRET_COLLIDER = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.1, 0.25, 0.1, 0.25, 0.15, -0.5, -0.15, -0.5); // TALLER TURRET
const N3_TURRET_COLLIDER = new Shape(false, Shape.MERGE_MODE.KEEP_ALL, -0.1, 0.375, 0.1, 0.375, 0.15, -0.5, -0.15, -0.5); // TALLEST TURRET


// FŐLEG ANYAGSŰRŰSÉG ALAPJÁN SZÁMOLT TÖMEGÉRTÉKEK (kg/dm³)
const MASS_VALUES = Object.freeze({
  MASS_1: 1, // - Alumínium                 - Grade 1
  MASS_2: 0.3, // - Magnéziumötvözet          - Grade 2
  MASS_3: 1.05, // - Alumíniumötvözet (6061)   - Grade 3
  MASS_4: 2.75, // - Rozsdamentes acél         - Grade 4
  MASS_5: 3.05, // - Nikkelötvözet             - Grade 5
  MASS_6: 1.65, // - Titánötvözet (Ti-6Al-4V)  - Grade 6
  MASS_7: 0.85, // - Üvegszálas kompozit       - Grade 7
  MASS_8: 0.5, // - Karbonkompozit (CFRP)     - Grade 8
  MASS_9: 0.7, // - Kevlar (aramid)           - Grade 9
  MASS_10: 3.15, // - Inconel                   - Grade 10
  MASS_11: 0.325, // - Berillium                 - Grade 11
  MASS_12: 1.2, // - Bór-karbid (B₄C)          - Grade 12
  MASS_13: 1.3, // - Szilícium-karbid (SiC)    - Grade 13
  MASS_14: 0.85, // - Fejlett karbon-kerámia kompozit   - Grade 14
  MASS_15: 1.15, // - Titán–kompozit hibrid szerkezet   - Grade 15 (Csúcstechnológia)
});

// FŐLEG (SZAKITÓSZILÁRDSÁG x TÖMEG ARÁNY + ÉRTÉK-BALANCE) ALAPJÁN
const HEALTH_VALUES = Object.freeze({
  HEALTH_1: 200, // - Alumínium                - Grade 1 - Kezdő, alap
  HEALTH_2: 105, // - Magnéziumötvözet         - Grade 2 - Ultralight, high skill
  HEALTH_3: 290, // - Alumíniumötvözet (6061)  - Grade 3 - Erősebb mint az alumínium
  HEALTH_4: 1500, // - Rozsdamentes acél        - Grade 4 - Nehéz, tankos
  HEALTH_5: 2250, // - Nikkelötvözet            - Grade 5 - Egyik legtankosabb earlygame anyag
  HEALTH_6: 1500, // - Titánötvözet (Ti-6Al-4V) - Grade 6 - Legjobb HP/tömeg arány alapján
  HEALTH_7: 750, // - Üvegszálas kompozit      - Grade 7 - Gyors + közepes HP
  HEALTH_8: 500, // - Karbonkompozit (CFRP)    - Grade 8 - Ultralight, midgame
  HEALTH_9: 1000, // - Kevlar (aramid)          - Grade 9 - Egyik legjobb HP/tömeg arány
  HEALTH_10: 6500, // - Inconel                  - Grade 10 - Legnehezebb anyag + Legtöbb HP -> Kritikus védelem
  HEALTH_11: 750, // - Berillium                - Grade 11 - Ultralight, high skill, endgame
  HEALTH_12: 2250, // - Bór-karbid (B₄C)         - Grade 12 - Közepes tömeg + közepes HP
  HEALTH_13: 3000, // - Szilícium-karbid (SiC)   - Grade 13 - Közepes tömeg + magas HP
  HEALTH_14: 2650, // - Fejlett karbon-kerámia kompozit   - Grade 14 - Gyors + magas HP
  HEALTH_15: 4250, // - Titán–kompozit hibrid szerkezet   - Grade 15 (Csúcstechnológia) Közepes tömeg + nagyon magas HP
});
// Helper function to generate block type variants for all 15 grades
// factorok h a masst mennyivel szorozza be (regen kelett a haromszogek miatt 1 helyett 0.5)
function generateBlockVariants(
  baseName,
  shape,
  spriteIDBase,
  massFactor = 1,
  healthFactor = 1,
) {
  const variants = {};
  const spriteIDs = [
    SpriteID.BLOCK_0,
    SpriteID.BLOCK_1,
    SpriteID.BLOCK_2,
    SpriteID.BLOCK_3,
    SpriteID.BLOCK_4,
    SpriteID.BLOCK_5,
    SpriteID.BLOCK_6,
    SpriteID.BLOCK_7,
    SpriteID.BLOCK_8,
    SpriteID.BLOCK_9,
    SpriteID.BLOCK_10,
    SpriteID.BLOCK_11,
    SpriteID.BLOCK_12,
    SpriteID.BLOCK_13,
    SpriteID.BLOCK_14,
  ];

  for (let i = 1; i <= 15; i++) {
    const gradeIndex = i - 1;
    variants[`${baseName}_${i}`] = {
      shape,
      spriteID: spriteIDs[gradeIndex],
      mass: MASS_VALUES[`MASS_${i}`] * massFactor,
      gradeID: gradeIndex,
      health: HEALTH_VALUES[`HEALTH_${i}`] * healthFactor,
    };
  }
  return variants;
}

// Define all turret types - these will have their own unique textures and stats
// bulletDamage: 10 + grade*10  (range 20–160)
// bulletSpeed:  18 + grade*2.2 (range 18–48.8)
// shootCooldown: 0.45 - grade*0.02 (range 0.45–0.17, i.e. much faster at higher grade)
// bulletRange:  14 + grade*2.0 (range 14–42, higher grade travels further)
const TURRET_TYPES = {
  // Standard Turrets
  TURRET_1: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET,
    mass: 0.5,
    gradeID: 0,
    health: 100,
    isTurret: true,
    bulletDamage: 20,
    bulletSpeed: 4.4,
    shootCooldown: 1,
  },
  TURRET_2: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET2,
    mass: 0.7,
    gradeID: 1,
    health: 150,
    isTurret: true,
    bulletDamage: 30,
    bulletSpeed: 4.8,
    shootCooldown: 0.95,
  },
  TURRET_3: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET3,
    mass: 1.0,
    gradeID: 2,
    health: 200,
    isTurret: true,
    bulletDamage: 40,
    bulletSpeed: 5.2,
    shootCooldown: 0.9,
  },
  TURRET_4: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET4,
    mass: 0.6,
    gradeID: 3,
    health: 120,
    isTurret: true,
    bulletDamage: 50,
    bulletSpeed: 5.6,
    shootCooldown: 0.85,
  },
  TURRET_5: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET5,
    mass: 0.8,
    gradeID: 4,
    health: 170,
    isTurret: true,
    bulletDamage: 60,
    bulletSpeed: 6.0,
    shootCooldown: 0.8,
  },
  TURRET_6: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET6,
    mass: 1.1,
    gradeID: 5,
    health: 220,
    isTurret: true,
    bulletDamage: 70,
    bulletSpeed: 6.4,
    shootCooldown: 0.75,
  },
  TURRET_7: {
    shape: N1_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET7,
    mass: 0.7,
    gradeID: 6,
    health: 140,
    isTurret: true,
    bulletDamage: 80,
    bulletSpeed: 6.8,
    shootCooldown: 0.7,
  },
  TURRET_8: {
    shape: N2_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET8,
    mass: 0.9,
    gradeID: 7,
    health: 190,
    isTurret: true,
    bulletDamage: 90,
    bulletSpeed: 7.2,
    shootCooldown: 0.65,
  },
  TURRET_9: {
    shape: N2_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET9,
    mass: 1.2,
    gradeID: 8,
    health: 240,
    isTurret: true,
    bulletDamage: 100,
    bulletSpeed: 7.6,
    shootCooldown: 0.6,
  },
  TURRET_10: {
    shape: N2_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET10,
    mass: 0.55,
    gradeID: 9,
    health: 110,
    isTurret: true,
    bulletDamage: 110,
    bulletSpeed: 8.0,
    shootCooldown: 0.55,
  },
  TURRET_11: {
    shape: N2_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET11,
    mass: 0.75,
    gradeID: 10,
    health: 160,
    isTurret: true,
    bulletDamage: 120,
    bulletSpeed: 8.4,
    shootCooldown: 0.5,
  },
  TURRET_12: {
    shape: N3_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET12,
    mass: 1.05,
    gradeID: 11,
    health: 210,
    isTurret: true,
    bulletDamage: 130,
    bulletSpeed: 8.8,
    shootCooldown: 0.45,
  },
  TURRET_13: {
    shape: N3_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET13,
    mass: 0.55,
    gradeID: 12,
    health: 110,
    isTurret: true,
    bulletDamage: 140,
    bulletSpeed: 9.2,
    shootCooldown: 0.4,
  },
  TURRET_14: {
    shape: N3_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET14,
    mass: 0.75,
    gradeID: 13,
    health: 160,
    isTurret: true,
    bulletDamage: 150,
    bulletSpeed: 9.6,
    shootCooldown: 0.35,
  },
  TURRET_15: {
    shape: N3_TURRET_COLLIDER,
    spriteID: SpriteID.TURRET15,
    mass: 1.05,
    gradeID: 14,
    health: 210,
    isTurret: true,
    bulletDamage: 160,
    bulletSpeed: 10.0,
    shootCooldown: 0.3,
  },
};

for (const turret of Object.values(TURRET_TYPES)) {
  turret.adjacencyRules = vec.fromValues(99, 99);
  turret.bulletSpeed = 18 + turret.gradeID * 2.2;
  turret.shootCooldown = Math.max(0.17, 0.45 - turret.gradeID * 0.02);
  turret.bulletRange = (14 + turret.gradeID * 2.0) / 2;
  turret.health *= 3;
}

const BLOCK_TYPES = {
  // Rectangle blocks (full mass/health)
  ...generateBlockVariants("BLOCK", RECTCOLLIDER, SpriteID.BLOCK, 1, 1),

  // Turret blocks
  ...TURRET_TYPES,

  // Thruster block - propulsion attachment
  THRUSTER: {
    shape: THRUSTER_COLLIDER,
    spriteID: SpriteID.THRUSTER,
    mass: 1.2,
    gradeID: 0,
    health: 300,
    adjacencyRules: vec.fromValues(99, 99),
    isThruster: true,
  },

  // Core block - the non-removable center of every ship
  CORE: {
    shape: RECTCOLLIDER,
    spriteID: SpriteID.CORE,
    mass: 2.0,
    gradeID: 0,
    health: 1000,
  },
};

export function createBlock(x, y, typeKey, overrides = {}) {
  const type = BLOCK_TYPES[typeKey];
  if (!type) {
    throw new Error(
      `BlockTypes.createBlock: Unknown block type '${typeKey}'. Available types: ${Object.keys(BLOCK_TYPES).join(", ")}`,
    );
  }
  const config = { ...type, ...overrides };
  return new Block({ x, y, ...config });
}

export { BLOCK_TYPES, TURRET_TYPES };
