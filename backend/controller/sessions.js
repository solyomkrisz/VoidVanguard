/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/sessions.js
 * Szerep: Bejelentkezes es minden session lezarasanak HTTP-kezelese, refresh cookie beallitassal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/auth.js";
import {
  createResponse,
  handleCaughtError,
  accessTokenLifetimeMin,
} from "../common/common.js";

// A login vegpont HTTP-szintje: kerest kibont, service-t hiv, cookie-t allit, valaszt kuld.
export async function login(request, response) {
  try {
    const ip = request.ip ?? null;
    const userAgent = request.headers["user-agent"] ?? null;

    const { accessToken, refreshToken, exp } = await service.login({
      username: request.body.username,
      password: request.body.password,
      ip,
      userAgent,
    });

    // A refresh token HTTP-only cookieba megy, hogy a bongeszo kuldhesse, de a JS ne olvashassa ki.
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/tokens",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // response.cookie("access_token", accessToken, {
    //   httpOnly: true,
    //   sameSite: "Strict",
    //   path: "/",
    //   maxAge: accessTokenLifetimeMin * 60 * 1000,
    // });

    console.log("Refresh és access token cookie-k beállítva...");

    response
      .status(200)
      .json(
        createResponse(
          true,
          { access_token: accessToken },
          "Sikeres bejelentkezés",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

// Minden session bezarasahoz torli a cookie-t es az adatbazisban levo refresh rekordokat is.
export async function destroyAllSessions(request, response) {
  try {
    // A jelenlegi bongeszos session cookiejat is azonnal toroljuk, ne csak az adatbazisrekordokat.
    service.logout(response);

    const userId = request?.targetUser?.id;

    if (userId) {
      await service.destroyAllSessions({ userId });
    }

    response
      .status(200)
      .json(createResponse(true, null, "Minden munkamenet sikeresen lezárva"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
