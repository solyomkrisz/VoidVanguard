/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/State.js
 * Szerep: Jatekallapot bitek es globalis flag-ek leiroja.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// A GlobalState bitpoziciokat ad meg. Ezeket a Rigidbody-szeru objektumok a sajat bitmezojukben kapcsolgatjak.
export class GlobalState {
  // Ha ez a bit be van kapcsolva, az entitas a kovetkezo ObjectCollection update soran kikerul a vilagbol.
  static DEAD = 0;
}

// Kulon ellenseg-specifikus biteknek van fenntartva hely, akkor is, ha jelenleg meg nincs feltoltve.
export class EnemyState {}
