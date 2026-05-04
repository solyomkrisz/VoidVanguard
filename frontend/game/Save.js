import Block from "/game/Block.js";
import Thruster from "/game/Thruster.js";
import Enemy from "/game/Enemy.js";
import Model from "/game/Model.js";
import * as Type from "/game/Type.js";

export default class Save {
  static parse(stringified) {
    return JSON.parse(stringified);
  }

  static recoverModelObject(object) {
    if (object.type === Type.BLOCK) {
      return Block.from(object);
    }

    if (object.type === Type.THRUSTER) {
      return Thruster.from(object);
    }
  }

  static recoverModelObjects(savedModel) {
    const objects = savedModel.objects;

    const recoveredObjects = [];

    for (const object of objects) {
      recoveredObjects.push(Save.recoverModelObject(object));
    }

    return recoveredObjects;
  }

  static recoverEntity(saved, game) {
    const recoveredModel = new Model(Save.recoverModelObjects(saved.model));

    if (saved.type === Type.ENEMY) {
      return Enemy.from(saved, recoveredModel, game);
    }
  }
}
