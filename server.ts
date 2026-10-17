import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // (Se eliminó el bloque que reescribía /etc/nginx/nginx.conf y el script Lua de AI Studio al arrancar: rompía el arranque de la vista previa.)

  // Request logger for debugging
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] Incoming API Request: ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor activo", timestamp: new Date().toISOString() });
  });

  // In-memory cache of recent webhook calls
  const recentWebhookLogs: any[] = [];

  // Helper to save webhook logs
  const recordWebhookLog = async (logEntry: any) => {
    recentWebhookLogs.unshift(logEntry);
    if (recentWebhookLogs.length > 50) recentWebhookLogs.pop();

    if (db) {
      try {
        await setDoc(doc(db, "config", "webhook_logs"), {
          logs: recentWebhookLogs.slice(0, 30),
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error saving webhook log to Firestore:", err);
      }
    }
  };

  // Webhook logs endpoint for dashboard
  app.get("/api/webhook/logs", (req, res) => {
    res.json({ logs: recentWebhookLogs });
  });

  // Initialize Firebase using the client config
  let db: any = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const firebaseApp = initializeApp(config);
      db = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } else {
      console.warn("firebase-applet-config.json not found, webhook won't save to firestore");
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }

  // Restaurant ID Normalizer
  function parseRestaurantId(rawInput: any, defaultFromPath: string = 'restaurant1'): string {
    if (!rawInput) return defaultFromPath;
    const str = String(rawInput).toLowerCase().trim();
    if (str.includes('statua') || str.includes('estatua') || str.includes('pizzeria') || str === 'restaurant2' || str === 'restaurante2' || str === '2') {
      return 'restaurant2';
    }
    if (str.includes('trop') || str === 'restaurant1' || str === 'restaurante1' || str === '1') {
      return 'restaurant1';
    }
    return defaultFromPath;
  }

  // Webhook for receiving orders (supports /orders, /tropical, /statua, etc.)
  const webhookHandler = async (req: any, res: any) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    console.log(`[${new Date().toISOString()}] Webhook Request from ${clientIp}: ${req.method} ${req.originalUrl || req.url}`);

    const isTropicalRoute = req.originalUrl?.includes('tropical') || req.path?.includes('tropical') || req.originalUrl?.includes('restaurante1');
    const isStatuaRoute = req.originalUrl?.includes('statua') || req.path?.includes('statua') || req.originalUrl?.includes('restaurante2');
    const defaultRestaurant = isStatuaRoute ? 'restaurant2' : 'restaurant1';

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
          paymentMethod: "'efectivo' o 'tarjeta'"
        },
        exampleUrl: `${req.protocol}://${req.get('host')}${req.originalUrl || req.path}`
      });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          // keep as is
        }
      }

      // Check if wrapped in { order: {...} } or { data: {...} } or { pedido: {...} }
      if (body && typeof body === 'object') {
        if (body.order && typeof body.order === 'object') body = body.order;
        else if (body.data && typeof body.data === 'object') body = body.data;
        else if (body.pedido && typeof body.pedido === 'object') body = body.pedido;
      }

      body = body || {};

      // 1. Order Number
      let orderNumber = body.orderNumber || body.order_number || body.orderId || body.order_id || body.numero || body.numero_pedido || body.numeroPedido || body.n_pedido || body.ticket || body.code || body.ref || body.id;
      if (!orderNumber && body.number) orderNumber = body.number;
      if (!orderNumber) {
        orderNumber = String(Math.floor(1000 + Math.random() * 9000));
      } else {
        orderNumber = String(orderNumber).trim();
      }

      // 2. Restaurant ID
      const rawRestaurant = body.restaurantId || body.restaurant_id || body.restaurant || body.restaurante || body.store || body.tienda || body.comercio || body.branch || body.sucursal || body.restaurantName;
      const targetRestaurantId = parseRestaurantId(rawRestaurant, defaultRestaurant);

      // 3. Customer Name
      let customerName = body.customerName || body.customer_name || body.clientName || body.client_name || body.nombre || body.nombre_cliente || body.cliente || body.name;
      if (!customerName && body.customer) {
        if (typeof body.customer === 'string') customerName = body.customer;
        else if (body.customer.name) customerName = body.customer.name;
        else if (body.customer.first_name) customerName = `${body.customer.first_name} ${body.customer.last_name || ''}`.trim();
      }
      if (!customerName && body.billing) {
        customerName = `${body.billing.first_name || ''} ${body.billing.last_name || ''}`.trim();
      }
      customerName = customerName || (targetRestaurantId === 'restaurant1' ? "Cliente Tropical" : "Cliente");

      // 4. Customer Phone
      let customerPhone = body.customerPhone || body.customer_phone || body.phone || body.telefono || body.tel || body.celular || body.movil || "";
      if (!customerPhone && body.customer?.phone) customerPhone = body.customer.phone;
      if (!customerPhone && body.billing?.phone) customerPhone = body.billing.phone;
      customerPhone = String(customerPhone).trim();

      // 5. Address
      let address = body.address || body.direccion || body.shipping_address || body.delivery_address || body.domicilio || body.calle || "";
      if (!address && body.shipping) {
        if (typeof body.shipping === 'string') address = body.shipping;
        else if (body.shipping.address_1) address = `${body.shipping.address_1} ${body.shipping.city || ''}`.trim();
      }
      if (!address && body.billing?.address_1) {
        address = `${body.billing.address_1} ${body.billing.city || ''}`.trim();
      }
      address = String(address).trim();

      // 6. Price
      const rawPrice = body.price ?? body.importe ?? body.total ?? body.total_price ?? body.amount ?? body.monto ?? body.precio ?? body.valor ?? body.order_total;
      let price: number | undefined = undefined;
      if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
        const cleanStr = String(rawPrice).replace(/[€$]/g, '').replace(',', '.').trim();
        const num = parseFloat(cleanStr);
        if (!isNaN(num)) price = Math.round(num * 100) / 100;
      }

      // 7. Payment status & method
      let isPaid: boolean | undefined = undefined;
      let paymentMethod: 'efectivo' | 'tarjeta' | undefined = undefined;

      if (body.isPaid !== undefined) isPaid = Boolean(body.isPaid);
      else if (body.pagado !== undefined) isPaid = Boolean(body.pagado);
      else if (body.paid !== undefined) isPaid = Boolean(body.paid);
      else if (body.is_paid !== undefined) isPaid = Boolean(body.is_paid);
      else if (body.cobrado !== undefined) isPaid = !Boolean(body.cobrado);

      const payStatus = String(body.payment_status || body.status_pago || body.estado_pago || '').toLowerCase();
      if (['paid', 'completed', 'pagado', 'succeeded', 'approved'].includes(payStatus)) {
        isPaid = true;
      }

      const payMethod = String(body.payment_method || body.paymentMethod || body.metodo_pago || body.forma_pago || '').toLowerCase();
      if (payMethod.includes('tarjeta') || payMethod.includes('card') || payMethod.includes('stripe') || payMethod.includes('tpv') || payMethod.includes('online') || payMethod.includes('bizum')) {
        paymentMethod = 'tarjeta';
        if (isPaid === undefined) isPaid = true;
      } else if (payMethod.includes('efectivo') || payMethod.includes('cash')) {
        paymentMethod = 'efectivo';
        if (isPaid === undefined) isPaid = false;
      }

      if (isPaid === undefined && price === 0) {
        isPaid = true;
      }

      const orderData: any = {
        orderNumber: String(orderNumber),
        customerName: String(customerName),
        customerPhone: String(customerPhone),
        address: String(address),
        restaurantId: targetRestaurantId,
        status: "En Cola",
        createdAt: new Date().toISOString(),
        prepTime: 10,
        isPrepared: false,
      };

      if (price !== undefined) orderData.price = price;
      if (isPaid !== undefined) orderData.isPaid = isPaid;
      if (paymentMethod !== undefined) orderData.paymentMethod = paymentMethod;

      if (db) {
        const orderRef = await addDoc(collection(db, "orders"), orderData);
        await setDoc(doc(db, "orders", orderRef.id), { ...orderData, id: orderRef.id });

        const restaurantNameDisplay = targetRestaurantId === 'restaurant1' ? 'Restaurante Tropical' : "s'Estatua";
        console.log(`[Webhook] Pedido #${orderNumber} (${restaurantNameDisplay}) guardado con ID: ${orderRef.id}`);

        await recordWebhookLog({
          id: orderRef.id,
          timestamp: new Date().toISOString(),
          endpoint: req.originalUrl || req.path,
          method: req.method,
          ip: clientIp,
          restaurantId: targetRestaurantId,
          restaurantName: restaurantNameDisplay,
          orderNumber,
          customerName,
          address,
          price,
          isPaid,
          status: 'success',
          rawBody: body
        });

        res.status(201).json({ 
          success: true, 
          orderId: orderRef.id, 
          orderNumber,
          restaurant: restaurantNameDisplay,
          restaurantId: targetRestaurantId,
          message: `Pedido #${orderNumber} recibido y enviado a ${restaurantNameDisplay}` 
        });
      } else {
        console.error("[Webhook] Error: Database no inicializada");
        await recordWebhookLog({
          timestamp: new Date().toISOString(),
          endpoint: req.originalUrl || req.path,
          method: req.method,
          ip: clientIp,
          status: 'error',
          error: "Database not initialized",
          rawBody: body
        });
        res.status(500).json({ error: "Database not initialized" });
      }
    } catch (error: any) {
      console.error("[Webhook Error]:", error);
      await recordWebhookLog({
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl || req.path,
        method: req.method,
        ip: clientIp,
        status: 'error',
        error: error.message,
        rawBody: req.body
      });
      res.status(500).json({ error: error.message });
    }
  };

  // Dedicated routes for Tropical
  app.post("/api/webhook/tropical", webhookHandler);
  app.get("/api/webhook/tropical", webhookHandler);
  app.post("/api/webhook/tropical/orders", webhookHandler);
  app.get("/api/webhook/tropical/orders", webhookHandler);
  app.post("/api/webhook/orders/tropical", webhookHandler);
  app.get("/api/webhook/orders/tropical", webhookHandler);
  app.post("/api/webhook/restaurante1", webhookHandler);
  app.get("/api/webhook/restaurante1", webhookHandler);

  // Dedicated routes for Statua
  app.post("/api/webhook/statua", webhookHandler);
  app.get("/api/webhook/statua", webhookHandler);
  app.post("/api/webhook/estatua", webhookHandler);
  app.get("/api/webhook/estatua", webhookHandler);
  app.post("/api/webhook/restaurante2", webhookHandler);
  app.get("/api/webhook/restaurante2", webhookHandler);

  // General routes
  app.post("/api/webhook/orders", webhookHandler);
  app.post("/api/webhook/orders/", webhookHandler);
  app.get("/api/webhook/orders", webhookHandler);
  app.get("/api/webhook/orders/", webhookHandler);
  app.post("/api/webhook", webhookHandler);
  app.get("/api/webhook", webhookHandler);

  // Test webhook outbound endpoint
  app.post("/api/webhook/test", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "No URL provided" });

      console.log(`Testing outbound webhook to: ${url}`);
      
      res.json({ 
        success: true, 
        message: "Conexión probada. El servidor intentará enviar notificaciones a esta URL cuando ocurran eventos.",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
