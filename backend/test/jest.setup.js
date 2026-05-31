/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/jest.setup.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
process.env.ACCESS_TOKEN_SECRET = "test-access-secret-for-jest-12345";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-for-jest-12345";
process.env.REFRESH_TOKEN_HASH_SECRET = "test-hash-secret-for-jest-12345";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";
