export function decode(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null; 
  
  const base64Url = parts[1];
  if (!base64Url) return null;
  
  try {
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(payload);
  } catch (error) {
    return null; 
  }
}

export function isExpired(token) {
  const payload = decode(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp < Math.floor(Date.now() / 1000);
}
