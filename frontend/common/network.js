import { isExpired, decode } from "./jwt.js";
import { logout } from "/common/common.js";

const tokenRefresh = {
  isPending: false,
  promise: null,
};

const pendingRequests = new Map();
const getReqKey = ({ method }, url) => `${method}:${url}`;

export async function refreshAccessToken() {
  const rawToken = localStorage.getItem("access_token");

  if (rawToken && !isExpired(rawToken, 10)) {
    return { success: true, refreshed: false };
  }

  tokenRefresh.isPending = true;
  console.log("Refreshing access token...");

  try {
    if (tokenRefresh.promise) {
      console.log("Waiting for ongoing refresh...");
      await tokenRefresh.promise;
      return { success: true, refreshed: true };
    }

    tokenRefresh.promise = fetch("/api/tokens")
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .catch((error) => {
        console.error(error);
        return null;
      })
      .finally(() => {
        tokenRefresh.isPending = false;
        tokenRefresh.promise = null;
      });

    const result = await tokenRefresh.promise;

    // logout happend while refreshing
    const tokenBefore = rawToken;
    const tokenNow = localStorage.getItem("access_token");
    if (tokenBefore !== tokenNow) {
      return { success: false, refreshed: false };
    }

    if (!result?.success) {
      console.error(result?.message || "Token refresh failed");
      await logout(); // logout
      localStorage.removeItem("access_token");
      return { success: false, refreshed: false };
    }

    const token = result?.result?.access_token;

    if (!token) {
      console.error("No access token returned from server");
      await logout(); // logout
      localStorage.removeItem("access_token");
      return { success: false, refreshed: false };
    }

    console.log("New access token received and set: " + token);
    localStorage.setItem("access_token", token);

    return { success: true, refreshed: true };
  } catch (err) {
    console.error("Unexpected refresh error:", err);
    await logout(); // logout
    localStorage.removeItem("access_token");
    return { success: false, refreshed: false };
  }
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

  const requestOptions = { ...options };

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
      return {
        success: false,
        result: null,
        message: "Network error",
      };
    }

    let data;

    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        result: null,
        message: "Server returned an invalid response",
      };
    }

    if (isProtected && response.status === 401 && retry) {
      console.warn("Token likely expired during request, retrying...");

      const { success, refreshed } = await refreshAccessToken();

      if (!refreshed) {
        return data;
      }

      return send(url, requestOptions, isProtected, false);
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
