export const REQUEST = {
  email: {
    in: ["body"],
    isEmail: {
      errorMessage: "Invalid email address",
    },
    normalizeEmail: true,
  },
};

export const CONFIRM = {
  token: {
    in: ["body"],
    isString: {
      errorMessage: "Invalid token",
    },
    notEmpty: {
      errorMessage: "Token is required",
    },
    matches: {
      options: [/^[A-Za-z0-9\-_]+$/],
      errorMessage: "Invalid token format",
    },
    isLength: {
      options: { min: 40, max: 100 },
      errorMessage: "Invalid token length",
    },
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
