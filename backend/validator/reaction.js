/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/reaction.js
 * Szerep: Validator reteg: bemeneti adatok szabalyellenorzese a hibak megelozesere.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { isValidUUIDv4 } from "../common/common.js";

export const GET = {
  targetId: {
    in: ["params"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen célazonosító");
        }
        return true;
      },
    },
  },
};

export const POST = {
  targetId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen célazonosító");
        }
        return true;
      },
    },
  },
  type: {
    in: ["body"],
    isIn: {
      options: [["like", "dislike"]],
      errorMessage: "Érvénytelen reakció típus",
    },
  },
};
