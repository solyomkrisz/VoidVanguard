import { validate } from "uuid";

export const POST = {
  userId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!validate(value)) {
          throw new Error("Érvénytelen felhasználóazonosító");
        }
        return true;
      },
    },
  },
};
