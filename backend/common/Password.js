/**
 * Kezdobarat magyarazat:
 * Fajl: backend/common/Password.js
 * Szerep: Kozos backend segedkod: ujrahasznalhato osztalyok, hibakezeles, jogosultsag.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import bcrypt from "bcrypt";

class Password {
  static async hash(password) {
    return await bcrypt.hash(password, await bcrypt.genSalt(10));
  }

  static async compare(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

export default Password;
