import { isValidUUIDv4 } from "../common/common.js";

export const GET = {
  targetId: {
    in: ["query"],
  },
  custom: {
    options: (value) => {
      if (!isValidUUIDv4(value)) {
        throw new Error("Invalid target ID");
      }
      return true;
    },
  },
  page: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "Page must be a positive integer",
    },
    toInt: true,
  },
  limit: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
    },
    toInt: true,
  },
};

export const POST = {
  // authorId: {
  //   in: ["body"],
  //   custom: {
  //     options: (value) => {
  //       if (!isValidUUIDv4(value)) {
  //         throw new Error("Invalid user ID");
  //       }
  //       return true;
  //     },
  //   },
  // },
  targetId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid target ID");
        }
        return true;
      },
    },
  },
  parentId: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid parent ID");
        }
        return true;
      },
    },
  },
  content: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
        max: 500,
      },
    },
    errorMessage: "Content cannot be empty",
  },
};

export const PATCH = {
  commentId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid comment ID");
        }
        return true;
      },
    },
  },
  content: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
        max: 500,
      },
    },
  },
};

export const DELETE = {
  commentId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid comment ID");
        }
        return true;
      },
    },
  },
};
