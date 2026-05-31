/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/passwordreset.js
 * Szerep: Validator reteg: bemeneti adatok szabalyellenorzese a hibak megelozesere.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export const REQUEST = {
  email: {
    in: ["body"],
    isEmail: {
      errorMessage: "Érvénytelen e-mail cím",
    },
    normalizeEmail: true,
  },
};

export const CONFIRM = {
  token: {
    in: ["body"],
    isString: {
      errorMessage: "Érvénytelen token",
    },
    notEmpty: {
      errorMessage: "A token megadása kötelező",
    },
    matches: {
      options: [/^[A-Za-z0-9\-_]+$/],
      errorMessage: "Érvénytelen token formátum",
    },
    isLength: {
      options: { min: 40, max: 100 },
      errorMessage: "Érvénytelen token hossz",
    },
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
          throw new Error("A jelszavak nem egyeznek");
        }
        return true;
      },
    },
  },
};
