import { isValidUUIDv4 } from "../common/common.js";

export const GET = {
  targetId: {
    in: ["query"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen célazonosító");
        }
        return true;
      },
    },
  },
  page: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "Az oldalnak pozitív egész számnak kell lennie",
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
  targetId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen célazonosító");
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
          throw new Error("Érvénytelen szülőazonosító");
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
      errorMessage:
        "A tartalom hossza 1 és 500 karakter között kell hogy legyen",
    },
  },
};

export const PATCH = {
  commentId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen hozzászólás azonosító");
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
      errorMessage:
        "A tartalom hossza 1 és 500 karakter között kell hogy legyen",
    },
  },
};

export const DELETE = {
  commentId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen hozzászólás azonosító");
        }
        return true;
      },
    },
  },
};
