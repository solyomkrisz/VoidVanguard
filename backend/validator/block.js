const { isValidUUIDv4 } = require("../common/common.js");

const POST = function (request, response, next) {
  const id = request?.body?.userId;
  request.valid = isValidUUIDv4(id);
  next();
};

module.exports = { POST };
