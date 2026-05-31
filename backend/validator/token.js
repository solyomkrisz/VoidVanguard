/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/token.js
 * Szerep: Tokenhez tartozo route-parameterek formai ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { isValidUUIDv4 } from "../common/common.js";

export const DELETE = {
  id: {
    in: ["params"],
    custom: {
      options: (value) => {
        // A session-t itt az URL-ben kapott UUID azonositja.
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen azonosító");
        }
        return true;
      },
    },
  },
};
