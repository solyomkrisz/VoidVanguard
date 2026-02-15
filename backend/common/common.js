const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validate, version } = require("uuid");
const { Friendship } = require("../sql/database.js");
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
      response.status(401).json(createResponse(false, null, "Unauthorized"));
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
    const roles = request.user?.roles;
    if (!roles || !roles.includes(requiredRole)) {
      return options.onMismatch(request, response, next);
    }
    options.onMatch(request, response, next);
  };
}

function modifyTargetUser(requiredRole = "admin") {
  return function (request, response, next) {
    if (!request.user.roles.includes(requiredRole)) {
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
  const user_a_id = request?.user?.sub;
  const user_b_id = request?.params?.id;

  if (!user_a_id || !user_b_id) {
    return false;
  }

  return Friendship.exists(user_a_id, user_b_id);
}

module.exports = {
  createResponse,
  clearRefreshTokenCookie,
  authenticate,
  authorize,
  modifyTargetUser,
  isValidUUIDv4,
  isFriend,
};
