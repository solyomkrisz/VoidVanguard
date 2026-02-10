export function decode(token) {
  if (!token) return null;

  const base64Url = token.split(".")[1];
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
}

export function isExpired(token) {
  const payload = decode(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp < Math.floor(Date.now() / 1000);
}
