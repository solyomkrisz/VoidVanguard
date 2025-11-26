import * as vec2 from "../common/vec2.js";
import * as vec3 from "../common/vec3.js";
import PotentialPairs from "./PotentialPairs.js";

export default class Grid {
  static TO_CELL(n, cellSize) {
    return Math.floor(n / cellSize);
  }

  static GET_KEY(x, y) {
    return `${x},${y}`;
  }

  static CELL = class {
    constructor() {
      this.objects = [];
      this.idle = 0;
    }

    reset(dt) {
      this.objects.length = 0;
      this.idle += dt;
    }
  };

  constructor(cellSize, cellIdleTimeout = 30) {
    this.cells = new Map();
    this.cellSize = cellSize;
    this.cellIdleTimeout = cellIdleTimeout; // seconds
    this.collector = new PotentialPairs();
  }

  reset(dt) {
    for (const key of this.cells.keys()) {
      const cell = this.cells.get(key);

      cell.reset(dt);

      if (cell.idle >= this.cellIdleTimeout) {
        this.cells.delete(key);
      }
    }
  }

  build(objects) {
    for (const object of objects) {
      object.proxyCollider.validate(this.cellSize);
      object.proxyCollider.register(this);
    }
  }

  filter(game, dt, objects) {
    this.collector.reset();

    this.reset(dt);
    this.build(objects);

    const seenPairs = new Set();

    for (const { objects } of this.cells.values()) {
      const l = objects.length;

      for (let i = 0; i < l; i++) {
        for (let j = i + 1; j < l; j++) {
          let a = objects[i];
          let b = objects[j];

          const pairKey = (Math.min(a.id, b.id) << 16) | Math.max(a.id, b.id);

          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          if (a.proxyCollider.intersects(b)) {
            const passA = a.onBroadCollision(game, b);
            const passB = b.onBroadCollision(game, a);

            passA && passB && this.collector.add([a, b]);
          }
        }
      }
    }

    return this.collector;
  }

  // prettier-ignore
  debug(game) {
    const g = game, b = g.buffer, d = g.debugOverlay;
    const size = this.cellSize * 0.5 * g.cameraMatrix[0] * g.canvas.width;

    for (const [key, cell] of this.cells.entries()) {
      const position = vec2.copy(b.vec2_1, key.split(",").map((i) => Number(i)));
      vec2.scale(position, position, this.cellSize);
      position[0] += this.cellSize / 2;
      position[1] += this.cellSize / 2;
      const worldSpace = vec2.toVec3(b.vec3_1, position);
      const [csx, csy] = vec3.toVec2(b.vec2_1, vec3.transformMat3Into(worldSpace, g.cameraMatrix, worldSpace));

      const x = (csx + 1) * 0.5 * g.canvas.width;
      const y = (1 - csy) * 0.5 * g.canvas.height;

      d.drawBox(x, y, size, size, "red");
      d.drawText(x, y, `cell: (${key}), objects: ${cell.objects.length}, idle: ${cell.idle.toFixed(1)}`, "20px Arial", "red");
    }
  }
}
