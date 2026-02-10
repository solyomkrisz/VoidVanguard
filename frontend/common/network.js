import { isExpired, decode } from "./jwt.js";

// prettier-ignore
export async function refreshAccessToken () {
    if (isExpired(sessionStorage.getItem("access_token"))){
        console.log("Refreshing access token...")

        const result = await fetch("/api/tokens")
            .then(async response => await response.json())
            .catch(error => console.error(error));
            
        if(!result.success){
            console.error(result.message);
        }
        
        sessionStorage.setItem("access_token", result?.result?.access_token || "");
        sessionStorage.setItem("access_token_decoded", JSON.stringify(decode(result?.result?.access_token || "")));
    }
}

export async function send(
  url,
  options = { method: "GET" },
  isProtected = true,
) {
  if (isProtected) {
    await refreshAccessToken();
    options.headers = options.headers || {};
    options.headers["Authorization"] =
      `Bearer ${sessionStorage.getItem("access_token")}`;
  }
  return fetch(url, options)
    .then(async (response) => await response.json())
    .catch((error) => console.error(error));
}
