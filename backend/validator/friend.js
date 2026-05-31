/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/friend.js
 * Szerep: Validator reteg: bemeneti adatok szabalyellenorzese a hibak megelozesere.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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
