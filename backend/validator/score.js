export const GET = {
  limit: {
    in: ["query"],
    isInt: {
      options: { min: 0 },
      errorMessage: "Limit must be a non-negative integer",
    },
    toInt: true,
  },
  page: {
    in: ["query"],
    isInt: {
      options: { min: 0 },
      errorMessage: "Offset must be a non-negative integer",
    },
    toInt: true,
  },
  view: {
    in: ["query"],
    optional: true,
    isIn: {
      options: [["public", "private"]],
      errorMessage: "View must be either 'public' or 'private'",
    },
  },
};
