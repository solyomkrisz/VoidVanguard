/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/tokens.js
 * Szerep: Refresh tokennel mukodo session-listazo, tokenfrissito es kijelentkezteto vegpontok HTTP-kezelese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/tokens.js";
import * as authService from "../service/auth.js";
import {
  createResponse,
  handleCaughtError,
  accessTokenLifetimeMin,
} from "../common/common.js";
import * as CustomError from "../common/CustomError.js";

// Refresh vegpont: a cookieban kapott refresh tokenbol uj access tokent ker.
export async function refresh(request, response) {
  const token = request?.cookies?.refresh_token;

  try {
    if (!token) {
      throw CustomError.NO_REFRESH_TOKEN;
    }

    // A kliens csak a refresh tokent tarolja cookieban; ebbol keszul uj access token.
    const accessToken = await service.refresh(token);

    /** */
    // response.cookie("access_token", accessToken, {
    //   httpOnly: true,
    //   sameSite: "Strict",
    //   path: "/",
    //   maxAge: accessTokenLifetimeMin * 60 * 1000,
    // });
    /** */

    response
      .status(200)
      .json(
        createResponse(
          true,
          { access_token: accessToken },
          "Access token sikeresen frissítve",
        ),
      );
  } catch (error) {
    // authService.logout(response);
    handleCaughtError(response, error);
  }
}

// Lapozhato listaban adja vissza a user aktiv sessionjeit/tokenjeit.
export async function lazySelectActiveTokens(request, response) {
  try {
    const currentRefreshToken = request?.cookies?.refresh_token;

    const result = await service.lazySelectByUserId({
      userId: request?.targetUser?.id,
      currentRefreshToken,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Aktív tokenek sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Egy konkret session rekordot szuntet meg ID alapjan.
export async function revokeSessionById(request, response) {
  try {
    const currentRefreshToken = request?.cookies?.refresh_token;

    const result = await service.revokeSessionById({
      id: request.params.id,
      userId: request.targetUser.id,
      currentRefreshToken,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Munkamenet sikeresen megszüntetve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// A jelenlegi refresh tokenhez tartozo sessiont revoke-olja es a bongeszos cookie-t is takaritja.
export async function revokeSessionByToken(request, response) {
  const token = request?.cookies?.refresh_token;

  try {
    // A cookie-t akkor is toroljuk, ha a DB-ben mar nem talalunk hozza sessiont.
    authService.logout(response);

    if (token) {
      await service.revokeSessionByToken(token);
    }

    response
      .status(200)
      .json(createResponse(true, null, "Sikeres kijelentkezés"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
