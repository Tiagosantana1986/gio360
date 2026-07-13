export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) {
    return response.status(503).json({ ok: false, error: "auth_not_configured" });
  }

  try {
    const authResponse = await fetch(`${baseUrl}/get-session`, {
      headers: {
        accept: "application/json",
        cookie: request.headers.cookie || "",
      },
    });

    if (!authResponse.ok) {
      return response.status(401).json({ ok: false, authenticated: false });
    }

    const data = await authResponse.json();
    if (!data?.user) {
      return response.status(200).json({ ok: true, authenticated: false });
    }

    return response.status(200).json({
      ok: true,
      authenticated: true,
      user: { id: data.user.id, name: data.user.name, email: data.user.email },
    });
  } catch {
    return response.status(503).json({ ok: false, error: "auth_unavailable" });
  }
}
