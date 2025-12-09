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

    super({ game, model, x, y, vx, vy, maxSpeed: 1 });

    this.id = game.idManager.get();
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
      while (j < other.model.objects.length && !isAdjacent(other.model.objects, j, ...nLP)) j++;
      if (!(j < other.model.objects.length)) return false;

      const [object] = this.model.objects;
      vec2.copy(object.localPosition, nLP);
      other.model.add(object);
      object.isRemovable = true;

      this.model.reset();
      this.game.mouse.reset();

      other.proxyCollider.onGeometryChange();
      other.shapeCollider.onGeometryChange();

      this.setState(GlobalState.DEAD);
    }

    return true;
  }

  onContact(object) {
    this.showDetailsOnContact(object);
  }
}
