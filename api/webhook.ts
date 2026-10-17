import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { getDb } from "./_lib/firebase.js";

// Webhook de pedidos para Vercel. Una sola función atiende todas estas rutas (vercel.json las reenvía con ?route=):
//   /api/webhook, /api/webhook/orders, /api/webhook/tropical, /api/webhook/statua, /api/webhook/estatua,
//   /api/webhook/restaurante1, /api/webhook/restaurante2, /api/webhook/tropical/orders, /api/webhook/orders/tropical,
//   /api/webhook/logs (registro de llamadas) y /api/webhook/test (prueba del webhook de salida).
// La lógica de lectura del pedido es la misma que la de server.ts (AI Studio / local).

const LOGS_KEEP = 30;

function parseRestaurantId(rawInput: any, defaultFromPath = "restaurant1"): string {
  if (!rawInput) return defaultFromPath;
  const str = String(rawInput).toLowerCase().trim();
  if (str.includes("statua") || str.includes("estatua") || str.includes("pizzeria") || str === "restaurant2" || str === "restaurante2" || str === "2") {
    return "restaurant2";
  }
  if (str.includes("trop") || str === "restaurant1" || str === "restaurante1" || str === "1") {
    return "restaurant1";
  }
  return defaultFromPath;
}

// El registro se guarda en Firestore (config/webhook_logs): en Vercel cada petición puede ir a una instancia distinta.
async function recordWebhookLog(db: any, entry: any) {
  if (!db) return;
  try {
    const ref = doc(db, "config", "webhook_logs");
    const snap = await getDoc(ref);
    const prev: any[] = snap.exists() ? snap.data().logs || [] : [];
    await setDoc(ref, { logs: [entry, ...prev].slice(0, LOGS_KEEP), lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("Error guardando el registro del webhook en Firestore:", err);
  }
}

// Firestore no admite undefined (ni dentro de rawBody): se limpia antes de guardar
const clean = (v: any) => JSON.parse(JSON.stringify(v === undefined ? null : v));

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const route = String(req.query?.route ?? "").replace(/^\/+|\/+$/g, "").toLowerCase();
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const clientIp = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const publicPath = `/api/webhook${route ? "/" + route : ""}`;

  // --- Registro de llamadas para el panel ---
  if (route === "logs") {
    if (req.method !== "GET") return res.status(405).json({ error: "Usa GET" });
    const db = getDb();
    if (!db) return res.status(200).json({ logs: [] });
    try {
      const snap = await getDoc(doc(db, "config", "webhook_logs"));
      return res.status(200).json({ logs: snap.exists() ? snap.data().logs || [] : [] });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Error leyendo el registro" });
    }
  }

  // --- Prueba del webhook de salida ---
  if (route === "test") {
    if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "No URL provided" });
    console.log(`Testing outbound webhook to: ${url}`);
    return res.status(200).json({
      success: true,
      message: "Conexión probada. El servidor intentará enviar notificaciones a esta URL cuando ocurran eventos.",
      timestamp: new Date().toISOString(),
    });
  }

  // --- Webhook de pedidos ---
  console.log(`[${new Date().toISOString()}] Webhook Request from ${clientIp}: ${req.method} ${publicPath}`);

  const isTropicalRoute = route.includes("tropical") || route.includes("restaurante1");
  const isStatuaRoute = route.includes("statua") || route.includes("restaurante2");
  const defaultRestaurant = isStatuaRoute ? "restaurant2" : "restaurant1";

  if (req.method === "GET") {
    return res.status(200).json({
      status: "online",
      endpoint: isTropicalRoute ? "Webhook de Pedidos - Restaurante Tropical" : "Webhook de Pedidos",
      restaurantIdDefault: defaultRestaurant,
      instructions: "Para enviar un pedido, usa el método POST con un cuerpo JSON. Acepta formatos estándar, WooCommerce o campos en español/inglés.",
      acceptedFields: {
        orderNumber: "Número del pedido (ej. '1042', 'ORD-55'). Si no se envía se autogenera.",
        restaurantId: `ID del restaurante ('restaurant1' para Tropical, 'restaurant2' para s'Estatua). En esta ruta por defecto es '${defaultRestaurant}'.`,
        customerName: "Nombre del cliente",
        customerPhone: "Teléfono del cliente",
        address: "Dirección de entrega",
        price: "Importe total del pedido en euros/dólares (ej: 18.50)",
        isPaid: "Booleano si está pagado o no (ej: false para cobrar en mano)",
        paymentMethod: "'efectivo' o 'tarjeta'",
      },
      exampleUrl: `https://${host}${publicPath}`,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST con un cuerpo JSON." });
  }

  const db = getDb();
  let body: any = req.body;
  try {
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { /* se deja como texto */ }
    }

    // ¿Viene envuelto en { order: {...} }, { data: {...} } o { pedido: {...} }?
    if (body && typeof body === "object") {
      if (body.order && typeof body.order === "object") body = body.order;
      else if (body.data && typeof body.data === "object") body = body.data;
      else if (body.pedido && typeof body.pedido === "object") body = body.pedido;
    }
    body = body && typeof body === "object" ? body : {};

    // 1. Número de pedido
    let orderNumber = body.orderNumber || body.order_number || body.orderId || body.order_id || body.numero || body.numero_pedido || body.numeroPedido || body.n_pedido || body.ticket || body.code || body.ref || body.id;
    if (!orderNumber && body.number) orderNumber = body.number;
    orderNumber = orderNumber ? String(orderNumber).trim() : String(Math.floor(1000 + Math.random() * 9000));

    // 2. Restaurante
    const rawRestaurant = body.restaurantId || body.restaurant_id || body.restaurant || body.restaurante || body.store || body.tienda || body.comercio || body.branch || body.sucursal || body.restaurantName;
    const targetRestaurantId = parseRestaurantId(rawRestaurant, defaultRestaurant);

    // 3. Cliente
    let customerName = body.customerName || body.customer_name || body.clientName || body.client_name || body.nombre || body.nombre_cliente || body.cliente || body.name;
    if (!customerName && body.customer) {
      if (typeof body.customer === "string") customerName = body.customer;
      else if (body.customer.name) customerName = body.customer.name;
      else if (body.customer.first_name) customerName = `${body.customer.first_name} ${body.customer.last_name || ""}`.trim();
    }
    if (!customerName && body.billing) {
      customerName = `${body.billing.first_name || ""} ${body.billing.last_name || ""}`.trim();
    }
    customerName = customerName || (targetRestaurantId === "restaurant1" ? "Cliente Tropical" : "Cliente");

    // 4. Teléfono
    let customerPhone = body.customerPhone || body.customer_phone || body.phone || body.telefono || body.tel || body.celular || body.movil || "";
    if (!customerPhone && body.customer?.phone) customerPhone = body.customer.phone;
    if (!customerPhone && body.billing?.phone) customerPhone = body.billing.phone;
    customerPhone = String(customerPhone).trim();

    // 5. Dirección
    let address = body.address || body.direccion || body.shipping_address || body.delivery_address || body.domicilio || body.calle || "";
    if (!address && body.shipping) {
      if (typeof body.shipping === "string") address = body.shipping;
      else if (body.shipping.address_1) address = `${body.shipping.address_1} ${body.shipping.city || ""}`.trim();
    }
    if (!address && body.billing?.address_1) {
      address = `${body.billing.address_1} ${body.billing.city || ""}`.trim();
    }
    address = String(address).trim();

    // 6. Precio
    const rawPrice = body.price ?? body.importe ?? body.total ?? body.total_price ?? body.amount ?? body.monto ?? body.precio ?? body.valor ?? body.order_total;
    let price: number | undefined = undefined;
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
      const num = parseFloat(String(rawPrice).replace(/[€$]/g, "").replace(",", ".").trim());
      if (!isNaN(num)) price = Math.round(num * 100) / 100;
    }

    // 7. Pago
    let isPaid: boolean | undefined = undefined;
    let paymentMethod: "efectivo" | "tarjeta" | undefined = undefined;
    if (body.isPaid !== undefined) isPaid = Boolean(body.isPaid);
    else if (body.pagado !== undefined) isPaid = Boolean(body.pagado);
    else if (body.paid !== undefined) isPaid = Boolean(body.paid);
    else if (body.is_paid !== undefined) isPaid = Boolean(body.is_paid);
    else if (body.cobrado !== undefined) isPaid = !Boolean(body.cobrado);

    const payStatus = String(body.payment_status || body.status_pago || body.estado_pago || "").toLowerCase();
    if (["paid", "completed", "pagado", "succeeded", "approved"].includes(payStatus)) isPaid = true;

    const payMethod = String(body.payment_method || body.paymentMethod || body.metodo_pago || body.forma_pago || "").toLowerCase();
    if (/tarjeta|card|stripe|tpv|online|bizum/.test(payMethod)) {
      paymentMethod = "tarjeta";
      if (isPaid === undefined) isPaid = true;
    } else if (/efectivo|cash/.test(payMethod)) {
      paymentMethod = "efectivo";
      if (isPaid === undefined) isPaid = false;
    }
    if (isPaid === undefined && price === 0) isPaid = true;

    const orderData: any = {
      orderNumber: String(orderNumber),
      customerName: String(customerName),
      customerPhone,
      address,
      restaurantId: targetRestaurantId,
      status: "En Cola",
      createdAt: new Date().toISOString(),
      prepTime: 10,
      isPrepared: false,
    };
    if (price !== undefined) orderData.price = price;
    if (isPaid !== undefined) orderData.isPaid = isPaid;
    if (paymentMethod !== undefined) orderData.paymentMethod = paymentMethod;

    if (!db) {
      console.error("[Webhook] Error: Database no inicializada");
      return res.status(500).json({ error: "Database not initialized" });
    }

    const orderRef = await addDoc(collection(db, "orders"), orderData);
    await setDoc(doc(db, "orders", orderRef.id), { ...orderData, id: orderRef.id });

    const restaurantNameDisplay = targetRestaurantId === "restaurant1" ? "Restaurante Tropical" : "s'Estatua";
    console.log(`[Webhook] Pedido #${orderNumber} (${restaurantNameDisplay}) guardado con ID: ${orderRef.id}`);

    await recordWebhookLog(db, clean({
      id: orderRef.id,
      timestamp: new Date().toISOString(),
      endpoint: publicPath,
      method: req.method,
      ip: clientIp,
      restaurantId: targetRestaurantId,
      restaurantName: restaurantNameDisplay,
      orderNumber,
      customerName,
      address,
      price: price ?? null,
      isPaid: isPaid ?? null,
      status: "success",
      rawBody: body,
    }));

    return res.status(201).json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      restaurant: restaurantNameDisplay,
      restaurantId: targetRestaurantId,
      message: `Pedido #${orderNumber} recibido y enviado a ${restaurantNameDisplay}`,
    });
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    await recordWebhookLog(db, clean({
      timestamp: new Date().toISOString(),
      endpoint: publicPath,
      method: req.method,
      ip: clientIp,
      status: "error",
      error: error?.message || "Error interno",
      rawBody: body ?? null,
    }));
    return res.status(500).json({ error: error?.message || "Error interno" });
  }
}
