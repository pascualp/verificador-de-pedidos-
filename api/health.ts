export default function handler(_req: any, res: any) {
  res.status(200).json({ status: "ok", message: "Servidor activo", timestamp: new Date().toISOString() });
}
