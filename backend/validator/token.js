import { isValidUUIDv4 } from "../common/common.js";

export const DELETE = {
  id: {
    in: ["params"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid ID");
        }
        return true;
      },
    },
  },
};
