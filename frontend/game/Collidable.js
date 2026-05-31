/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Collidable.js
 * Szerep: Utkozheto entitas alaposztaly proxy-, shape- es contact colliderrel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";

export default class Collidable {
  static MODEL_CENTER = vec2.create();

  constructor(game, model) {
    // A collidable az a kozos alaposztaly, amely mar minden utkozo entitasnak ad collider-helyet es alap eletciklust.
    this.halfDiagonal = Math.SQRT2 / 2;

    this.game = game;
    // this.contextMenuTemplate = game.contextMenu.template.PLAYER_CONTEXT_MENU;
    this.model = model;

    this.id = null;
    this.cell = [];
    this.proxyCollider = null;
    this.shapeCollider = null;
    this.contactCollider = null;
  }

  setProxyCollider(collider) {
    // A proxy collider a gyors broad-phase szureshez kell.
    this.proxyCollider = collider;
    this.proxyCollider.onAttach(this);
    return this;
  }

  setShapeCollider(collider) {
    // A shape collider a reszletesebb, valos alak szerinti utkozesvizsgalatot vegzi.
    this.shapeCollider = collider;
    this.shapeCollider.onAttach(this);
    return this;
  }

  setContactCollider(collider) {
    // A contact collider a finomabb kontaktpont- vagy blokk-szintu interakciokhoz hasznalhato.
    this.contactCollider = collider;
    this.contactCollider.onAttach(this);
    return this;
  }

  onDeath() {
    // Halalkor az entitas altal foglalt ID visszakerul az ujrahasznalhato poolba.
    this.game.idManager.release(this.id);
  }

  onPositionChange() {
    // A poziciovaltozast legalabb a proxy- es a shape collidernek tudnia kell.
    this.proxyCollider.onPositionChange();
    this.shapeCollider.onPositionChange();
  }

  onRotationChange() {
    // Forgatasnal ugyanigy mindket fo collider koveti az uj allapotot.
    this.proxyCollider.onRotationChange();
    this.shapeCollider.onRotationChange();
  }

  onGeometryChange() {
    // Modellvaltozas utan a collidergeometria is ujraszamolando.
    this.proxyCollider.onGeometryChange();
    this.shapeCollider.onGeometryChange();
  }

  onBroadCollision(other) {
    console.warn("onBroadCollision() must be implemented by the subclass!");
  }

  onNarrowCollision(other) {
    console.warn("onNarrowCollision() must be implemented by the subclass!");
  }

  onContact(collision, object) {
    console.warn("onContact() must be implemented by the subclass!");
  }

  getDefaultPenetrationCorrection() {
    console.warn(
      "getDefaultPenetrationCorrection() must be implemented by the subclass!",
    );
  }

  resolvePenetration(other, collision, epsilon, direction) {
    console.warn("resolvePenetration() must be implemented by the subclass!");
  }
}
