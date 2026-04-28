import { isValidUUIDv4 } from "../common/common.js";

export const BAN_STATUS = {
  targetUserId: {
    in: ["query"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid user ID");
        }
        return true;
      },
    },
  },
};
