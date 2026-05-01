import hu from "/translation/hu.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

const translations = { hu };

export default class NetworkErrorHandler {
  static translate(errorDefinition) {
    if (!errorDefinition) {
      return { message: translations["hu"]["none"] };
    }

    return {
      message:
        translations["hu"][errorDefinition.name] || translations["hu"]["none"],
    };
  }

  static handle(response, strict = false, failureFn = null) {
    const baseFailure =
      !response?.success || (strict && response?.result == null);

    const failure = failureFn
      ? baseFailure || failureFn(response)
      : baseFailure;

    if (failure) {
      let message;

      if (response?.result) {
        const translatedError = NetworkErrorHandler.translate(response.result);
        message = translatedError.message;
      } else if (response?.message) {
        // raw backend message (validation)
        message = response.message;
      } else {
        message = NetworkErrorHandler.translate(null).message;
      }

      ToastManager.ERROR(message || "");
    }

    return failure;
  }
}
