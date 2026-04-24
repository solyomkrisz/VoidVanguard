import { isExpired, decode } from "./jwt.js";
import { logout } from "/common/common.js";

const pendingRequests = new Map();
const getReqKey = ({ method }, url) => `${method}:${url}`;

let refreshPromise = null;

export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (token && !isExpired(token, 10)) {
        return { success: true, refreshed: false };
      }

      const res = await fetch("/api/tokens");

      if (!res.ok) {
        throw new Error(`Token refresh failed: ${res.status}`);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid JSON from token endpoint");
      }

      const newToken = data?.result?.access_token;

      if (!newToken) {
        localStorage.removeItem("access_token");
        return { success: false };
      }

      localStorage.setItem("access_token", newToken);
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
