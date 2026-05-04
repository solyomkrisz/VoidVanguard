export const GET = {
  limit: {
    in: ["query"],
    isInt: {
      options: { min: 0 },
      errorMessage: "A limit nem-negatív egész szám kell legyen",
    },
    toInt: true,
  },
  page: {
    in: ["query"],
    isInt: {
      options: { min: 0 },
      errorMessage: "Az oldalszám nem-negatív egész szám kell legyen",
    },
    toInt: true,
  },
  view: {
    in: ["query"],
    optional: true,
    isIn: {
      options: [["public", "private"]],
      errorMessage: "A nézet csak 'public' vagy 'private' lehet",
    },
  },
};
