import { isValidUUIDv4 } from "../common/common.js";

export const GET = function (request, response, next) {
  const id = request?.params?.id;
  request.valid = isValidUUIDv4(id);
  next();
};

export const POST = {
  avatar: {
    in: ["body"],
    optional: { options: { nullable: true } },
  },
  display_name: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
        max: 60,
      },
      errorMessage: "Display name must be 1-60 characters long",
    },
  },
  description: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        max: 250,
      },
    },
  },
  visibility: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => {
        if (!["public", "private", "friends-only"].includes(value)) {
          throw new Error("Invalid visibility value");
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
  },
  display_name: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        min: 1,
        max: 60,
      },
    },
  },
  description: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        max: 250,
      },
    },
  },
  visibility: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => {
        if (!["public", "private", "friends-only"].includes(value)) {
          throw new Error("Invalid visibility value");
        }
        return true;
      },
    },
  },
};
