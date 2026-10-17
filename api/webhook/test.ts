// Prueba del webhook de salida (equivale a /api/webhook/test de server.ts)
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });

  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "No URL provided" });

    console.log(`Testing outbound webhook to: ${url}`);
    return res.status(200).json({
      success: true,
      message: "Conexión probada. El servidor intentará enviar notificaciones a esta URL cuando ocurran eventos.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Error interno" });
  }
}
