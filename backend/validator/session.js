export const POST = {
  username: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
      },
      errorMessage: "A felhasználónév nem lehet üres",
    },
  },
  password: {
    in: ["body"],
    isLength: {
      options: {
        min: 1,
      },
      errorMessage: "A jelszó nem lehet üres",
    },
  },
};
