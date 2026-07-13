export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) {
    return response.status(503).json({ ok: false, error: "auth_not_configured" });
  }

  try {
    const authResponse = await fetch(`${baseUrl}/sign-out`, {
      method: "POST",
      headers: {
        accept: "application/json",
        cookie: request.headers.cookie || "",
      },
    });

    const cookies = authResponse.headers.getSetCookie?.() || [];
    if (cookies.length) response.setHeader("Set-Cookie", cookies);
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(503).json({ ok: false, error: "auth_unavailable" });
  }
}
