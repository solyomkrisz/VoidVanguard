import { getMinMaxXY } from "../common/common.js";
import * as vec from "../common/vec.js";

export default class Shape {
  static MERGE_MODE = Object.freeze({
    AABB: 0,
    KEEP_ALL: 1 << 0,
  });

  static MERGE_HANDLER = Object.freeze({
    [Shape.MERGE_MODE.AABB]: function (target, objects) {
      const [minX, minY, maxX, maxY] = getMinMaxXY(target, objects);

      const b = objects[0].shape.vertices; // first vertex is top left, second is top right ...

      target.length = 0;

      target.push(
        minX + b[0],
        maxY + b[1],
        maxX + b[2],
        maxY + b[3],
        maxX + b[4],
        minY + b[5],
        minX + b[6],
        minY + b[7]
      );

      return target;
    },

    [Shape.MERGE_MODE.KEEP_ALL]: function (target, objects) {
      for (const object of objects) {
        const [lx, ly] = object.localPosition;

        for (let i = 0; i < object.shape.vertices.length; i += 2) {
          const x = object.shape.vertices[i];
          const y = object.shape.vertices[i + 1];

          target.push(lx + x, ly + y);
        }
      }

      return target;
    },
  });

  static MERGE(target, mode, model) {
    target.length = 0;
    return Shape.MERGE_HANDLER[mode](target, model);
  }

  static IS_STRICT_IDENTICAL(a, b) {
    if (a.vertices.length !== b.vertices.length) return false;

    let j = 0;
    while (j < a.vertices.length && a.vertices[j] === b.vertices[j]) j++;
    return j >= a.vertices.length;
  }

  constructor(mergeable, mergeModeRequest, ...vertices) {
    this.mergeable = mergeable;
    this.mergeModeRequest = mergeModeRequest;
    this.vertices = vec.create(vertices.length);
    for (let i = 0; i < vertices.length; i++) this.vertices[i] = vertices[i];
  }
}
