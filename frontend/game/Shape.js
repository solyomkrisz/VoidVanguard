import { getMinMaxXY } from "../common/common.js";
import * as vec from "../common/vec.js";
import * as vec2 from "../common/vec2.js";

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

  getCentroid(target = vec2.create()) {
    // prettier-ignore
    const a = this.vertices, n = a.length / 2;
    vec2.reset(target);

    let s1 = 0;
    let s2 = 0;

    for (let i = 0; i < n; i++) {
      const x0i = i * 2;
      const x1i = ((i + 1) % n) * 2;

      const x0 = a[x0i];
      const y0 = a[x0i + 1];
      const x1 = a[x1i];
      const y1 = a[x1i + 1];

      s1 += x0 * y1;
      s2 += y0 * x1;

      const c = x0 * y1 - x1 * y0;

      target[0] += (x0 + x1) * c;
      target[1] += (y0 + y1) * c;
    }

    const A = Math.abs(s1 - s2) / 2;
    return vec2.scale(target, 1 / (6 * A));
  }
}
