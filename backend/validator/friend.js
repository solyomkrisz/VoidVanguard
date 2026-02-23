const { isValidUUIDv4 } = require("../common/common.js");

const POST = {
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

module.exports = { POST };
