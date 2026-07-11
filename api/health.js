import { neon } from "@neondatabase/serverless";

export default async function handler(_request, response) {
  if (!process.env.DATABASE_URL) {
    return response.status(503).json({ ok: false, database: "not_configured" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    return response.status(200).json({ ok: true, database: "connected" });
  } catch {
    return response.status(503).json({ ok: false, database: "unavailable" });
  }
}
