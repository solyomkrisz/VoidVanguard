/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/IDManager.js
 * Szerep: Ujrahasznosithato numerikus azonositokat oszto egyszeru ID-pool.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class IDManager {
  constructor(max = 2 ** 16) {
    this.next = 0;
    this.pool = [];
    this.max = max;
  }

  get() {
    // Először a felszabadított azonosítókat használjuk újra, így nem nő feleslegesen a számláló.
    if (this.pool.length) return this.pool.pop();

    if (this.next >= this.max) {
      throw new Error("IDManager-get: Maximum ID limit reached!");
    }

    return this.next++;
  }

  release(id) {
    // A felszabadított ID visszakerül a poolba, hogy később újra kiosztható legyen.
    this.pool.push(id);
  }
}
