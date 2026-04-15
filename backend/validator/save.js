import { isValidUUIDv4 } from "../common/common.js";

export const GET = function (request, response, next) {
  const id = request?.params?.id;
  request.valid = isValidUUIDv4(id);
  next();
};

export const POST = {
  slotName: {
    in: ["body"],
    isString: {
      errorMessage: "Slot name must be a string",
    },
    isLength: {
      options: {
        min: 3,
        max: 20,
      },
      errorMessage: "Slot name must be 3-20 characters long",
    },
    trim: true,
  },
  gameState: {
    in: ["body"],
    custom: {
      options: (value) => {
        // check if valid json object
        // no need to JSON.stringify anywhere because the db table column type is JSON
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          throw new Error("Game state must be a JSON object");
        }
        return true;
      },
    },
  },
};
