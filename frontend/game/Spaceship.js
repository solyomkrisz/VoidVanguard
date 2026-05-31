/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Spaceship.js
 * Szerep: Hajo alaposztaly hajtomuvekkel, lovesi cooldownnal es azonositokezelessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Rigidbody from "/game/Rigidbody.js";
import * as Type from "/game/Type.js";
import IDManager from "/game/IDManager.js";
import * as vec2 from "/common/vec2.js";

export default class Spaceship extends Rigidbody {
  // prettier-ignore
  // Kozepsintu hajo-alapot tarol: sajat ID, thruster-csoportok es lovesi cooldown.
  constructor({ type = Type.UNKNOWN, game, model, x, y, vx, vy, maxSpeed } = {}) {
    super({ type, game, model, x, y, vx, vy, maxSpeed });

    this.id = game.idManager.get();
    this.idManager = new IDManager();
    this.thrusters = new Map();
    this.controlledThrusters = new Map();
    this.shootCooldown = 0;
  }

  // Geometria valtozasakor jelzi a thruster blokkoknak, hogy a kapcsolodo iranyokat ujra kell szamolni.
  onGeometryChange() {
    super.onGeometryChange();

    for (const thruster of this.thrusters.values()) {
      thruster.dirty = true;
    }
  }

  // A leszármazott osztalyoknak kell megmondaniuk, pontosan hogyan lonek.
  shoot() {
    console.warn("shoot() must be implemented by the subclass!");
  }

  // A kozos hajo-update itt most csak a lovesi cooldown visszaszamolasa.
  update() {
    const dt = this.game.fdt;
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
  }
}
