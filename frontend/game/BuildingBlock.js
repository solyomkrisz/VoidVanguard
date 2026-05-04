import * as vec2 from "/common/vec2.js";
import Collidable from "/game/Collidable.js";
import Player from "/game/Player.js";
import Rigidbody from "/game/Rigidbody.js";
import { getAngleDiff, isAdjacent } from "/common/common.js";
import * as Type from "/game/Type.js";
import { GlobalState } from "/game/State.js";

export default class BuildingBlock extends Rigidbody {
  static DESPAWN_AFTER_SECONDS = 30;
  static SNAP_ARM_SECONDS = 0.18;
  static SNAP_CENTER_TOLERANCE = 0.2;
  static SNAP_CENTER_TOLERANCE_TURRET = 0.49;
  static SNAP_CURSOR_DIST_MAX = 0.5;
  static SNAP_CURSOR_DIST_MAX_TURRET = 0.9;

  // prettier-ignore
  constructor({ game, model, parent = null, x = 0, y = 0, vx = 0, vy = 0 } = {}) {
    if (model.objects.length > 1) {
      throw new Error("BUILDINGBLOCK-constructor: The length of the model must not be greater than one!");
    }

    vec2.reset(model.objects[0].localPosition);

    super({ type: Type.BUILDING_BLOCK, game, model, x, y, vx, vy, maxSpeed: 1 });

    this.id = game.idManager.get();
    this.model.init(this);

    // Detached pickups should use a tighter broad-phase circle.
    this.halfDiagonal = 0.5;
    this.proxyCollider.onGeometryChange();
    this.proxyCollider.validate();

    this.contextMenuTemplate = game.contextMenu.template.ENEMY_CONTEXT_MENU;
    this.snapCooldown = 15;
    this.lifeTime = 0;
    this.dragSnapElapsed = 0;
  }

  update() {
    this.rotation = 0;

    if (this.snapCooldown > 0) this.snapCooldown--;

    if (this.isDragged()) {
      this.lifeTime = 0;
    }

    this.lifeTime += this.game.fdt;
    if (this.lifeTime >= BuildingBlock.DESPAWN_AFTER_SECONDS) {
      this.setState(GlobalState.DEAD);
      return;
    }

    this.updateVelocity();
    this.updatePosition();
  }

  onGeometryChange() {
    super.onGeometryChange();
    if (this.model.objects.length === 0) {
      this.setState(GlobalState.DEAD);
    }
  }

  onBroadCollision(other) {
    if (this.isDragged()) {
      if (other.is(Type.PLAYER)) {
        this.rotation = getAngleDiff(other.rotation, this.rotation);
        return true;
      }

      return false;
    }

    return true;
  }

  // prettier-ignore
  checkNeighbor(nLP, neighbor) {
    const adjacencyRules = this.model.objects[0].adjacencyRules;
    const [tx, ty] = nLP;
    const [ox, oy] = neighbor.localPosition;

    const ml = Math.abs(tx - ox) + Math.abs(ty - oy);

    if (ml === 1) return true;

    if (adjacencyRules.length) {
      for (let i = 0; i < adjacencyRules.length; i += 2) {
        const x = adjacencyRules[i];
        const y = adjacencyRules[i + 1];

        if (tx + x === ox && ty + y === oy) return true;
      }

      return false;
    }

    if (ml === 1) return true;

    return false;
  }

  // prettier-ignore
  checkNeighborAcceptsAttachment(nLP, neighbor) {
    const sourceBlock = this.model.objects[0];
    const sourceIsLeaf = sourceBlock?.isTurret || sourceBlock?.isThruster || sourceBlock?.type === Type.THRUSTER;
    const neighborIsLeaf = neighbor?.isTurret || neighbor?.isThruster || neighbor?.type === Type.THRUSTER;

    // Turrets and thrusters must attach to structural anchors.
    if (sourceIsLeaf && neighborIsLeaf) return false;

    // Thrusters cannot be used as attachment anchors at all.
    if (neighbor?.isThruster || neighbor?.type === Type.THRUSTER) return false;
    const adjacencyRules = neighbor.adjacencyRules;
    const [tx, ty] = nLP;
    const [ox, oy] = neighbor.localPosition;

    const dx = tx - ox;
    const dy = ty - oy;

    if (Math.abs(dx) + Math.abs(dy) === 1) return true;

    if (adjacencyRules.length) {
      for (let i = 0; i < adjacencyRules.length; i += 2) {
        const x = adjacencyRules[i];
        const y = adjacencyRules[i + 1];

        if (dx === x && dy === y) return true;
      }

      return false;
    }

    return Math.abs(dx) + Math.abs(dy) === 1;
  }

