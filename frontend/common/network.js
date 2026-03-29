import { isExpired, decode } from "./jwt.js";

const tokenRefresh = {
  isPending: false,
  promise: null,
};

const pendingRequests = new Map();
const getReqKey = ({ method }, url) => `${method}:${url}`;

// prettier-ignore
export async function refreshAccessToken () {
    if (!isExpired(localStorage.getItem("access_token"))){
        return true;
    }

    tokenRefresh.isPending = true;
    console.log("Refreshing access token...");

    tokenRefresh.promise = fetch("/api/tokens")
        .then(async response => {
          if (!response.ok) {
            return false;
          }

          return response.json();
        })
        .catch(error => {
          console.error(error);
          return false;
        })
        .finally(() => {
            tokenRefresh.isPending = false;
            tokenRefresh.promise = null;
        });

    const result = await tokenRefresh.promise;

    if (!result) {
      console.error("Failed to refresh access token");
      return false;
    }

    if (!result?.success) {
      result?.message && console.error(result.message);
      // return false;
    }

    const token = result?.result?.access_token || "";

    if (!token) {
      return false;
    }

    console.log(`New access token: ${token}`);
    localStorage.setItem("access_token", token);

    return true;
}

export async function send(
  url,
  options = { method: "GET" },
  isProtected = true,
) {
  if (isProtected) {
    if (tokenRefresh.promise) {
      console.log("Token refresh in progress, waiting for it to resolve...");
      await tokenRefresh.promise;
    } else {
      await refreshAccessToken();
    }
    options.headers = options.headers || {};
    options.headers["Authorization"] =
      `Bearer ${localStorage.getItem("access_token")}`;
  }
  const key = getReqKey(options, url);
  if (pendingRequests.has(key)) {
    console.log(
      `Found a pending request for ${key}, waiting for it to resolve...`,
    );
    return pendingRequests.get(key);
  } else {
    console.log(`No pending request for ${key}, starting a new one`);
    const promise = fetch(url, options)
      .then(async (response) => {
        try {
          return await response.json();
        } catch (error) {
          return {
            success: false,
            result: null,
            message: "Server returned an invalid response",
          };
        }
      })
      .catch((_) => ({
        success: false,
        result: null,
        message: "Network error",
      }))
      .finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, promise);
    return promise;
  }
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

      const success = await refreshAccessToken();
      if (!success) {
        throw new Error("Token refresh failed");
      }
    }
  }
}
