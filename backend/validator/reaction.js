import { isValidUUIDv4 } from "../common/common.js";

export const GET = {
  targetId: {
    in: ["params"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen célazonosító");
        }
        return true;
      },
    },
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
  type: {
    in: ["body"],
    isIn: {
      options: [["like", "dislike"]],
      errorMessage: "Érvénytelen reakció típus",
    },
  },
};
