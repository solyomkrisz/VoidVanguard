const jwt = require("jsonwebtoken");
const { validate, version } = require("uuid");
const CustomError = require("./CustomError.js");
const Role = require("./Role.js");
const Friends = require("../sql/table/Friends.js");

function createResponse(success, result, message = null) {
  return {
    success,
    result,
    message,
  };
}

function clearRefreshTokenCookie(response) {
  response.cookie("refresh_token", "", {
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
    path: "/api/tokens",
  });
}

function authenticate(
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

function authorize(
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

function modifyTargetUser(requiredRole = Role.ADMIN) {
  return function (request, response, next) {
    if (request.user.role < requiredRole) {
      return next();
    }
    const targetUserId = request?.body?.targetUserId;
    if (!targetUserId) {
      return next();
    }
    request.targetUser = {
      sub: targetUserId,
    };
    next();
  };
}

function isValidUUIDv4(id) {
  return validate(id) && version(id) === 4;
}

async function isFriend(request) {
  const a_id = request?.user?.sub;
  const b_id = request?.params?.id;

  if (!a_id || !b_id) {
    return false;
  }

  return Friends.exists(a_id, b_id);
}

function handleCaughtError(response, error) {
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

function handleExpressValidatorErrors(response, errors) {
  return response
    .status(400)
    .json(createResponse(false, null, errors.array()[0].msg));
}

function isSequelizeUniqueConstraintError(error) {
  return (
    error.name === "SequelizeUniqueConstraintError" ||
    error.code === "ER_DUP_ENTRY"
  );
}

function handleSequelizeUniqueConstraintError(response, message) {
  return response.status(400).json(createResponse(false, null, message));
}

module.exports = {
  createResponse,
  clearRefreshTokenCookie,
  authenticate,
  authorize,
  modifyTargetUser,
  isValidUUIDv4,
  isFriend,
  handleCaughtError,
  handleExpressValidatorErrors,
  isSequelizeUniqueConstraintError,
  handleSequelizeUniqueConstraintError,
};
