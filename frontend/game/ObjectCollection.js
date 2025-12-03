import { GlobalState } from "./State.js";

export default class ObjectCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.deleted = [];
    this.baseLength = this.objects.length;
  }

  add(entity) {
    entity.id = this.game.idManager.get();
    this.objects.push(entity);
    this.baseLength++;
  }

  update() {
    let writeIndex = 0;

    for (const object of this.objects) {
      if (object.hasState(GlobalState.DEAD)) continue;

      this.objects[writeIndex++] = object;
      object.netForce.reset(); // csak az erőket reseteljkük, a sebességet soha, így a collision dependent erőkből módosított sebesség alkalmazza az erőt
      object.save();
      object.update();
    }

    this.objects.length = writeIndex;
  }

  render() {
    this.objects.forEach((object) => object.render());
  }

  merge(...collections) {
    this.objects.length = this.baseLength;

    for (const collection of collections) {
      this.objects.push(...collection.objects);
    }

    return this;
  }
}
