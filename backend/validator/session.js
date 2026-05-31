/**
 * Kezdobarat magyarazat:
 * Fajl: backend/validator/session.js
 * Szerep: Bejelentkezesi kerelmek kotelezo username es password mezoit ellenorzi.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export const POST = {
  // Itt csak a minimumot nezzuk: a pontosabb hitelesites mar a service reteg feladata.
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
