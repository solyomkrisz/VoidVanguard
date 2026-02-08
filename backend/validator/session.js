const POST = {
  username: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
      },
      errorMessage: "Username must not be empty",
    },
  },
  password: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
      },
      errorMessage: "Password must no be empty",
    },
  },
};

module.exports = { POST };
