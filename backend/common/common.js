/**
 * Kezdobarat magyarazat:
 * Fajl: backend/common/common.js
 * Szerep: Központi backend middleware-ek és segedek authhoz, validaciohoz, hibakezeleshez es altalanos API-valaszokhoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";
import { validate, version } from "uuid";
import { validationResult } from "express-validator";
import * as CustomError from "./CustomError.js";
import Role from "./Role.js";
import { execute } from "../sql/database.js";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  // Az uploadolt fajlok ugyanarra a helyre kerulnek, a nevuk pedig idobelyeget kap, hogy kisebb legyen az utkozes eselye.
  destination: (request, file, callback) => {
    callback(null, path.join(__dirname, "../uploads"));
  },
  filename: (request, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname); // egyedi név: dátum - file eredeti neve
  },
});

// A multer-peldanyt az API route-ok ujrahasznalhatjak attol fuggoen, hogy fajlt vagy csak sima form mezoket varnak.
export const upload = multer({ storage });

export function createResponse(success, result, message = null) {
  // Minden controller ugyanebbe az egységes valaszformaba csomagol, hogy a frontendnek ne endpointonkent kelljen mas formatumot kezelnie.
  return {
    success,
    result,
    message,
  };
}

export function authenticate(
  options = {
    onValidAccessToken: (_, _1, next) => {
      next();
    },
    onInvalidAccessToken: (_, response, _1) => {
      const error = CustomError.UNAUTHORIZED;

      response
        .status(error.statusCode)
        .json(
          createResponse(false, error.definition, error.definition.message),
        );
    },
  },
) {
  return function (request, response, next) {
    // Eloszor megprobaljuk az Authorization: Bearer fejlécből kinyerni az access tokent, mert ez a legszabvanyosabb kuldési forma.
    // const authorization = request?.headers?.authorization;
    // if (!authorization) {
    //   return options.onInvalidAccessToken(request, response, next);
    // }
    // const tmp = authorization.split(" ");
    // if (tmp.length < 2 || tmp[0] !== "Bearer") {
    //   return options.onInvalidAccessToken(request, response, next);
    // }
    // const accessToken = tmp[1];
    // if (!accessToken) {
    //   return options.onInvalidAccessToken(request, response, next);
    // }

    let accessToken;
    const authorization = request?.headers?.authorization;

    if (authorization) {
      const tmp = authorization?.split?.(" ");
      if (tmp?.length === 2 && tmp[0] === "Bearer") {
        accessToken = tmp[1];
      }
    }

    if (!accessToken) {
      // Ha headerben nincs token, megprobaljuk cookie-bol is, mert a kliens ebben a projektben mindket modot hasznalhatja.
      accessToken = request?.cookies?.access_token;
    }

    if (!accessToken) {
      // A tovabbi viselkedest a route adja meg: van ahol ez azonnali 401, mashol optional auth miatti tovabblepes.
      return options.onInvalidAccessToken(request, response, next);
    }

    try {
      // Sikeres verifikacio utan a payload egyszerre lesz request.user es alapertelmezett request.targetUser.
      const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      request.user = payload;
      request.targetUser = payload;
      options.onValidAccessToken(request, response, next);
    } catch (error) {
      // console.log(`Access token: ${accessToken}`, error);
      options.onInvalidAccessToken(request, response, next);
    }
  };
}

export function authorize(
  requiredRole,
  options = {
    onMatch: (_, _1, next) => {
      next();
    },
    onMismatch: (_, response, _1) => {
      const error = CustomError.FORBIDDEN;
      response
        .status(403)
        .json(
          createResponse(
            error.statusCode,
            error.definition,
            error.definition.message,
          ),
        );
    },
  },
) {
  return function (request, response, next) {
    // Az authorize mar a korabban feloldott request.user-ra tamaszkodik, ezert tipikusan authenticate utan erdemes hasznalni.
    if (!request?.user) {
      return options.onMismatch(request, response, next);
    }
    const role = request.user?.role;
    // A szerepkor szama legalabb akkora kell legyen, mint a route altal elvart minimum szint.
    if (!role || role < requiredRole) {
      return options.onMismatch(request, response, next);
    }
    options.onMatch(request, response, next);
  };
}

export function modifyTargetUser(requiredRole = Role.ADMIN) {
  return function (request, response, next) {
    // Ez a middleware csak kellően magas szerepkor mellett engedi atirni, ki legyen a muvelet celpontja.
    if (!request?.user || request.user.role < requiredRole) {
      return next();
    }

    // A cel user tipikusan body vagy query mezobol jon, mert admin muveleteknel nem mindig ugyanaz a requester es a target.
    const targetUserId =
      request?.body?.targetUserId || request?.query?.targetUserId;

    if (!targetUserId) {
      return next();
    }

    if (!request.targetUser) {
      request.targetUser = { ...request.user };
    }

    request.targetUser.id = targetUserId;
    next();
  };
}

export function isValidUUIDv4(id) {
  // Sok validatornak kell ugyanaz a UUID v4 ellenorzes, ezert kozos helperben van kiszervezve.
  return validate(id) && version(id) === 4;
}

export function handleCaughtError(response, error) {
  // Eloszor eldontjuk, ismert uzleti hiba-e; ha igen, a hozza tartozo statuszkoddal es hibaleirassal kuldjuk vissza.
  console.log(error);

  if (CustomError.isCustomError(error)) {
    return response
      .status(error.statusCode)
      .json(createResponse(false, error.definition, error.definition.message));
  }

  return response
    .status(500)
    .json(createResponse(false, null, "An unexpected error occurred"));
}

export function handleExpressValidatorErrors(response, errors) {
  // A validator hibak kozul itt szandekosan csak az elso uzenetet adjuk vissza, hogy a kliens rovid, egyertelmu hibavalaszt kapjon.
  return response
    .status(400)
    .json(createResponse(false, null, errors.array()[0].msg));
}

export function isSequelizeUniqueConstraintError(error) {
  // Ket kulonbozo adatbazis/ORM hibaformatumot fedunk le ugyanazzal a helperrel.
  return (
    error.name === "SequelizeUniqueConstraintError" ||
    error.code === "ER_DUP_ENTRY"
  );
}

export function handleSequelizeUniqueConstraintError(response, message) {
  // A duplikacios hibakat altalaban emberibb, endpoint-specifikus szoveggel akarjuk visszaadni.
  return response.status(400).json(createResponse(false, null, message));
}

export function handleValidation(request, response, next) {
  // Ez a kozos lepcso gyujti ossze az express-validator eredmenyet, hogy minden route ugyanugy kezelje a schemahibakat.
  const errors = validationResult(request);
  if (!errors.isEmpty()) return handleExpressValidatorErrors(response, errors);
  next();
}

// Ennyi percre ervenyes az access token; a Token helper ezt hasznalja alapertelmezett lejáratnak.
export const accessTokenLifetimeMin = 0.5;

export async function runQueryWithPagination(
  sql,
  baseParams = [],
  { limit = null, offset = null } = {},
) {
  // A hivo csak az alap SQL-t es a parametereket adja meg, a LIMIT/OFFSET reszt ez a helper illeszti hozza biztonsagos parameterezessel.
  const limitClause = limit != null ? "LIMIT ?" : "";
  const offsetClause = offset != null ? "OFFSET ?" : "";

  const finalSql = `
    ${sql}
    ${limitClause}
    ${offsetClause}
  `;

  const params = [...baseParams];

  if (limit != null) params.push(limit);
  if (offset != null) params.push(offset);

  const [rows] = await execute(finalSql, params);
  return rows;
}
