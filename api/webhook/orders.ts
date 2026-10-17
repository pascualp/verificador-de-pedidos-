import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { getDb } from "../_lib/firebase.js";

// Webhook de entrada de pedidos (equivale a /api/webhook/orders de server.ts)
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  console.log(`[${new Date().toISOString()}] Webhook Request: ${req.method} ${req.url}`);

  if (req.method === "GET") {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return res.status(200).json({
      status: "online",
      endpoint: "Webhook de Pedidos",
      instructions:
        "Para enviar un pedido, usa el método POST con un cuerpo JSON. Este endpoint acepta: orderNumber, customerName, customerPhone, restaurantId, address, price (o importe) e isPaid (o pagado).",
      example_url: `https://${host}/api/webhook/orders`,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST con un cuerpo JSON." });
  }

  try {
    const body = req.body || {};
    const { orderNumber, customerName, customerPhone, restaurantId, address, price, isPaid, importe, pagado } = body;

    if (!orderNumber || !restaurantId) {
      console.warn("[Webhook] Petición inválida: faltan orderNumber o restaurantId", body);
      return res.status(400).json({ error: "Missing required fields (orderNumber, restaurantId)" });
    }

    // Firestore no admite valores undefined: solo se incluyen los campos que llegan
    const orderData: Record<string, any> = {
      orderNumber: String(orderNumber),
      customerName: customerName || "Cliente",
      customerPhone: customerPhone || "",
      address: address || "",
      restaurantId,
      status: "En Cola",
      createdAt: new Date().toISOString(),
      prepTime: 10,
      isPrepared: false,
    };
    const priceValue = price !== undefined ? Number(price) : importe !== undefined ? Number(importe) : undefined;
    if (priceValue !== undefined && !Number.isNaN(priceValue)) orderData.price = priceValue;
    const paidValue = isPaid !== undefined ? Boolean(isPaid) : pagado !== undefined ? Boolean(pagado) : undefined;
    if (paidValue !== undefined) orderData.isPaid = paidValue;

    const db = getDb();
    if (!db) {
      console.error("[Webhook] Error: Database no inicializada");
      return res.status(500).json({ error: "Database not initialized" });
    }

    const orderRef = await addDoc(collection(db, "orders"), orderData);
    await setDoc(doc(db, "orders", orderRef.id), { ...orderData, id: orderRef.id });
    console.log(`[Webhook] Pedido #${orderNumber} guardado correctamente con ID: ${orderRef.id}`);
    return res.status(201).json({ success: true, orderId: orderRef.id, message: "Pedido recibido y guardado" });
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    return res.status(500).json({ error: error?.message || "Error interno" });
  }
}