  // prettier-ignore
  onNarrowCollision(other) {
    const _b = this.game.buffer;
    const mouse = this.game.mouse;
    const sourceBlock = this.model.objects[0];
    const snapDistMax = sourceBlock?.isTurret
      ? BuildingBlock.SNAP_CURSOR_DIST_MAX_TURRET
      : BuildingBlock.SNAP_CURSOR_DIST_MAX;
    const centerTolerance = sourceBlock?.isTurret
      ? BuildingBlock.SNAP_CENTER_TOLERANCE_TURRET
      : BuildingBlock.SNAP_CENTER_TOLERANCE;

    other.is(Type.MOUSE) && mouse.isDown && mouse.attach(this);
    
    if (this.snapCooldown <= 0 && this.posDiff() < snapDistMax && this.isDragged() && other.is(Type.PLAYER)) {
      if (this.dragSnapElapsed < BuildingBlock.SNAP_ARM_SECONDS) return false;

      vec2.copy(_b.vec2_1, this.position);
      const localExact = vec2.sub(_b.vec2_1, _b.vec2_1, other.position);
      vec2.rotate(localExact, -other.rotation);

      const nLP = vec2.copy(_b.vec2_2, localExact); // newLocalPosition (rounded)
      vec2.round(nLP);

      if (!sourceBlock?.isTurret) {
        if (
          Math.abs(localExact[0] - nLP[0]) > centerTolerance ||
          Math.abs(localExact[1] - nLP[1]) > centerTolerance
        ) {
          return false;
        }
      }

      // Never allow placing into an already occupied slot.
      if (other.model.objects.some(({ localPosition }) => localPosition[0] === nLP[0] && localPosition[1] === nLP[1])) {
        return false;
      }

      const candidates = [];
      for (const candidate of other.model.objects) {
        if (!this.checkNeighbor(nLP, candidate)) continue;
        if (!this.checkNeighborAcceptsAttachment(nLP, candidate)) continue;
        candidates.push(candidate);
      }

      if (candidates.length === 0) return false;

      let neighbor = candidates[0];
      if (candidates.length > 1) {
        const residualX = localExact[0] - nLP[0];
        const residualY = localExact[1] - nLP[1];
        const residualLenSq = residualX * residualX + residualY * residualY;

        if (residualLenSq > 1e-6) {
          const invResidualLen = 1 / Math.sqrt(residualLenSq);
          const dirX = residualX * invResidualLen;
          const dirY = residualY * invResidualLen;

          let bestScore = -Infinity;
          for (const candidate of candidates) {
            const nx = candidate.localPosition[0] - nLP[0];
            const ny = candidate.localPosition[1] - nLP[1];
            const score = nx * dirX + ny * dirY;

            if (score > bestScore) {
              bestScore = score;
              neighbor = candidate;
            }
          }
        } else {
          let bestDistanceSq = Infinity;
          for (const candidate of candidates) {
            const dx = candidate.localPosition[0] - localExact[0];
            const dy = candidate.localPosition[1] - localExact[1];
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < bestDistanceSq) {
              bestDistanceSq = distanceSq;
              neighbor = candidate;
            }
          }
        }
      }

      const [object] = this.model.objects;

      // Orient the sprite so its bottom faces the connection side
      const dx = neighbor.localPosition[0] - nLP[0];
      const dy = neighbor.localPosition[1] - nLP[1];
      const texAngle = Math.atan2(-dx, -dy);
      const sprite = this.game.textureManager.sprites[object.spriteID];
      if (sprite) {
        for (const frame of sprite.frames) {
          object.rotateTexture(frame.textureName, texAngle);
        }
      }

      if (object.isTurret || object.isThruster || object.type === Type.THRUSTER) {
        const colliderAngle = texAngle;
        object.setColliderRotation?.(colliderAngle);
      }

      vec2.copy(object.localPosition, nLP);
      other.model.add(other, object);
      object.isRemovable = true;

      this.model.reset();
      this.game.mouse.reset();

      // other.proxyShader.onGeometryChange();
      // other.pshapeShader.onGeometryChange();
      other.onGeometryChange?.();

      this.setState(GlobalState.DEAD);
    }

    return true;
  }

  // prettier-ignore
  showDetails() {
    const ttip = this.game.tooltip;
    if (ttip.showTemplate(this, ttip.template.PARENT_INFO, this.game.frameId)) return;

    const t = ttip.template.PARENT_INFO;
    t.position.textContent = this.position;
    t.velocity.textContent = this.velocity;
    t.rotation.textContent = this.rotation;
    t.mass.textContent = this.mass;
    t.CoM.textContent = this.CoM;

    ttip.show();
  }

  onContact(collision, object) {
    if (collision.is(Type.INTERACTION)) {
      this.showDetails();
      object.showDetails(this);
      return;
    }

    const other = collision.a.parent === this ? collision.b.parent : collision.a.parent;

    if (other?.parent?.is?.(Type.PROJECTILE)) {
      if (typeof object?.health === "number") {
        object.health -= other.parent.dmg ?? 0;
        const geometryChanged = this.model.clear();
        if (geometryChanged) this.onGeometryChange();
      }
      return;
    }
  }

  onDragStart() {
    this.lifeTime = 0;
    this.dragSnapElapsed = 0;
  }

  onDragged(dt = 0) {
    this.lifeTime = 0;
    this.dragSnapElapsed += dt;
  }

  // prettier-ignore
  resolvePenetration(other, collision, epsilon, direction) {
    const correction = other.is(Type.PLAYER) ? collision.depth + epsilon : this.getDefaultPenetrationCorrection(other, collision, epsilon);

    vec2.addScaled(this.position, this.position, collision.normal, correction * direction);
  }
}
