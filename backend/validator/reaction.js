const { isValidUUIDv4 } = require("../common/common.js");

const POST = {
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
  reactionType: {
    in: ["body"],
    isIn: {
      options: [["0", 0, "1", 1]],
      errorMessage: "Invalid reaction type",
    },
    customSanitizer: {
      options: (value) => {
        return parseInt(value);
      },
    },
  },
};

module.exports = { POST };
