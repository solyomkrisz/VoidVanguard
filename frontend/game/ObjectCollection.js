import { GlobalState } from "./State.js";

export default class ObjectCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.deleted = [];
  }

  clear() {
    this.objects.length = 0;
    this.deleted.length = 0;

    return this;
  }

  add(...entities) {
    for (const entity of entities) {
      this.objects.push(entity);
    }

    return this;
  }

  update() {
    let writeIndex = 0;

    for (const object of this.objects) {
      if (object.hasState(GlobalState.DEAD)) continue;

      this.objects[writeIndex++] = object;
      object.save();
      object.update();
      object.previousNetForce.apply(object.netForce);
      object.netForce.reset(); // csak az erőket reseteljük, a sebességet soha, így a collision dependent erőkből módosított sebesség alkalmazza az erőt
    }

    this.objects.length = writeIndex;

    return this;
  }

  render() {
    this.objects.forEach((object) => object.render());

    return this;
  }

  merge(...collections) {
    this.objects.length = 0;

    for (const { objects } of collections) {
      this.objects.push(...objects);
    }

    return this;
  }
}
