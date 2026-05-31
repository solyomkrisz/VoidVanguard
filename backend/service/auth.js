/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/auth.js
 * Szerep: Bejelentkezeshez es session-kezeléshez tartozo uzleti logika, tokenkiadassal egyutt.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import bcrypt from "bcrypt";
import * as CustomError from "../common/CustomError.js";
import Users from "../sql/table/Users.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Password from "../common/Password.js";
import Token from "../common/Token.js";
import { v4 as uuidv4 } from "uuid";

// Vegigfuttatja a bejelentkezesi folyamatot: user keresese, jelszoellenorzes, access es refresh token kiadas.
export async function login({
  username,
  password,
  ip = null,
  userAgent = null,
}) {
  // Először azonosítjuk a felhasználót, utána külön ellenőrizzük a jelszót.
  const user = await Users._selectByUsername(username);

  if (!user) {
    throw CustomError.INVALID_CREDENTIALS;
  }

  const match = await Password.compare(password, user.password_hash);

  if (!match) {
    throw CustomError.INVALID_CREDENTIALS;
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  // A rövid életű access token megy az API-hívásokhoz.
  const accessToken = Token.get(payload);

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 7 * 24 * 60 * 60;

  // A refresh token tovább él, ezzel lehet új access tokent kérni új belépés nélkül.
  const refreshToken = Token.get(
    payload,
    iat,
    exp,
    process.env.REFRESH_TOKEN_SECRET,
  );

  // await RefreshTokens.revokeAll(user.id);

  const refreshTokenHash = Token.hash(refreshToken);

  // Az adatbázisba nem a nyers refresh token kerül, hanem annak hash-e, így egy DB-szivárgás kevésbé veszélyes.
  RefreshTokens.save({
    id: uuidv4(),
    userId: user.id,
    tokenHash: refreshTokenHash,
    exp: new Date(exp * 1000),
    iat: new Date(iat * 1000),
    ip,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
    exp,
  };
}

// Kijelentkeztetesi oldalrol torli a refresh tokent tartalmazo HTTP-only cookie-t.
export function logout(response) {
  response.clearCookie("refresh_token", {
    path: "/api/tokens",
    sameSite: "Strict",
    httpOnly: true,
  });

  // response.clearCookie("access_token", {
  //   path: "/",
  //   sameSite: "Strict",
  //   httpOnly: true,
  // });

  console.log("Refresh token cookie törölve...");
}

// Az adott felhasznalo osszes aktiv refresh sessionjet megszunteti.
export async function destroyAllSessions({ userId }) {
  const result = await RefreshTokens.deleteAll(userId);
  return result;
}
