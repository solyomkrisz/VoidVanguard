import Block from "./Block";
import Shape from "./Shape";
import * as vec from "./common/vec.js";

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
