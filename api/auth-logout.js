function getRequestOrigin(request) {
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = forwardedHost || request.headers.host;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  return host ? `${protocol}://${host}` : "";
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  if (typeof headers.raw === "function") {
    return headers.raw()["set-cookie"] || [];
  }

  const cookie = headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

function getExpiredSessionCookies(request) {
  const cookieHeader = request.headers.cookie || "";
  const names = cookieHeader
    .split(";")
    .map((part) => part.split("=")[0].trim())
    .filter(Boolean);

  return [...new Set(names)].map(
    (name) =>
      `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`
  );
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!jwksUrl) {
    return response.status(503).json({ ok: false, error: "auth_not_configured" });
  }
  const baseUrl = jwksUrl.replace(/\/\.well-known\/jwks\.json$/, "");
  const expiredCookies = getExpiredSessionCookies(request);

  response.setHeader("Cache-Control", "no-store");

  try {
    const authResponse = await fetch(`${baseUrl}/sign-out`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: request.headers.cookie || "",
        origin: getRequestOrigin(request),
      },
      body: "{}",
    });

    const cookies = [...getSetCookies(authResponse.headers), ...expiredCookies];
    if (cookies.length) response.setHeader("Set-Cookie", cookies);
    return response.status(200).json({ ok: true });
  } catch {
    if (expiredCookies.length) response.setHeader("Set-Cookie", expiredCookies);
    return response.status(200).json({ ok: true, upstream: false });
  }
}
