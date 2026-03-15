class CustomError {
  static isCustomError(error) {
    return error instanceof CustomError;
  }

  constructor({ statusCode, definition } = {}) {
    this.statusCode = statusCode;
    this.definition = definition;
  }
}

export const TEST = new CustomError({
  statusCode: 500,
  definition: {
    name: "TestError",
    code: "ER_TEST",
    message: "This is a test error",
  },
});

export const USER_NOT_FOUND = new CustomError({
  statusCode: 404,
  definition: {
    name: "UserNotFoundError",
    code: "ER_USER_NOT_FOUND",
    message: "User not found",
  },
});

export const INVALID_CREDENTIALS = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidCredentialsError",
    code: "ER_INV_CREDS",
    message: "Invalid credentials",
  },
});

export const NO_DATA_PROVIDED = new CustomError({
  statusCode: 400,
  definition: {
    name: "NoDataProvidedError",
    code: "ER_NO_DATA_PROVIDED",
    message: "No data provided",
  },
});

export const NO_DATA_CHANGE = new CustomError({
  statusCode: 500,
  definition: {
    name: "NoDataChangeError",
    code: "ER_NO_DATA_CHANGE",
    message: "Update skipped: submitted data matches existing",
  },
});

export const INVALID_REQUEST = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidRequestError",
    code: "ER_INV_REQ",
    message: "Invalid request",
  },
});

export const INVALID_TOKEN = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidTokenError",
    code: "ER_INV_TKN",
    message: "Invalid token",
  },
});

export const PROFILE_NOT_FOUND = new CustomError({
  statusCode: 404,
  definition: {
    name: "ProfileNotFoundError",
    code: "ER_PROFILE_NOT_FOUND",
    message: "Profile not found",
  },
});

export const INI_BLOCKED_REC = new CustomError({
  statusCode: 403,
  definition: {
    name: "InitiatorBlockedRecipientError",
    code: "ER_INI_BLOCKED_REC",
    message: "Unable to proceed, the user is blocked",
  },
});

export const REC_BLOCKED_INI = new CustomError({
  statusCode: 500,
  definition: {
    name: "RecipientBlockedInitiatorError",
    code: "ER_REC_BLOCKED_INI",
    message: "The recipient has blocked the initiator",
  },
});

export const UNAUTHORIZED = new CustomError({
  statusCode: 401,
  definition: {
    name: "UnauthorizedError",
    code: "ER_UNAUTH",
    message: "Unauthorized",
  },
});

export function isCustomError(error) {
  return error instanceof CustomError;
}
