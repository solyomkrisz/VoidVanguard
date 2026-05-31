/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/user.js
 * Szerep: Felhasznalo-regisztracios es frissitesi mezok ellenorzese, plusz UUID-alapu route validalas.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { isValidUUIDv4 } from "../common/common.js";

export function GET(request, response, next) {
  const id = request?.params?.id;
  // A controller kesobb ezt az egyszeru flaget nezi, nem itt dobunk hibát.
  request.valid = isValidUUIDv4(id);
  next();
}

export const POST = {
  username: {
    in: ["body"],
    trim: true,
    isLength: {
      options: {
        min: 3,
        max: 20,
      },
      errorMessage: "A felhasználónév 3 és 20 karakter között kell legyen",
    },
    notEmpty: {
      errorMessage: "A felhasználónév nem lehet üres vagy csak szóköz",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage:
        "A felhasználónév csak egy szó lehet, és csak betűket, számokat vagy alulvonást tartalmazhat",
    },
  },
  email: {
    in: ["body"],
    isEmail: {
      errorMessage: "Érvénytelen e-mail cím",
    },
    normalizeEmail: true,
  },
  password: {
    in: ["body"],
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "A jelszónak legalább 8 karakter hosszúnak kell lennie",
    },
    matches: {
      options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/],
      errorMessage:
        "A jelszónak tartalmaznia kell legalább egyet a következők közül: nagybetű, kisbetű, szám, speciális karakter (!@#$%^&*)",
    },
  },
  passwordConfirm: {
    in: ["body"],
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("A jelszavak nem egyeznek meg");
        }
        return true;
      },
    },
  },
};

export const PATCH = {
  username: {
    in: ["body"],
    customSanitizer: {
      // Az ures stringet eltuntetjuk, hogy PATCH-nel ne akarjon ures ertekkel felulirni.
      options: (value) => (value === "" ? undefined : value),
    },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 20 },
      errorMessage: "A felhasználónév 3 és 20 karakter között kell legyen",
    },
    notEmpty: {
      errorMessage: "A felhasználónév nem lehet üres vagy csak szóköz",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage:
        "A felhasználónév csak egy szó lehet, és csak betűket, számokat vagy alulvonást tartalmazhat",
    },
  },
  email: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isEmail: {
      errorMessage: "Érvénytelen e-mail cím",
    },
    normalizeEmail: true,
  },
  role: {
    in: ["body"],
    optional: { options: { nullable: true } },
    toInt: true,
  },
  password: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "A jelszónak legalább 8 karakter hosszúnak kell lennie",
    },
    matches: {
      options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/],
      errorMessage:
        "A jelszónak tartalmaznia kell legalább egyet a következők közül: nagybetű, kisbetű, szám, speciális karakter (!@#$%^&*)",
    },
    custom: {
      options: (value, { req }) => {
        // PATCH-nel a ket jelszomezonek parban kell megjelennie es egyeznie.
        if (
          (value && !req.body?.passwordConfirm) ||
          value !== req.body?.passwordConfirm
        ) {
          throw new Error("A jelszavak nem egyeznek meg");
        }
        return true;
      },
    },
  },
  passwordConfirm: {
    in: ["body"],
    optional: { options: { nullable: true } },
    custom: {
      options: (value, { req }) => {
        // Ugyanezt az ellenorzest a masik iranybol is megtesszuk, hogy egyik mezo se mehessen at egyedul.
        if ((value && !req.body?.password) || value !== req.body?.password) {
          throw new Error("A jelszavak nem egyeznek meg");
        }
        return true;
      },
    },
  },
};
