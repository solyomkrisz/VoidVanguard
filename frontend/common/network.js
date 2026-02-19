import { isExpired, decode } from "./jwt.js";

const tokenRefresh = {
  isPending: false,
  promise: null,
};

const pendingRequests = new Map();
const getReqKey = ({ method }, url) => `${method}:${url}`;

// prettier-ignore
export async function refreshAccessToken () {
    if (!isExpired(sessionStorage.getItem("access_token"))){
        return;
    }

    tokenRefresh.isPending = true;
    console.log("Refreshing access token...");

    tokenRefresh.promise = fetch("/api/tokens")
        .then(async response => {
          if (!response.ok) {
            return;
          }

          return response.json();
        })
        .catch(error => console.error(error))
        .finally(() => {
            tokenRefresh.isPending = false;
            tokenRefresh.promise = null;
        });

    const result = await tokenRefresh.promise;

    if (!result) {
      console.error("Failed to refresh access token");
      return;
    }

    if (!result?.success) {
      result?.message && console.error(result.message);
    }

    const token = result?.result?.access_token || "";

    console.log(`New access token: ${token}`);
    sessionStorage.setItem("access_token", token);
    sessionStorage.setItem("access_token_decoded", JSON.stringify(decode(token)));
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
      `Bearer ${sessionStorage.getItem("access_token")}`;
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
