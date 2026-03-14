import jwt from "jsonwebtoken";
import { validate, version } from "uuid";
import { validationResult } from "express-validator";
import * as CustomError from "./CustomError.js";
import Role from "./Role.js";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, path.join(__dirname, "../uploads"));
  },
  filename: (request, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname); // egyedi név: dátum - file eredeti neve
  },
});

export const upload = multer({ storage });

export function createResponse(success, result, message = null) {
  return {
    success,
    result,
    message,
  };
}

export function authenticate(
  opitons = {
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
    const authorization = request?.headers?.authorization;
    if (!authorization) {
      return opitons.onInvalidAccessToken(request, response, next);
    }
    const tmp = authorization.split(" ");
    if (tmp.length < 2 || tmp[0] !== "Bearer") {
      return opitons.onInvalidAccessToken(request, response, next);
    }
    const accessToken = tmp[1];
    if (!accessToken) {
      return opitons.onInvalidAccessToken(request, response, next);
    }
    try {
      const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      request.user = payload;
      request.targetUser = payload;
      opitons.onValidAccessToken(request, response, next);
    } catch (error) {
      opitons.onInvalidAccessToken(request, response, next);
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
      response.status(403).json(createResponse(false, null, "Forbidden"));
    },
  },
) {
  return function (request, response, next) {
    if (!request?.user) {
      return options.onMismatch(request, response, next);
    }
    const role = request.user?.role;
    if (!role || role < requiredRole) {
      return options.onMismatch(request, response, next);
    }
    options.onMatch(request, response, next);
  };
}

export function modifyTargetUser(requiredRole = Role.ADMIN) {
  return function (request, response, next) {
    if (request.user.role < requiredRole) {
      return next();
    }
    const targetUserId = request?.body?.targetUserId;
    if (!targetUserId) {
      return next();
    }
    request.targetUser = {
      id: targetUserId,
    };
    next();
  };
}

export function isValidUUIDv4(id) {
  return validate(id) && version(id) === 4;
}

export function handleCaughtError(response, error) {
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
  return response
    .status(400)
    .json(createResponse(false, null, errors.array()[0].msg));
}

export function isSequelizeUniqueConstraintError(error) {
  return (
    error.name === "SequelizeUniqueConstraintError" ||
    error.code === "ER_DUP_ENTRY"
  );
}

export function handleSequelizeUniqueConstraintError(response, message) {
  return response.status(400).json(createResponse(false, null, message));
}

export function handleValidation(request, response, next) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) return handleExpressValidatorErrors(response, errors);
  next();
}
