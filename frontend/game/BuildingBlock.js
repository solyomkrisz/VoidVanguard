import * as vec2 from "/common/vec2.js";
import Collidable from "/game/Collidable.js";
import Player from "/game/Player.js";
import Rigidbody from "/game/Rigidbody.js";
import { getAngleDiff, isAdjacent } from "/common/common.js";
import * as Type from "/game/Type.js";
import { GlobalState } from "/game/State.js";

export default class BuildingBlock extends Rigidbody {
  // prettier-ignore
  constructor({ game, model, parent = null, x = 0, y = 0, vx = 0, vy = 0 } = {}) {
    if (model.objects.length > 1) {
      throw new Error("BUILDINGBLOCK-constructor: The length of the model must not be greater than one!");
    }

    vec2.reset(model.objects[0].localPosition);

    super({ type: Type.BUILDING_BLOCK, game, model, x, y, vx, vy, maxSpeed: 1 });

    this.id = game.idManager.get();
    this.model.init(this);

    this.contextMenuTemplate = game.contextMenu.template.ENEMY_CONTEXT_MENU;
    this.snapCooldown = 15;
  }

  update() {
    this.rotation = 0;

    if (this.snapCooldown > 0) this.snapCooldown--;

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
    if (neighbor.isTurret || neighbor.isThruster) return false;
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

    other.is(Type.MOUSE) && mouse.isDown && mouse.attach(this);
    
    if (this.snapCooldown <= 0 && this.posDiff() < 0.5 && this.isDragged() && other.is(Type.PLAYER)) {
      vec2.copy(_b.vec2_1, this.position);
      const nLP = vec2.sub(_b.vec2_1, _b.vec2_1, other.position); // newLocalPosition

      vec2.rotate(nLP, -other.rotation);
      vec2.round(nLP);

      let j = 0;
      while (
        j < other.model.objects.length &&
        (
          !this.checkNeighbor(nLP, other.model.objects[j]) ||
          !this.checkNeighborAcceptsAttachment(nLP, other.model.objects[j])
        )
      ) j++;
      if (!(j < other.model.objects.length)) return false;

      const [object] = this.model.objects;

      // Orient the sprite so its bottom faces the connection side
      const neighbor = other.model.objects[j];
      const dx = neighbor.localPosition[0] - nLP[0];
      const dy = neighbor.localPosition[1] - nLP[1];
      const texAngle = Math.atan2(-dx, -dy);
      const sprite = this.game.textureManager.sprites[object.spriteID];
      if (sprite) {
        for (const frame of sprite.frames) {
          object.rotateTexture(frame.textureName, texAngle);
        }
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

  // prettier-ignore
  resolvePenetration(other, collision, epsilon, direction) {
    const correction = other.is(Type.PLAYER) ? collision.depth + epsilon : this.getDefaultPenetrationCorrection(other, collision, epsilon);

    vec2.addScaled(this.position, this.position, collision.normal, correction * direction);
  }
}
