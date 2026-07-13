const jsonHeaders = { "content-type": "application/json" };

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!jwksUrl) {
    return response.status(503).json({ ok: false, error: "auth_not_configured" });
  }

  const token = String(request.body?.token || "");
  const newPassword = String(request.body?.newPassword || "");
  if (!token || newPassword.length < 8) {
    return response.status(400).json({ ok: false, error: "invalid_reset_data" });
  }

  const baseUrl = jwksUrl.replace(/\/\.well-known\/jwks\.json$/, "");

  try {
    const authResponse = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ token, newPassword }),
    });

    if (!authResponse.ok) {
      return response.status(400).json({ ok: false, error: "invalid_or_expired_token" });
    }

    return response.status(200).json({ ok: true });
  } catch {
    return response.status(503).json({ ok: false, error: "auth_unavailable" });
  }
}
