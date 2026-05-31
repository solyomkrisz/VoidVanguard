/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/admin.js
 * Szerep: Admin tiltasi vegpontok UUID, indoklas es lejarati ido mezoinak ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { isValidUUIDv4 } from "../common/common.js";

export const BAN_STATUS = {
  targetUserId: {
    in: ["query"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen felhasználóazonosító");
        }
        return true;
      },
    },
  },
};

export const BAN = {
  userId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen felhasználóazonosító");
        }
        return true;
      },
    },
  },
  reason: {
    in: ["body"],
    optional: {
      options: { nullable: true },
    },
    isString: {
      errorMessage: "Az indok szövegnek kell lennie",
    },
    isLength: {
      options: { max: 60 },
      errorMessage: "Az indok legfeljebb 60 karakter hosszú lehet",
    },
    customSanitizer: {
      options: (value) => value ?? null,
    },
  },
  expiresAt: {
    in: ["body"],
    optional: {
      options: { nullable: true, checkFalsy: true },
    },
    isISO8601: {
      options: { strict: true },
      errorMessage:
        "A lejárati időpont mező érvényes dátum-idő érték kell legyen",
    },
    custom: {
      options: (value) => {
        if (!value) return true;

        const date = new Date(value);
        const minAllowed = new Date(Date.now() + 5 * 60 * 1000);

        // Legalabb egy kis minimum tavolsag kell, hogy ne jarjon le gyakorlatilag azonnal.
        if (isNaN(date.getTime())) {
          throw new Error("Érvénytelen dátum");
        }

        if (date < minAllowed) {
          throw new Error(
            "A lejárati időpont legalább 5 perccel a jövőben kell legyen",
          );
        }

        return true;
      },
    },
  },
};

export const UNBAN = {
  userId: {
    in: ["body"],
    custom: {
      options: (value) => {
        if (!isValidUUIDv4(value)) {
          throw new Error("Érvénytelen felhasználóazonosító");
        }
        return true;
      },
    },
  },
};
