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

export const INVALID_RESET_TOKEN = new CustomError({
  statusCode: 400,
  definition: {
    name: "InvalidResetTokenError",
    code: "ER_INV_RTKN",
    message: "Invalid reset token",
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

export const BOTH_BLOCKED = new CustomError({
  statusCode: 500,
  definition: {
    name: "BothBlockedError",
    code: "ER_BOTH_BLOCKED",
    message: "Both users have blocked each other",
  },
});

export const CANNOT_BLOCK_YOURSELF = new CustomError({
  statusCode: 500,
  definition: {
    name: "CannotBlockYourselfError",
    code: "ER_INV_BLOCK_TARG",
    message: "Cannot block yourself",
  },
});

export const UNABLE_TO_UNBLOCK = new CustomError({
  statusCode: 500,
  definition: {
    name: "UnableToUnblockError",
    code: "ER_UNABLE_TO_UNBLOCK",
    message: "Unable to unblock: the block does not exist",
  },
});

export const CANNOT_FRIEND_YOURSELF = new CustomError({
  statusCode: 500,
  definition: {
    name: "CannotFriendYourselfError",
    code: "ER_FRIEND_YOURSELF",
    message: "You cannot friend yourself",
  },
});

export const FRIENSHIP_ALREADY_EXISTS = new CustomError({
  statusCode: 500,
  definition: {
    name: "FriendshipExistsError",
    code: "ER_FRIEND_ALRD_EXISTS",
    message: "A friendship already exists",
  },
});

export const UNABLE_TO_ACCEPT_FR_REQ = new CustomError({
  statusCode: 500,
  definition: {
    name: "UnableToAcceptFriendRequestError",
    code: "ER_FR_REQ",
    message: "Unable to accept friend request, it does not exist",
  },
});

export const UNABLE_TO_REMOVE_FRIEND = new CustomError({
  statusCode: 500,
  definition: {
    name: "UnableToRemoveFriendError",
    code: "ER_FR_REM",
    message: "Unable to delete friendship, it does not exist",
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

export const FORBIDDEN = new CustomError({
  statusCode: 403,
  definition: {
    name: "ForbiddenError",
    code: "ER_FORBIDDEN",
    message: "You do not have permission to perform this action",
  },
});

export const SAVE_ERROR = new CustomError({
  statusCode: 403,
  definition: {
    name: "SaveErro",
    code: "ER_SAVE",
    message: "Unable to save game state",
  },
});

export const DUPLICATE_SAVE_STATE = new CustomError({
  statusCode: 409,
  definition: {
    name: "DuplicateSaveStateError",
    code: "ER_DUP_SAVE_STATE",
    message: "A save with this game state already exists",
  },
});

export const PASSWORD_UPDATE = new CustomError({
  statusCode: 500,
  definition: {
    name: "PasswordUpdateError",
    code: "ER_PWD_UPDATE",
    message: "Unable to update password",
  },
});

export const REFRESH_TOKEN_EXPIRED = new CustomError({
  statusCode: 401,
  definition: {
    name: "RefreshTokenExpirationError",
    code: "ER_RFH_TKN_EXP",
    message: "Refresh token expired",
  },
});

export const NO_REFRESH_TOKEN = new CustomError({
  statusCode: 400,
  definition: {
    name: "NoRefreshTokenError",
    code: "ER_NO_RFH_TKN",
    message: "No refresh token was provided",
  },
});

export const UNABLE_TO_END_SESSION = new CustomError({
  statusCode: 500,
  definition: {
    name: "SessionDestroyError",
    code: "ER_SESSION_DESTROY",
    message: "Unable to end session",
  },
});

export const CANNOT_BAN_YOURSELF = new CustomError({
  statusCode: 400,
  definition: {
    name: "CannotBanYourselfError",
    code: "ER_CANNOT_BAN_YOURSELF",
    message: "Cannot ban yourself",
  },
});

export const BAN_HIGHER_ROLE_ERROR = new CustomError({
  statusCode: 400,
  definition: {
    name: "BanHigherRoleError",
    code: "ER_BAN_HIGHER_ROLE",
    message: "You cannot ban someone with the same or higher role as yourself",
  },
});

export function isCustomError(error) {
  return error instanceof CustomError;
}
