import { isValidUUIDv4 } from "../common/common.js";

export const POST = {
  userId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid user id");
        }
        return true;
      },
    },
  },
};
