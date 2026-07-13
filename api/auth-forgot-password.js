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

  const email = String(request.body?.email || "").trim().toLowerCase();
  if (!email) {
    return response.status(400).json({ ok: false, error: "missing_email" });
  }

  const baseUrl = jwksUrl.replace(/\/\.well-known\/jwks\.json$/, "");
  const origin = `https://${request.headers.host}`;

  try {
    await fetch(`${baseUrl}/request-password-reset`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email,
        redirectTo: `${origin}/?reset-password=1`,
      }),
    });

    // A resposta é sempre genérica para não revelar quais e-mails existem.
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(503).json({ ok: false, error: "auth_unavailable" });
  }
}
