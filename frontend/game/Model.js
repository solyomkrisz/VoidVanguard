import Block from "./Block.js";
import Shape from "./Shape.js";
import * as vec from "../common/vec.js";

export default class Model {
  static COPY_MODE = Object.freeze({
    COPY: 0,
    PRESERVE: 1 << 0,
  });

  // prettier-ignore
  constructor(objects, mode = Model.COPY_MODE.COPY) {
    this.parent = null;

    if (mode === Model.COPY_MODE.PRESERVE) {

      this.objects = objects;

    } else if (mode === Model.COPY_MODE.COPY) {

      this.objects = [];
      for (const object of objects) {
        this.objects.push(Object.assign(Object.create(Object.getPrototypeOf(object)), object));
      }
      
    } else {

      throw new Error("MODEL-constructor: Invalid mode!");

    }
  }

  exportSave() {
    const objects = [];

    for (const object of this.objects) {
      objects.push(object.exportSave());
    }

    return { objects };
  }

  from(savedState) {
    if (!this.parent) {
      throw new Error(
        "Unable to restore model from save: no parent is provided",
      );
    }

    for (const object of savedState.objects) {
      this.add(
        this.parent,
        new Block({
          x: object.localPosition[0],
          y: object.localPosition[1],
          shape: new Shape(
            object.shape.mergeable,
            object.shape.mergeModeRequest,
            ...object.shape.vertices,
          ),
          spriteID: object.spriteID,
          gradeID: object.gradeID,
          mass: object.mass,
          health: object.health,
          adjacencyRules: vec.clone(object.adjacencyRules),
        }),
      );
    }

    this.setupBlockOrientations();
  }

  init(parent) {
    if (!parent) {
      throw new Error(
        "MODEL-init: Couldn't initialize model (no parent is provided)!",
      );
    }

    this.parent = parent;

    this.objects.forEach((object) => object.onInsert(this.parent));
    this.setupBlockOrientations();

    return this;
  }

  /**
   * For each block, finds the best adjacent neighbor and sets defaultTextureRotation
   * so the block faces away from it (connector side toward neighbor).
   * Prefers special neighbors (turrets, thrusters) over regular grade blocks.
   * Called after the full model is built/loaded so all positions are known.
   */
  setupBlockOrientations() {
    const GRADE_BLOCK_MIN = 2;  // SpriteID.BLOCK_0
    const GRADE_BLOCK_MAX = 16; // SpriteID.BLOCK_14

    const isGradeBlock = (obj) => {
      const id = obj.connectedSpriteID ?? obj.spriteID;
      return id >= GRADE_BLOCK_MIN && id <= GRADE_BLOCK_MAX;
    };

    for (const obj of this.objects) {
      if (typeof obj.defaultTextureRotation === "undefined") continue;
      // Only auto-orient if no rotation was already explicitly set
      if (obj.defaultTextureRotation !== 0) continue;

      let bestNeighbor = null;

      for (const neighbor of this.objects) {
        if (neighbor === obj) continue;
        const dx = neighbor.localPosition[0] - obj.localPosition[0];
        const dy = neighbor.localPosition[1] - obj.localPosition[1];
        if (Math.abs(dx) + Math.abs(dy) !== 1) continue;

        // Prefer special blocks soo thrusters/turrets over grade blocks
        if (!bestNeighbor || (!isGradeBlock(neighbor) && isGradeBlock(bestNeighbor))) {
          bestNeighbor = neighbor;
        }
      }

      if (bestNeighbor) {
        const dx = bestNeighbor.localPosition[0] - obj.localPosition[0];
        const dy = bestNeighbor.localPosition[1] - obj.localPosition[1];
        obj.defaultTextureRotation = Math.atan2(-dx, -dy);
      }
    }
  }

  clear() {
    let writeIndex = 0;
    let geometryChanged = false;

    for (const object of this.objects) {
      if (object.health <= 0 || object.toRemove) {
        object.onRemove(this.parent);
        geometryChanged = true;
        continue;
      }

      this.objects[writeIndex++] = object;
    }

    this.objects.length = writeIndex;

    return geometryChanged;
  }

  reset() {
    this.objects.forEach((object) => object.onRemove(this.parent));
    this.objects.length = 0;
  }

  add(parent, object) {
    object.onInsert(parent);
    this.objects.push(object);
  }
}
