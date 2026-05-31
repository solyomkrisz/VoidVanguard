/**
 * Kezdobarat magyarazat:
 * Fajl: backend/common/Password.js
 * Szerep: Bcrypt-alapu jelszo-hasheles es jelszoellenorzes kozos helperben.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import bcrypt from "bcrypt";

class Password {
  static async hash(password) {
    // Regisztracio vagy jelszocsere eseten a nyers jelszobol itt keszul lassan visszafejtheto bcrypt hash.
    return await bcrypt.hash(password, await bcrypt.genSalt(10));
  }

  static async compare(password, hash) {
    // Bejelentkezesnel a kliens altal kuldott nyers jelszot vetjuk ossze a tarolt hash-sel.
    return await bcrypt.compare(password, hash);
  }
}

export default Password;
