import hu from "/translation/hu.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

const isDev = true;

const translations = { hu };

function logError(response, message, context) {
  console.groupCollapsed(
    `%c[NetworkError] ${context || "Unknown"}`,
    "color: red; font-weight: bold",
  );

  console.log("Context:", context);
  console.log("Message:", message);
  console.log("Success:", response?.success);
  console.log("Result:", response?.result);
  console.log("Raw response:", response);

  if (response?.result) {
    console.log("Error code:", response.result.code);
    console.log("Error name:", response.result.name);
  }

  console.groupEnd();
}

export default class NetworkErrorHandler {
  static translate(errorDefinition) {
    const defaultMessage = translations.hu.none;

    if (!errorDefinition) {
      return { message: defaultMessage };
    }

    return {
      message: translations["hu"][errorDefinition.name] || defaultMessage,
    };
  }

  static handle(
    response,
    { strict = false, failureFn = null, showToast = true, context = null } = {},
  ) {
    const baseFailure =
      !response?.success || (strict && response?.result == null);

    let customFailure = false;

    if (failureFn) {
      try {
        customFailure = failureFn(response);
      } catch (error) {
        customFailure = true;

        if (isDev) {
          console.warn("[NetworkErrorHandler] failureFn threw:", error);
        }
      }
    }

    const failure = baseFailure || customFailure;

    if (!failure) {
      return false;
    }

    let message = "";

    if (response?.result) {
      const translatedError = NetworkErrorHandler.translate(response.result);
      message = translatedError.message;
    } else if (response?.message) {
      message = response.message;
    } else {
      message = NetworkErrorHandler.translate(null).message;
    }

    if (isDev) {
      logError(response, message, context);
    }

    if (showToast) {
      ToastManager.ERROR(message || "");
    }

    return true;
  }
}
