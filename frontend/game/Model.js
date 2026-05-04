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
    this.onBlockDestroyed = null;

    if (mode === Model.COPY_MODE.PRESERVE) {

      this.objects = objects;

    } else if (mode === Model.COPY_MODE.COPY) {

      this.objects = [];
      for (const object of objects) {

        if (typeof object.clone === "function") {
          this.objects.push(object.clone(object));

        } else {
          this.objects.push(Object.assign(Object.create(Object.getPrototypeOf(object)), object));
        }

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
      const block = new Block({
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
      });
      block.isRemovable = object.isRemovable ?? true;
      this.add(this.parent, block);
    }
  }

  init(parent) {
    if (!parent) {
      throw new Error(
        "MODEL-init: Couldn't initialize model (no parent is provided)!",
      );
    }

    this.parent = parent;

    this.objects.forEach((object) => object.onInsert(this.parent));

    return this;
  }

  clear() {
    let writeIndex = 0;
    let geometryChanged = false;

    for (const object of this.objects) {
      if (object.health <= 0 || object.toRemove) {
        this.onBlockDestroyed?.(object);
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

  // prettier-ignore
  applyTextureRotations(textureManager) {
    const sprites = textureManager?.sprites;
    if (!sprites) return;

    for (const object of this.objects) {
      if (object.spriteID === null) continue;
      if (object.textureRotation.size > 0) continue; // already restored from save

      const [ox, oy] = object.localPosition;
      let found = null;
      for (const other of this.objects) {
        if (other === object) continue;
        const dx = other.localPosition[0] - ox;
        const dy = other.localPosition[1] - oy;
        if (Math.abs(dx) + Math.abs(dy) === 1) { found = other; break; }
      }

      if (!found) continue;

      const dx = found.localPosition[0] - ox;
      const dy = found.localPosition[1] - oy;
      const texAngle = Math.atan2(-dx, -dy);
      const sprite = sprites[object.spriteID];
      if (sprite) {
        for (const frame of sprite.frames) {
          object.rotateTexture(frame.textureName, texAngle);
        }
      }
    }
  }
}
