/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Collider.js
 * Szerep: Collider alaposztaly eletciklus- es validacios hookokkal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// Fontos szabaly: egy adott utkozesfazisban a ket osszehasonlitott objektumnak azonos fajta collidert kell hasznalnia.
export default class Collider {
  constructor(entity) {
    this.entity = entity;
  }

  // Akkor fut le, amikor a collider eloszor ra van kotve a szulo entitasra.
  onAttach(entity) {
    console.warn("onAttach() must be implemented by the subclass!");
  }

  init() {
    // console.warn("init() must be implemented by the subclass!");
  }

  // Itt dol el, hogy a collider piszkos-e, es emiatt ujra kell-e szamolni a sajat adatait.
  validate() {
    console.warn("validate() must be implemented by the subclass!");
  }

  // Modellvaltozasnal ezt hivjuk, hogy a collider uj geometriaval szamoljon a kovetkezo validate soran.
  onGeometryChange() {
    console.warn("onGeometryChange() must be implemented by the subclass!");
  }

  // Poziciovaltaskor a collider hatarai is ervenytelenne valhatnak, ezert itt jeloljuk piszkosnak.
  onPositionChange() {
    console.warn("onPositionChange() must be implemented by the subclass!");
  }

  onRotationChange() {
    // Forgatas utan ugyanigy uj vilagkoordinatas alakot kell felvennie a collidernek.
    console.warn("onRotationChange() must be implemented by the subclass!");
  }

  // A tenyleges ujraszamolo lepes; a konkret collider alosztaly itt epiti fel a sajat allapotat.
  set() {
    console.warn("set() must be implemented by the subclass!");
  }

  // A broad-phase racsba valo regisztralast vegzi el, ha az adott collider tipus hasznalja ezt a lepest.
  register() {
    console.warn("register() must be implemented by the subclass!");
  }

  // Ketten azonos collider-tipus kozott elvegzi az utkozesvizsgalatot, es visszaadja az eredmenyt.
  intersects() {
    console.warn("intersects() must be implemented by the subclass!");
  }

  // Debug megjeleniteshez hasznalt kirajzolo hook.
  debug() {
    console.warn("debug() must be implemented by the subclass!");
  }
}
