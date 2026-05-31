/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/tokens.js
 * Szerep: Refresh tokenes sessionok ellenorzese, listazasa es visszavonasa.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import bcrypt from "bcrypt";
import * as CustomError from "../common/CustomError.js";
import Token from "../common/Token.js";
import RefreshTokens from "../sql/table/RefreshTokens.js";
import Users from "../sql/table/Users.js";

// A userhoz tartozo egy aktiv token/session rekordot ker le.
export async function find({ userId }) {
  const row = await RefreshTokens.findForUser(userId);
  return row;
}

// Token-hash alapjan keres session rekordot.
export async function findHash({ tokenHash }) {
  const row = await RefreshTokens.findByHash(tokenHash);
  return row;
}

// Az adott felhasznalo osszes refresh sessionjet torli.
export async function deleteAll({ userId } = {}) {
  const [result] = await RefreshTokens.deleteAll(userId);
  return result;
}

// Ellenorzi a refresh tokent, majd belole uj access tokent allit elo.
export async function refresh(refreshToken) {
  let payload;

  try {
    payload = Token.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw CustomError.REFRESH_TOKEN_EXPIRED;
    }

    throw CustomError.INVALID_TOKEN;
  }

  if (!payload?.id) {
    throw CustomError.INVALID_TOKEN;
  }

  // Nem elég, hogy a token formailag jó: az adatbázisban is léteznie kell aktív sessionként.
  const refreshTokenHash = Token.hash(refreshToken);

  const row = await findHash({ tokenHash: refreshTokenHash });

  if (!row) {
    throw CustomError.INVALID_TOKEN;
  }

  const user = await Users.payload(payload.id);

  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  // Sikeres ellenőrzés után csak új access tokent adunk vissza, a refresh token marad ugyanaz.
  const accessToken = Token.get(user);

  await RefreshTokens.updateLastUsedAt(refreshTokenHash);

  return accessToken;
}

// Lapozhato listat ad a user aktiv sessionjeirol, kulon megjelolve az aktualis bongeszos sessiont is.
export async function lazySelectByUserId({
  userId,
  currentRefreshToken = null,
  page = 1,
  limit = 20,
} = {}) {
  const offset = (page - 1) * limit;

  const currentRefreshTokenHash = currentRefreshToken
    ? Token.hash(currentRefreshToken)
    : null;

  const tokens = await RefreshTokens.lazySelectActiveByUserId(
    userId,
    currentRefreshTokenHash,
    {
      limit,
      offset,
    },
  );
  const total = await RefreshTokens.getTotalActiveTokensByUserId(userId);

  return {
    tokens,
    page,
    limit,
    total,
    hasNext: offset + tokens.length < total,
  };
}

// Egy sessiont ID alapjan torol, es jelzi, hogy ez volt-e a jelenlegi kliens sessionje.
export async function revokeSessionById({ id, userId, currentRefreshToken }) {
  let currentSession = {};

  if (currentRefreshToken) {
    // Megnézzük, hogy a törlendő session éppen az-e, amellyel most a felhasználó dolgozik.
    const currentRefreshTokenHash = Token.hash(currentRefreshToken);
    currentSession = await RefreshTokens.findByHash(currentRefreshTokenHash);
  }

  console.log("CURRENT TOKEN: ", currentRefreshToken);
  console.log("CURRENT SESSION: ", currentSession);

  const result = await RefreshTokens.deleteById(id, userId);

  let deleted = false,
    logout = false;

  if (result.affectedRows >= 1) {
    deleted = true;

    // Ha a saját aktuális sessiont törölte, a kliensnek ki kell majd léptetnie a felhasználót.
    if (currentSession?.id === id) {
      logout = true;
    }
  }

  return { deleted, logout };
}

// A kapott refresh tokenhez tartozo sessiont visszavonja.
export async function revokeSessionByToken(refreshToken) {
  const tokenHash = Token.hash(refreshToken);
  const result = await RefreshTokens.deleteByTokenHash(tokenHash);

  return true;
}
