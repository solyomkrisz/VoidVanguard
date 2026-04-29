import { isValidUUIDv4 } from "../common/common.js";

export function GET(request, response, next) {
  const id = request?.params?.id;
  request.valid = isValidUUIDv4(id);
  next();
}

export const POST = {
  username: {
    in: ["body"],
    isLength: {
      options: {
        min: 3,
        max: 20,
      },
      errorMessage: "Username must be 3-20 characters long",
    },
    trim: true,
    notEmpty: {
      errorMessage: "Username cannot be empty or just spaces",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage:
        "Username must be one word and contain only letters, numbers, or underscores",
    },
  },
  email: {
    in: ["body"],
    isEmail: {
      errorMessage: "Invalid email address",
    },
    normalizeEmail: true,
  },
  password: {
    in: ["body"],
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "Password must be at least 8 characters",
    },
    matches: {
      options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/],
      errorMessage:
        "Password must include at least one of all the following: uppercase, lowercase letter, number, special character (!@#$%^&*)",
    },
  },
  passwordConfirm: {
    in: ["body"],
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      },
    },
  },
};

export const PATCH = {
  username: {
    in: ["body"],
    customSanitizer: {
      options: (value) => (value === "" ? undefined : value),
    },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 20 },
      errorMessage: "Username must be 3-20 characters long",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage:
        "Username must be one word and contain only letters, numbers, or underscores",
    },
  },
  email: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isEmail: {
      errorMessage: "Invalid email address",
    },
    normalizeEmail: true,
  },
  role: {
    in: ["body"],
    optional: { options: { nullable: true } },
    toInt: true,
  },
  password: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "Password must be at least 8 characters",
    },
    matches: {
      options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/],
      errorMessage:
        "Password must include at least one of all the following: uppercase, lowercase letter, number, special character (!@#$%^&*)",
    },
    custom: {
      options: (value, { req }) => {
        if (
          (value && !req.body?.passwordConfirm) ||
          value !== req.body?.passwordConfirm
        ) {
          throw new Error("Passwords do not match");
        }
        return true;
      },
    },
  },
  passwordConfirm: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value, { req }) => {
        if ((value && !req.body?.password) || value !== req.body?.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      },
    },
  },
};
