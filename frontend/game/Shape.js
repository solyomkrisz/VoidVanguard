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
        minY + b[7],
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

  exportSave() {
    return {
      mergeable: this.mergeable,
      mergeModeRequest: this.mergeModeRequest,
      vertices: [...this.vertices],
    };
  }

  getMomentOfInertiaAndCoM(m, target) {
    // prettier-ignore
    const a = this.vertices, n = a.length / 2;
    vec2.reset(target);

    let A = 0;

    for (let i = 0; i < n; i++) {
      const x0i = i * 2;
      const x1i = ((i + 1) % n) * 2;

      const x0 = a[x0i];
      const y0 = a[x0i + 1];
      const x1 = a[x1i];
      const y1 = a[x1i + 1];

      const det = x0 * y1 - x1 * y0;
      A += det / 2;

      target[0] += (x0 + x1) * det;
      target[1] += (y0 + y1) * det;
    }

    if (Math.abs(A) < 1e-6) {
      vec2.reset(target);
      return 0;
    }

    vec2.scale(target, target, 1 / (6 * A));

    const cx = target[0];
    const cy = target[1];

    let I = 0;

    for (let i = 0; i < n; i++) {
      const x0i = i * 2;
      const x1i = ((i + 1) % n) * 2;

      const x0 = a[x0i] - cx;
      const y0 = a[x0i + 1] - cy;
      const x1 = a[x1i] - cx;
      const y1 = a[x1i + 1] - cy;

      I +=
        (x0 * x0 + y0 * y0 + x0 * x1 + y0 * y1 + x1 * x1 + y1 * y1) *
        (x0 * y1 - x1 * y0);
    }

    return I * (m / (6 * A));
  }
}
