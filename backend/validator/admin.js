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

export const BAN = {
  userId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Invalid user ID");
        }
        return true;
      },
    },
  },
  reason: {
    in: ["body"],
    optional: {
      options: { nullable: true },
    },
    isString: {
      errorMessage: "Reason must be a string",
    },
    isLength: {
      options: { max: 60 },
      errorMessage: "Reason must be at most 60 characters",
    },
    customSanitizer: {
      options: (value) => value ?? null,
    },
  },
  expiresAt: {
    in: ["body"],
    optional: {
      options: { nullable: true, checkFalsy: true },
    },
    // customSanitizer: {
    //   options: (value) => {
    //     if (value === "" || value === undefined || value === null) {
    //       return null;
    //     }

    //     return value.replace("T", " ") + ":00";
    //   },
    // },
    isISO8601: {
      options: { strict: true },
      errorMessage: "expiresAt must be a valid datetime",
    },
    custom: {
      options: (value) => {
        if (!value) return true;

        const date = new Date(value);
        const minAllowed = new Date(Date.now() + 5 * 60 * 1000);

        if (isNaN(date.getTime())) {
          throw new Error("Invalid date");
        }

        if (date < minAllowed) {
          throw new Error("expiresAt must be at least 5 minutes in the future");
        }

        return true;
      },
    },
  },
};

export const UNBAN = {
  userId: {
    in: ["body"],
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
