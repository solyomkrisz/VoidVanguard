import { isValidUUIDv4 } from "../common/common.js";

export const POST = function (request, response, next) {
  const id = request?.body?.userId;
  request.valid = isValidUUIDv4(id);
  next();
};
