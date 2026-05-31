/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Grid.js
 * Szerep: Epitesi racs kirajzolasat es koordinata-segedmuveleteit kezelo osztaly.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";
import * as vec3 from "/common/vec3.js";
import CollisionCollection from "/game/CollisionCollection.js";

export default class Grid {
  static TO_CELL(n, cellSize) {
    // Vilagkoordinatabol kiszamolja, melyik racscellaba esik az adott pont.
    return Math.floor(n / cellSize);
  }

  static GET_KEY(x, y) {
    // A cellak kulcsa string, hogy konnyen lehessen oket Map-ben tarolni.
    return `${x},${y}`;
  }

  static CELL = class {
    constructor() {
      this.objects = [];
      this.idle = 0;
    }

    reset(dt) {
      // Uj broad-phase kor elott uritjuk a cellat, es kozben szamoljuk, mióta nem hasznalta senki.
      this.objects.length = 0;
      this.idle += dt;
    }
  };

  constructor(game, cellSize, cellIdleTimeout = 30) {
    // A grid a broad-phase gyorsitasaert felel: csak az egy cellaba eso objektumpárokat kuldi tovabb reszletes utkozesvizsgalatra.
    this.game = game;
    this.cells = new Map();
    this.cellSize = cellSize;
    this.cellIdleTimeout = cellIdleTimeout; // seconds
    this.collector = new CollisionCollection(game);
  }

  reset() {
    // A reg nem hasznalt cellakat teljesen eldobjuk, hogy a Map ne nojon vegtelenre jatek kozben.
    for (const key of this.cells.keys()) {
      const cell = this.cells.get(key);

      cell.reset(this.game.fdt);

      if (cell.idle >= this.cellIdleTimeout) {
        this.cells.delete(key);
      }
    }
  }

  build() {
    // Itt kerulnek be az aktiv objektumok a megfelelo cellakba a proxy collider sajat register logikajan keresztul.
    for (const object of this.game.objects.objects) {
      object.proxyCollider.validate();
      object.proxyCollider.register();
    }
  }

  filter() {
    // A broad-phase eredmenye egy CollisionCollection lesz, amely mar csak az igazan erdemes objektumpárokat tartalmazza.
    this.collector.reset();

    this.reset();
    this.build();

    const seenPairs = new Set();

    for (const { objects } of this.cells.values()) {
      const l = objects.length;

      for (let i = 0; i < l; i++) {
        for (let j = i + 1; j < l; j++) {
          let a = objects[i];
          let b = objects[j];

          // Ugyanaz az objektumpár tobb szomszedos cellaban is felbukkanhat, ezert kulccsal kiszurjuk a duplikaciot.
          const pairKey = (Math.min(a.id, b.id) << 16) | Math.max(a.id, b.id);

          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          if (a.proxyCollider.intersects(b)) {
            const passA = a.onBroadCollision(b);
            const passB = b.onBroadCollision(a);

            passA && passB && this.collector.add([a, b]);
          }
        }
      }
    }

    return this.collector;
  }

  // prettier-ignore
  debug() {
    // A debug overlayre kirajzolja az aktiv cellakat, bennuk az objektumdarabszamot es az idle idot is.
    const g = this.game, b = g.buffer, d = g.debugOverlay;
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

      d.drawBox(x, y, size, size, "red", 6);
      d.drawText(x, y, `cell: (${key}), objects: ${cell.objects.length}, idle: ${cell.idle.toFixed(1)}`, "20px Jersey", "red");
    }
  }
}
