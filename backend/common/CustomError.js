class CustomError {
  static isCustomError(error) {
    return error instanceof CustomError;
  }

  constructor({ statusCode, definition } = {}) {
    this.statusCode = statusCode;
    this.definition = definition;
  }
}

const TEST = new CustomError({
  statusCode: 500,
  definition: {
    name: "TestError",
    code: "ER_TEST",
    message: "This is a test error",
  },
});

const USER_NOT_FOUND = new CustomError({
  statusCode: 404,
  definition: {
    name: "UserNotFoundError",
    code: "ER_USER_NOT_FOUND",
    message: "User not found",
  },
});

const INVALID_CREDENTIALS = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidCredentialsError",
    code: "ER_INV_CREDS",
    message: "Invalid credentials",
  },
});

const NO_DATA_PROVIDED = new CustomError({
  statusCode: 400,
  definition: {
    name: "NoDataProvidedError",
    code: "ER_NO_DATA_PROVIDED",
    message: "No data provided",
  },
});

const NO_DATA_CHANGE = new CustomError({
  statusCode: 500,
  definition: {
    name: "NoDataChangeError",
    code: "ER_NO_DATA_CHANGE",
    message: "Update skipped: submitted data matches existing",
  },
});

const INVALID_REQUEST = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidRequestError",
    code: "ER_INV_REQ",
    message: "Invalid request",
  },
});

const INVALID_TOKEN = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidTokenError",
    code: "ER_INV_TKN",
    message: "Invalid token",
  },
});

const PROFILE_NOT_FOUND = new CustomError({
  statusCode: 404,
  definition: {
    name: "ProfileNotFoundError",
    code: "ER_PROFILE_NOT_FOUND",
    message: "Profile not found",
  },
});

const INI_BLOCKED_REC = new CustomError({
  statusCode: 403,
  definition: {
    name: "InitiatorBlockedRecipientError",
    code: "ER_INI_BLOCKED_REC",
    message: "Unable to proceed, the user is blocked",
  },
});

const REC_BLOCKED_INI = new CustomError({
  statusCode: 500,
  definition: {
    name: "RecipientBlockedInitiatorError",
    code: "ER_REC_BLOCKED_INI",
    message: "The recipient has blocked the initiator",
  },
});

const UNAUTHORIZED = new CustomError({
  statusCode: 401,
  definition: {
    name: "UnauthorizedError",
    code: "ER_UNAUTH",
    message: "Unauthorized",
  },
});

function isCustomError(error) {
  return error instanceof CustomError;
}

module.exports = {
  isCustomError,
  TEST,
  USER_NOT_FOUND,
  INVALID_CREDENTIALS,
  NO_DATA_PROVIDED,
  NO_DATA_CHANGE,
  INVALID_REQUEST,
  INVALID_TOKEN,
  PROFILE_NOT_FOUND,
  INI_BLOCKED_REC,
  REC_BLOCKED_INI,
  UNAUTHORIZED,
};
