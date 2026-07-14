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

  const baseUrl = jwksUrl.replace(/\/\.well-known\/jwks\.json$/, "").replace(/\/$/, "");
  const origin = getRequestOrigin(request);

  try {
    const authResponse = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: { ...jsonHeaders, origin },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!authResponse.ok) {
      const contentType = authResponse.headers.get("content-type") || "";
      const upstream = contentType.includes("application/json")
        ? await authResponse.json().catch(() => ({}))
        : { message: await authResponse.text().catch(() => "") };
      const upstreamCode = String(
        upstream?.code || upstream?.error?.code || upstream?.error || "reset_rejected"
      ).slice(0, 80);
      const upstreamMessage = String(upstream?.message || upstream?.error?.message || "")
        .replace(/[\r\n]+/g, " ")
        .slice(0, 240);

      return response.status(400).json({
        ok: false,
        error: "reset_rejected",
        reason: upstreamCode,
        detail: upstreamMessage,
        upstreamStatus: authResponse.status,
      });
    }

    return response.status(200).json({ ok: true });
  } catch {
    return response.status(503).json({ ok: false, error: "auth_unavailable" });
  }
}
