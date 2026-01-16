import * as vec2 from "../common/vec2.js";
import Collidable from "./Collidable.js";
import Player from "./Player.js";
import Rigidbody from "./Rigidbody.js";
import { getAngleDiff, isAdjacent } from "../common/common.js";
import * as Type from "./Type.js";
import { GlobalState } from "./State.js";

export default class BuildingBlock extends Rigidbody {
  // prettier-ignore
  constructor({ game, model, parent = null, x = 0, y = 0, vx = 0, vy = 0 } = {}) {
    if (model.objects.length > 1) {
      throw new Error("BUILDINGBLOCK-constructor: The length of the model must not be greater than one!");
    }

    vec2.reset(model.objects[0].localPosition);

    super({ type: Type.BUILDING_BLOCK, game, model, x, y, vx, vy, maxSpeed: 1 });

    this.id = game.idManager.get();

    this.contextMenuTemplate = game.contextMenu.template.ENEMY_CONTEXT_MENU;
  }

  update() {
    this.rotation = 0;

    this.updateVelocity();
    this.updatePosition();
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
  onNarrowCollision(other) {
    const _b = this.game.buffer;
    const mouse = this.game.mouse;

    other.is(Type.MOUSE) && mouse.isDown && mouse.attach(this);
    
    if (this.posDiff() < 0.5 && this.isDragged() && other.is(Type.PLAYER)) {
      vec2.copy(_b.vec2_1, this.position);
      const nLP = vec2.sub(_b.vec2_1, _b.vec2_1, other.position); // newLocalPosition

      vec2.rotate(nLP, -other.rotation);
      vec2.round(nLP);

      let j = 0;
      while (j < other.model.objects.length && !this.checkNeighbor(nLP, other.model.objects[j])) j++;
      if (!(j < other.model.objects.length)) return false;

      const [object] = this.model.objects;
      vec2.copy(object.localPosition, nLP);
      other.model.add(other, object);
      object.isRemovable = true;

      this.model.reset();
      this.game.mouse.reset();

      other.proxyCollider.onGeometryChange();
      other.shapeCollider.onGeometryChange();

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

  onContact(object) {
    this.showDetails();
    object.showDetails(this);
  }

  // prettier-ignore
  resolvePenetration(other, collision, epsilon, direction) {
    const correction = other.is(Type.PLAYER) ? collision.depth + epsilon : this.getDefaultPenetrationCorrection(other, collision, epsilon);

    vec2.addScaled(this.position, this.position, collision.normal, correction * direction);
  }
}
