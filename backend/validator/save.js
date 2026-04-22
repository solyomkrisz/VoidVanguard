import { isValidUUIDv4 } from "../common/common.js";

export const GET = function (request, response, next) {
  const id = request?.params?.id;
  request.valid = isValidUUIDv4(id);
  next();
};

export const PATCH = {};

export const PUT = {
  game_id: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!value || !isValidUUIDv4(value)) {
          throw new Error("Invalid save ID");
        }
        return true;
      },
    },
  },
  slot_name: {
    in: ["body"],
    optional: { options: { nullable: true } },
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
  game_state: {
    in: ["body"],
    custom: {
      options: (value) => {
        try {
          const parsed = JSON.parse(value);

          if (
            typeof value !== "string" ||
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw {};
          }
        } catch (error) {
          throw new Error("Invalid game state");
        }
        return true;
      },
    },
  },
};

export const DELETE = {
  game_id: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!value || !isValidUUIDv4(value)) {
          throw new Error("Invalid save ID");
        }
        return true;
      },
    },
  },
};
