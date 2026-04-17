import Block from "/game/Block.js";
import Thruster from "/game/Thruster.js";

export default class Save {
  static parse(stringified) {
    return JSON.parse(stringified);
  }

  static recoverModelObject(object) {
    if (object.type === 0) {
      return Block.from(object);
    }

    if (object.type === 1) {
      return Thruster.from(object);
    }
  }

  static recoverPlayerModel(savedModel) {
    const objects = savedModel.objects;

    const recoveredObjects = [];

    for (const object of objects) {
      recoveredObjects.push(Save.recoverModelObject(object));
    }

    return recoveredObjects;
  }
}
