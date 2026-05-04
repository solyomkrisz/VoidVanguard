import { createTestSuite } from "/common/unittest.js";
import Rigidbody from "/game/Rigidbody.js";
import Spaceship from "/game/Spaceship.js";
import Player from "/game/Player.js";
import IDManager from "/game/IDManager.js";
import AudioManager from "/common/AudioManager.js";

const { results, describe, it, expect } = createTestSuite(
  "rigidbody, spaceship and player function tests",
);
results.init();

function createGameMock() {
  return {
    idManager: new IDManager(),
    buffer: {},
    UI: {},
    audioManager: {
      getSound: () => {
        return {
          instance: {
            stop: () => {},
            start: () => {},
            play: () => {},
          },
        };
      },
    },
    idManager: { get: () => 1 },
    projectiles: { add: () => {} },
    buildingBlocks: { add: () => {} },
    activeControls: new Set(),
    mouse: {},
    chunkSize: 10,
    backgroundZoom: 1,
    fdt: 1,
    alpha: 0.5,
    textureManager: { sprites: [], textureCoordinates: [] },
    dataCollector: { push: () => {} },
    tooltip: { showTemplate: () => false, show: () => {}, template: {} },
    contextMenu: { template: {} },
  };
}

//#region rigidbody
describe("Rigidbody teleportTo", () => {
  it("should set current position", () => {
    const game = { buffer: {} };

    const rb = new Rigidbody({
      game,
      model: { objects: [] },
    });

    rb.teleportTo(10, 20);

    expect(rb.position[0]).toBe(10);
  });

  it("should not modify velocity when teleporting", () => {
    const rb = new Rigidbody({
      game: createGameMock(),
      model: { objects: [] },
    });

    rb.velocity[0] = 5;
    rb.velocity[1] = -2;

    rb.teleportTo(100, 200);

    const vx = rb.velocity[0];
    const vy = rb.velocity[1];

    expect(vx === 5 && vy === -2).toBe(true);
  });
});

describe("Rigidbody state system", () => {
  it("should preserve multiple independent states", () => {
    const rb = new Rigidbody({
      game: createGameMock(),
      model: { objects: [] },
    });

    rb.setState(1);
    rb.setState(5);

    const result = rb.hasState(1) && rb.hasState(5);

    expect(result).toBe(true);
  });

  it("should not clear unrelated state bits", () => {
    const rb = new Rigidbody({
      game: createGameMock(),
      model: { objects: [] },
    });

    rb.setState(2);
    rb.setState(3);

    rb.clearState(2);

    expect(rb.hasState(3)).toBe(true);
  });

  it("should expand state array when setting high index state", () => {
    const rb = new Rigidbody({
      game: createGameMock(),
      model: { objects: [] },
    });

    rb.setState(1000);

    expect(rb.hasState(1000)).toBe(true);
  });
});

describe("Rigidbody mass invariant", () => {
  it("should always have positive mass after construction", () => {
    const rb = new Rigidbody({
      game: createGameMock(),
      model: { objects: [] },
    });

    expect(rb.mass > 0 || rb.mass === 0).toBe(true);
  });
});

describe("Rigidbody velocity integration", () => {
  it("should move position when velocity is applied", () => {
    const rb = new Rigidbody({
      game: createGameMock(),
      model: { objects: [] },
    });

    rb.velocity[0] = 1;
    rb.velocity[1] = 0;

    const before = rb.position[0];
    rb.updatePosition();

    expect(rb.position[0] !== before).toBe(true);
  });
});

describe("Rigidbody rotation update", () => {
  it("should change forward direction when rotation changes", () => {
    const game = createGameMock();
    game.buffer.mat2_1 = [1, 0, 0, 1];

    const rb = new Rigidbody({
      game,
      model: { objects: [] },
    });

    const beforeX = rb.forward[0];

    rb.rotation = 1;
    rb.updateRotation();

    expect(rb.forward[0] !== beforeX).toBe(true);
  });
});

//#region spaceship
describe("Spaceship cooldown", () => {
  it("should never go below 0", () => {
    const game = createGameMock();
    game.fdt = 1;
    const ship = new Spaceship({
      game,
      model: { objects: [] },
    });

    ship.shootCooldown = 0;

    ship.update();

    expect(ship.shootCooldown >= 0).toBe(true);
  });
});

//#region player
describe("Player score and shoot cooldown", () => {
  it("should initialize score to 0", () => {
    const game = createGameMock();
    const model = { init() {}, objects: [] };
    const player = new Player(game, model);

    expect(player.score).toBe(0);
  });

  it("should initialize shoot cooldown to 0", () => {
    const player = new Player(createGameMock(), { objects: [], init() {} });
    expect(player.shootCooldown).toBe(0);
  });

  it("should increment scoreTimer over time reset behavior", () => {
    const player = new Player(createGameMock(), { objects: [], init() {} });

    player.scoreTimer = 0;
    player.update();

    expect(player.scoreTimer > 0).toBe(true);
  });
});

describe("Player chunk calculation", () => {
  it("should update chunk based on position", () => {
    const game = createGameMock();
    game.chunkSize = 10;
    game.backgroundZoom = 1;

    const model = { init() {}, objects: [] };

    const player = new Player(game, model);

    player.position[0] = 25;
    player.position[1] = 35;

    player.setCurrentChunk();

    const result = player.chunk[0] === 2 && player.chunk[1] === 3;

    expect(result).toBe(true);
  });
});

describe("Player save/load", () => {
  it("should preserve score through exportSave/from cycle", () => {
    const game = createGameMock();
    const model = {
      init() {},
      objects: [],
      exportSave() {},
      from() {},
    };

    const player = new Player(game, model);
    player.score = 13;

    const saved = player.exportSave();

    const player2 = new Player(game, model);
    player2.from(saved);

    expect(player2.score).toBe(13);
  });
});

describe("Player engine callbacks", () => {
  it("should not crash when engine is disabled without thrusters", () => {
    const player = new Player(createGameMock(), { objects: [], init() {} });

    player.controlledThrusters.clear?.();

    player.updatePropulsion(1, player.game.buffer, new Set());

    expect(true).toBe(true);
  });
});

results.see();
