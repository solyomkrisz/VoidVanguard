/**
 * Kezdobarat magyarazat:
 * Fajl: backend/common/Permission.js
 * Szerep: Egyszeru olvasasi-irasi jogosultsagszintek kozos konstansai.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// N = nincs jog, R = olvasas, W = iras. A kod tobbi resze ezekkel a rovid szintekkel hasonlit engedelyeket.
export default {
  N: 0,
  R: 1,
  W: 2,
};
