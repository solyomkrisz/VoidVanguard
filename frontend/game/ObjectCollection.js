/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/ObjectCollection.js
 * Szerep: Jatekobjektumok gyujtemenye kozos update/render eletciklussal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { GlobalState } from "/game/State.js";

export default class ObjectCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.deleted = [];
  }

  clear() {
    // Teljes ujrainditaskor vagy mas nagyobb takaritaskor mind az aktiv, mind a torolt lista kiurul.
    this.objects.length = 0;
    this.deleted.length = 0;

    return this;
  }

  add(...entities) {
    // Tobb entitas is hozzaadhato egyszerre, igy a hivo egyetlen hívással tolhat be egy uj csoportot.
    for (const entity of entities) {
      this.objects.push(entity);
    }

    return this;
  }

  update() {
    // Egyetlen korben intezi az elhalalozott objektumok kiszurest, az aktivak updatejet es az ideiglenes erok lenullazasat.
    let writeIndex = 0;

    for (const object of this.objects) {
      if (object.hasState(GlobalState.DEAD)) {
        object.onDeath();
        continue;
      }

      this.objects[writeIndex++] = object;
      object.save();
      object.update();
      object.previousNetForce.apply(object.netForce);
      // Csak az aktualis frame-re adott erok nullazodnak; a sebesseg mar az update es collision utan magaban hordja a hatasukat.
      object.netForce.reset();

      // Ha az objektum modellje kozben kiurult vagy valtozott, lehet hogy uj tomeg/collider szamitas kell.
      object.model.clear() && object.onGeometryChange();
    }

    this.objects.length = writeIndex;

    return this;
  }

  render() {
    // A gyujtemeny csak tovabbitja a renderhivast az osszes aktiv objektumnak.
    this.objects.forEach((object) => object.render());

    return this;
  }

  forEach(cb) {
    for (const object of this.objects) cb(object);
    return this;
  }

  merge(...collections) {
    // Több kulon gyujtemeny aktiv listajat tudja egyetlen nezetbe osszefuzni.
    this.objects.length = 0;

    for (const { objects } of collections) {
      this.objects.push(...objects);
    }

    return this;
  }

  exportSave() {
    // Menteshez minden objektum sajat exportSave eredmenye kerul egy tombbe.
    const result = [];

    for (const object of this.objects) {
      result.push(object.exportSave());
    }

    return result;
  }
}
