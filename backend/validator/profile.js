import { isValidUUIDv4 } from "../common/common.js";

const ALLOWED_AVATAR_PATHS = [
  "/image/defaultPfp.png",
  "/image/defaultPfp2.png",
  "/image/defaultPfp3.png",
  "/image/defaultPfp4.png",
  "/image/defaultPfp5.png",
  "/image/defaultPfp6.png",
];

function validateAvatarPath(value) {
  if (value == null || value === "") {
    return true;
  }

  if (!ALLOWED_AVATAR_PATHS.includes(value)) {
    throw new Error("Érvénytelen avatar érték");
  }

  return true;
}

export const GET = function (request, response, next) {
  const id = request?.params?.id;
  request.valid = isValidUUIDv4(id);
  next();
};

export const POST = {
  avatar: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: validateAvatarPath,
    },
  },
  display_name: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
        max: 60,
      },
      errorMessage: "A megjelenítési név hossza 1 és 60 karakter között lehet",
    },
  },
  description: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        max: 250,
      },
      errorMessage: "A profil leírása maximum 250 karakter hosszú lehet",
    },
  },
  visibility: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => {
        if (!["public", "private", "friends-only"].includes(value)) {
          throw new Error("Érvénytelen láthatósági érték");
        }
        return true;
      },
    },
  },
};

export const PATCH = {
  avatar: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: validateAvatarPath,
    },
  },
  display_name: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        min: 1,
        max: 60,
      },
      errorMessage: "A megjelenítési név hossza 1 és 60 karakter között lehet",
    },
  },
  description: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        max: 250,
      },
      errorMessage: "A profil leírása maximum 250 karakter hosszú lehet",
    },
  },
  visibility: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => {
        if (!["public", "private", "friends-only"].includes(value)) {
          throw new Error("Érvénytelen láthatósági érték");
        }
        return true;
      },
    },
  },
};
