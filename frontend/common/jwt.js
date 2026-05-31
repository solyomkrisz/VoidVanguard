/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/jwt.js
 * Szerep: JWT dekodolas es lejaratellenorzes alkalmazas szinten.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// A JWT payload reszet biztonsagosan kicsomagolja JavaScript objektumma.
export function decode(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const base64Url = parts[1];
  if (!base64Url) return null;

  try {
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const payload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );

    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

// Megmondja, hogy a token mar lejart-e, vagy a buffer miatt mindjart le fog-e jarni.
export function isExpired(token, bufferSeconds = 0) {
  const payload = decode(token);

  if (!payload?.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);

  return now >= payload.exp - bufferSeconds;
}
