// Reimplantação após configurar NEON_AUTH_BASE_URL
export default async function handler(_request, response) {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;

  if (!baseUrl) {
    return response.status(503).json({
      ok: false,
      auth: "not_configured",
    });
  }

  try {
    const authResponse = await fetch(
     `${baseUrl}/get-session`,
      { headers: { accept: "application/json" } }
    );

    if (!authResponse.ok) {
      return response.status(503).json({
        ok: false,
        auth: "unavailable",
      });
    }

    return response.status(200).json({
      ok: true,
      auth: "connected",
    });
  } catch {
    return response.status(503).json({
      ok: false,
      auth: "unavailable",
    });
  }
}
