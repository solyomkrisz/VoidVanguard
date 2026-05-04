import { isValidUUIDv4 } from "../common/common.js";

export const GET = function (request, response, next) {
  const id = request?.query?.targetId;
  request.valid = isValidUUIDv4(id);
  next();
};

export const POST = function (request, response, next) {
  const id = request?.body?.userId;
  request.valid = isValidUUIDv4(id);
  next();
};
