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
        return Promise.resolve();
    }
    tokenRefresh.isPending = true;
    console.log("Refreshing access token...");

    tokenRefresh.promise = fetch("/api/tokens")
        .then(async response => await response.json())
        .catch(error => console.error(error))
        .finally(() => {
            tokenRefresh.isPending = false;
            tokenRefresh.promise = null;
        });

    const result = await tokenRefresh.promise;

    !result && console.error("Failed to refresh access token");
    !result?.success && console.error(result.message);
    console.log(`New access token: ${result?.result?.access_token}`);
    sessionStorage.setItem("access_token", result?.result?.access_token || "");
    sessionStorage.setItem("access_token_decoded", JSON.stringify(decode(result?.result?.access_token || "")));

    return Promise.resolve();

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
      .then(async (response) => await response.json())
      .catch((error) => console.error(error))
      .finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, promise);
    return promise;
  }
}
