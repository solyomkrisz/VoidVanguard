class CustomError {
  constructor({ name = null, code = null, message = "" } = {}) {
    this.name = name;
    this.code = code;
    this.message = message;
  }
}

module.exports = CustomError;
