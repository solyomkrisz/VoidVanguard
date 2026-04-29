import { isExpired, decode } from "./jwt.js";
import { logout } from "/common/common.js";

const pendingRequests = new Map();
const getReqKey = ({ method }, url) => `${method}:${url}`;

let refreshPromise = null;
function shouldSuppressErrorToast(url, options = {}, isProtected = true) {
  const method = String(options?.method || "GET").toUpperCase();

  let pathname = "";
  try {
    pathname = new URL(url, window.location.origin).pathname;
  } catch {
    pathname = String(url || "");
  }

  const onAuthPage = window.location.pathname === "/";
  const isAuthAction =
    method === "POST" &&
    (pathname === "/api/sessions" || pathname === "/api/users");

  // Autologin/session probe calls intentionally send no credentials.
  // If they fail for guests, avoid noisy validation toasts.
  const body = options?.body;
  const hasSessionCredentials = (() => {
    if (body == null) return false;

    if (typeof body === "string") {
      if (!body.trim()) return false;
      try {
        const parsed = JSON.parse(body);
        return Boolean(parsed?.username || parsed?.password);
      } catch {
        return false;
      }
    }

    if (body instanceof FormData) {
      return body.has("username") || body.has("password");
    }

    return false;
  })();

  const isSessionProbe =
    method === "POST" && pathname === "/api/sessions" && !hasSessionCredentials;

  return (onAuthPage && isAuthAction && !isProtected) || isSessionProbe;
}

function requestErrorToast(message, url, options = {}, isProtected = true) {
  if (!message) return;
  if (shouldSuppressErrorToast(url, options, isProtected)) return;

  document.dispatchEvent(
    new CustomEvent("toast-request", {
      detail: {
        toast: {
          message,
          delay: 0,
          duration: 3000,
          variant: "error",
        },
      },
    }),
  );
}

export function refreshAccessToken() {
  console.log("Refreshing access token...");

  if (refreshPromise) {
    console.log("Refresh is already in progress, returning that...");
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (token && !isExpired(token, 10)) {
        return { success: true, refreshed: false };
      }

      const res = await fetch("/api/tokens");

      let data;
      try {
        data = await res.json();
      } catch {
        // throw new Error("Invalid JSON from token endpoint");
        data = null;
      }

      if (
        data?.result?.name === "RefreshTokenExpirationError" ||
        data?.result?.name === "InvalidTokenError"
      ) {
        await logout();
        return;
      }

      if (!res.ok) {
        throw new Error(data?.message || `Token refresh failed: ${res.status}`);
      }

      const newToken = data?.result?.access_token;

      if (!newToken) {
        localStorage.removeItem("access_token");
        console.log(
          "No new access token received, token cleared from localStorage",
        );
        return { success: false };
      }

      localStorage.setItem("access_token", newToken);
      console.log("New access token received: " + newToken);
      return { success: true, refreshed: true };
    } catch (err) {
      console.error("refreshAccessToken failed:", err);

      localStorage.removeItem("access_token");

      return { success: false };
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

const isDeduplicationSave = (method) => method === "GET";

export async function send(
  url,
  options = { method: "GET" },
  isProtected = true,
  retry = true,
) {
  const key = isDeduplicationSave(options.method)
    ? getReqKey(options, url)
    : null;

  if (key && pendingRequests.has(key)) {
    console.log(
      `Found a pending request for ${key}, waiting for it to resolve...`,
    );
    return pendingRequests.get(key);
  }

  console.log(
    key
      ? `No pending request for ${key}, starting a new one`
      : `Starting a non-deduplicated request for ${options.method} ${url}`,
  );

  const requestOptions = { ...options, credentials: "include" };

  const promise = (async () => {
    if (isProtected) {
      await refreshAccessToken();

      const token = localStorage.getItem("access_token");

      requestOptions.headers = requestOptions.headers || {};

      if (token) {
        requestOptions.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    let response;

    try {
      response = await fetch(url, requestOptions);
    } catch (error) {
      const failure = {
        success: false,
        result: null,
        message: "Network error",
      };
      requestErrorToast(failure.message, url, requestOptions, isProtected);
      return failure;
    }

    let data;

    try {
      data = await response.json();
    } catch {
      const failure = {
        success: false,
        result: null,
        message: "Server returned an invalid response",
      };
      requestErrorToast(failure.message, url, requestOptions, isProtected);
      return failure;
    }

    if (isProtected && response.status === 401 && retry) {
      console.warn("Token likely expired during request, retrying...");

      const { success, refreshed } = await refreshAccessToken();

      if (!success || !refreshed) {
        return data;
      }

      return send(url, requestOptions, isProtected, false);
    }

    if (!data?.success) {
      requestErrorToast(
        data?.message || "Unexpected request failure",
        url,
        requestOptions,
        isProtected,
      );
    }

    return data;
  })().finally(() => {
    pendingRequests.delete(key);
  });

  if (key) {
    pendingRequests.set(key, promise);
  }
  return promise;
}

export async function importWithRefresh(url, maxRetries = 1) {
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      const module = await import(url);
      return module;
    } catch (error) {
      attempts++;

      if (attempts > maxRetries) {
        throw error;
      }

      const { success, refreshed } = await refreshAccessToken();
      if (!success) {
        throw new Error("Token refresh failed");
      }
    }
  }
}
