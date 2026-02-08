const { validate, version } = require("uuid");
const { query, body } = require("express-validator");

const GET = function (request, response, next) {
  const id = request.params.id;
  request.valid = validate(id) && version(id) === 4;
  next();
};

const POST = {
  username: {
    in: ["body"],
    isLength: {
      options: {
        min: 3,
        max: 20,
      },
      errorMessage: "Username must be 3-20 characters long",
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
      options: [/^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[!@#$%^&])/],
      errorMessage:
        "Password must include at least one of all the following: uppercase, lowercase letter, number, special character (!@#$%^&)",
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
  gender: {
    in: ["body"],
    isIn: {
      options: [["0", 0, "1", 1]],
      errorMessage: "Invalid gender",
    },
    customSanitizer: {
      options: (value) => {
        return parseInt(value);
      },
    },
  },
};

const DELETE = {};

module.exports = { GET, POST, DELETE };
