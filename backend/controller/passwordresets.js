/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/passwordresets.js
 * Szerep: Jelszovisszaallitasi kerelmek es tokenes jelszocsere HTTP-folyamanak vezerlese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/passwordresets.js";
import {
  createResponse,
  handleCaughtError,
  handleSequelizeUniqueConstraintError,
  isSequelizeUniqueConstraintError,
} from "../common/common.js";
import Role from "../common/Role.js";
import * as CustomError from "../common/CustomError.js";

import { RateLimiterMemory } from "rate-limiter-flexible";
const resetLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 600, // per 600 seconds (10 min)
});
// Kulon email-limit is van, hogy ugyanarra a cimre se lehessen rovid ido alatt tul sok resetkerelmet kuldeni.
export const emailLimiter = new RateLimiterMemory({
  points: 3, // allow 3 attempts
  duration: 15 * 60, // per 15 minutes
});

export async function requestPasswordReset(request, response) {
  const ip = request.ip;
  const email = request.body.email;

  try {
    // Kettozott limiter ved: IP-re es email-cimre is, hogy ne lehessen konnyen spamolni a reset endpointot.
    await resetLimiter.consume(ip);
    await emailLimiter.consume(email);
  } catch (error) {
    const retryAfter = Math.ceil((error?.msBeforeNext || 300000) / 1000);

    // Szandekosan sikeresnek tuno valaszt adunk vissza ilyenkor is, hogy ne lehessen a valaszokbol usert vagy rate-limit allapotot feltérképezni.
    return response
      .status(200)
      .json(
        createResponse(
          true,
          { retryAfter },
          "Az emailt elküldtük a megadott címre",
        ),
      );
  }

  try {
    await service.createForUserWithEmail({ email });

    response
      .status(200)
      .json(createResponse(true, null, "Az emailt elküldtük a megadott címre"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function resetPassword(request, response) {
  try {
    // A controller csak tovabbitja a tokent es az uj jelszot, a tenyleges ervenyesites es session-torles a service-ben tortenik.
    const result = await service.resetPassword({
      token: request.body.token,
      password: request.body.password,
    });

    response
      .status(200)
      .json(createResponse(true, null, "A jelszó sikeresen visszaállítva"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
