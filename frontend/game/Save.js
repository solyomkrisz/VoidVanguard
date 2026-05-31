/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Save.js
 * Szerep: Frontend oldali mentesadat modellje export/import segedekkel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Block from "/game/Block.js";
import Thruster from "/game/Thruster.js";
import Enemy from "/game/Enemy.js";
import Model from "/game/Model.js";
import * as Type from "/game/Type.js";

export default class Save {
  static parse(stringified) {
    // A mentes a tarolasban szoveg, innen lesz ujra JavaScript objektum.
    return JSON.parse(stringified);
  }

  static recoverModelObject(object) {
    // A mentett blokkadatbol ujra a megfelelo jatekobjektum-peldanyt hozzuk letre.
    if (object.type === Type.BLOCK) {
      return Block.from(object);
    }

    if (object.type === Type.THRUSTER) {
      return Thruster.from(object);
    }
  }

  static recoverModelObjects(savedModel) {
    // A modell minden elemet egyenkent epitunk vissza, hogy a hozza tartozo metodusok is ujra elerhetok legyenek.
    const objects = savedModel.objects;

    const recoveredObjects = [];

    for (const object of objects) {
      recoveredObjects.push(Save.recoverModelObject(object));
    }

    return recoveredObjects;
  }

  static recoverEntity(saved, game) {
    // Eloszor a hajo/test modelljet allitjuk helyre, utana epulhet ra az adott entitas.
    const recoveredModel = new Model(Save.recoverModelObjects(saved.model));

    if (saved.type === Type.ENEMY) {
      // A mentett tipus mondja meg, melyik konkret osztaly felelos a visszaepitesert.
      return Enemy.from(saved, recoveredModel, game);
    }
  }
}
