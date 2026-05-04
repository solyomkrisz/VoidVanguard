import { isValidUUIDv4 } from "../common/common.js";

export const GET = function (request, response, next) {
  const id = request?.params?.id;
  request.valid = isValidUUIDv4(id);
  next();
};

export const PATCH = {
  game_id: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!value || !isValidUUIDv4(value)) {
          throw new Error("Érvénytelen játékazonosító");
        }
        return true;
      },
    },
  },
  save_name: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isString: {
      errorMessage: "A mentés neve szövegnek kell hogy legyen",
    },
    isLength: {
      options: {
        min: 3,
        max: 20,
      },
      errorMessage: "A mentés neve 3 és 20 karakter között kell legyen",
    },
    trim: true,
  },
  game_state: {
    in: ["body"],
    optional: { options: { nullable: true } },
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
          throw new Error("Érvénytelen játékállapot");
        }
        return true;
      },
    },
  },
  is_finished: {
    in: ["body"],
    optional: { options: { nullable: true } },
    toBoolean: true,
    isBoolean: {
      errorMessage: "A befejezettséget jelző mező logikai érték kell legyen",
    },
  },
};

export const PUT = {
  game_id: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!value || !isValidUUIDv4(value)) {
          throw new Error("Érvénytelen játékazonosító");
        }
        return true;
      },
    },
  },
  save_name: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isString: {
      errorMessage: "A mentés neve szövegnek kell hogy legyen",
    },
    isLength: {
      options: {
        min: 3,
        max: 20,
      },
      errorMessage: "A mentés neve 3 és 20 karakter között kell legyen",
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
          throw new Error("Érvénytelen játékállapot");
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
          throw new Error("Érvénytelen játékazonosító");
        }
        return true;
      },
    },
  },
};
