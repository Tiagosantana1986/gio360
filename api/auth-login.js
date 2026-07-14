const jsonHeaders = { "content-type": "application/json" };

function getRequestOrigin(request) {
  const incomingOrigin = String(request.headers.origin || "").replace(/\/$/, "");
  if (incomingOrigin) return incomingOrigin;

  const protocol = String(request.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const host = String(
    request.headers["x-forwarded-host"] || request.headers.host || "",
  )
    .split(",")[0]
    .trim();

  return `${protocol}://${host}`;
}

function copyAuthCookies(source, response) {
  const cookies = source.headers.getSetCookie?.() || [];
  if (cookies.length) response.setHeader("Set-Cookie", cookies);
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
  const baseUrl = jwksUrl
    .replace(/\/\.well-known\/jwks\.json$/, "")
    .replace(/\/$/, "");
  const origin = getRequestOrigin(request);

  const email = String(request.body?.email || "").trim().toLowerCase();
  const password = String(request.body?.password || "");
  if (!email || !password) {
    return response.status(400).json({ ok: false, error: "missing_credentials" });
  }

  try {
    const authResponse = await fetch(`${baseUrl}/sign-in/email`, {
      method: "POST",
      headers: { ...jsonHeaders, origin },
      body: JSON.stringify({ email, password }),
    });

    if (!authResponse.ok) {
      return response.status(401).json({ ok: false, error: "invalid_credentials" });
    }

    copyAuthCookies(authResponse, response);
    const data = await authResponse.json();
    return response.status(200).json({
      ok: true,
      user: data.user ? { id: data.user.id, name: data.user.name, email: data.user.email } : null,
    });
  } catch {
    return response.status(503).json({ ok: false, error: "auth_unavailable" });
  }
}
