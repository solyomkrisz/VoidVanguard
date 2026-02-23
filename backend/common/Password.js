const bcrypt = require("bcrypt");

class Password {
  static async hash(password) {
    return await bcrypt.hash(password, await bcrypt.genSalt(10));
  }

  static async compare(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = Password;
