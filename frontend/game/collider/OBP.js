import Collider from "../Collider.js";
import * as vec from "../../common/vec.js";
import * as vec2 from "../../common/vec2.js";
import * as vec3 from "../../common/vec3.js";

export default class OBP extends Collider {
  static DIRTY = Object.freeze({
    NONE: 0,
    TRANSFORM: 1 << 0,
  });

  constructor(entity = null, ...vertices) {
    super(entity);

    this.vertices = vec.create(vertices.length);
    for (let i = 0; i < vertices.length; i++) this.vertices[i] = vertices[i];
    this.worldVertices = vec.create(vertices.length);
    this.axes = vec.create(vertices.length);
    this.center = vec2.create();
  }

  onAttach(entity) {
    this.entity = entity;
  }

  onGeometryChange() {
    return;
  }

  onPositionChange() {
    this.dirty |= OBP.DIRTY.TRANSFORM;
  }

  validate() {
    if (this.dirty === OBP.DIRTY.NONE) return;

    this.set();
  }

  set() {
    vec2.reset(this.center);

    const _b = this.entity.game.buffer;

    // Translate and rotate
    for (let i = 0; i < this.vertices.length; i += 2) {
      vec2.set(_b.vec2_1, this.vertices[i], this.vertices[i + 1]);
      vec2.rotate(_b.vec2_1, this.entity.rotation);
      const [x, y] = vec2.add(_b.vec2_1, _b.vec2_1, this.entity.position);

      this.worldVertices[i] = x;
      this.worldVertices[i + 1] = y;

      // Setting center
      this.center[0] += x;
      this.center[1] += y;
    }

    this.center[0] /= this.worldVertices.length / 2;
    this.center[1] /= this.worldVertices.length / 2;

    vec.reset(this.axes);

    // Make axes
    for (let i = 0; i < this.worldVertices.length / 2; i++) {
      const x0i = i * 2;
      const x1i = ((i + 1) % (this.worldVertices.length / 2)) * 2;

      const x0 = this.worldVertices[x0i];
      const y0 = this.worldVertices[x0i + 1];
      const x1 = this.worldVertices[x1i];
      const y1 = this.worldVertices[x1i + 1];

      const edge = vec2.set(_b.vec2_1, x1 - x0, y1 - y0);
      const normal = vec2.rotate(edge, Math.PI / 2);

      if (vec2.len(normal) > 1e-8) {
        vec2.normalize(normal, normal);

        this.axes[x0i] = normal[0];
        this.axes[x0i + 1] = normal[1];
      }
    }

    return this;
  }

  project(result, vertices, axis) {
    result.length = 0;

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < vertices.length; i += 2) {
      const x = vertices[i];
      const y = vertices[i + 1];

      const vertex = vec2.set(this.entity.game.buffer.vec2_1, x, y);
      const dot = vec2.dot(vertex, axis);

      if (dot < min) min = dot;
      if (dot > max) max = dot;
    }

    result[0] = min;
    result[1] = max;

    return result;
  }

  intersects(other) {
    const _b = this.entity.game.buffer;

    const collision = _b.collision_2;

    const axes = _b.arrn_1;
    axes.length = 0;

    axes.push(...this.axes);
    axes.push(...other.shapeCollider.axes);

    if (!axes.length) return collision.reset();

    let minOverlap = Infinity,
      minOverlapAxis = _b.vec2_3;

    // prettier-ignore
    for (let i = 0; i < axes.length; i += 2) {
      const axis = vec2.set(_b.vec2_2, axes[i], axes[i + 1]);

      const [minA, maxA] = this.project(_b.arrn_2, this.worldVertices, axis);
      const [minB, maxB] = this.project(_b.arrn_3, other.shapeCollider.worldVertices, axis);

      const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);

      if (overlap <= 0) return collision.reset();

      if (overlap < minOverlap) {
        minOverlap = overlap;
        vec2.copy(minOverlapAxis, axis);
      }
    }

    vec2.normalize(minOverlapAxis, minOverlapAxis);
    collision.status = true;
    collision.depth = minOverlap;
    collision.a = this.entity;
    collision.b = other;
    vec2.copy(collision.normal, minOverlapAxis);

    return collision;
  }

  debug() {
    const g = this.entity.game,
      _b = g.buffer,
      d = g.debugOverlay;

    const vertices = [];

    for (let i = 0; i < this.worldVertices.length; i += 2) {
      const vertex = vec2.set(
        _b.vec2_1,
        this.worldVertices[i],
        this.worldVertices[i + 1]
      );
      const worldSpace = vec2.toVec3(_b.vec3_1, vertex);
      const [x, y] = vec3.toVec2(
        _b.vec2_1,
        vec3.transformMat3Into(worldSpace, g.cameraMatrix, worldSpace)
      );

      const screenCoords = vec2.set(
        _b.vec2_1,
        (x + 1) * 0.5 * g.canvas.width,
        (1 - y) * 0.5 * g.canvas.height
      );

      vertices.push(...screenCoords);
    }

    d.drawPolygon(vertices);
  }
}
