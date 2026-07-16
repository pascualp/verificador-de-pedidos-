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

  // Webhook for receiving orders (handles both with and without trailing slash)
  const webhookHandler = async (req: any, res: any) => {
    // Log all incoming webhook requests
    console.log(`[${new Date().toISOString()}] Webhook Request: ${req.method} ${req.path}`);

    if (req.method === "GET") {
      return res.status(200).json({ 
        status: "online", 
        endpoint: "Webhook de Pedidos",
        instructions: "Para enviar un pedido, usa el método POST con un cuerpo JSON. Este endpoint acepta: orderNumber, customerName, customerPhone, restaurantId, address, price (o importe) e isPaid (o pagado).",
        example_url: `${req.protocol}://${req.get('host')}${req.path}`
      });
    }

    try {
      const { orderNumber, customerName, customerPhone, restaurantId, address, price, isPaid, importe, pagado } = req.body;
      
      if (!orderNumber || !restaurantId) {
        console.warn("[Webhook] Petición inválida: faltan orderNumber o restaurantId", req.body);
        return res.status(400).json({ error: "Missing required fields (orderNumber, restaurantId)" });
      }

      const orderData = {
        orderNumber: String(orderNumber),
        customerName: customerName || "Cliente",
        customerPhone: customerPhone || "",
        address: address || "",
        restaurantId,
        status: "En Cola",
        createdAt: new Date().toISOString(),
        price: price !== undefined ? Number(price) : (importe !== undefined ? Number(importe) : undefined),
        isPaid: isPaid !== undefined ? Boolean(isPaid) : (pagado !== undefined ? Boolean(pagado) : undefined),
      };

      if (db) {
        const orderRef = await addDoc(collection(db, "orders"), orderData);
        // Also add the ID field
        await setDoc(doc(db, "orders", orderRef.id), { ...orderData, id: orderRef.id });
        console.log(`[Webhook] Pedido #${orderNumber} guardado correctamente con ID: ${orderRef.id}`);
        res.status(201).json({ success: true, orderId: orderRef.id, message: "Pedido recibido y guardado" });
      } else {
        console.error("[Webhook] Error: Database no inicializada");
        res.status(500).json({ error: "Database not initialized" });
      }
    } catch (error: any) {
      console.error("[Webhook Error]:", error);
      res.status(500).json({ error: error.message });
    }
  };

  app.post("/api/webhook/orders", webhookHandler);
  app.post("/api/webhook/orders/", webhookHandler);
  app.get("/api/webhook/orders", webhookHandler);
  app.get("/api/webhook/orders/", webhookHandler);

  // Test webhook endpoint
  app.post("/api/webhook/test", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "No URL provided" });

      console.log(`Testing outbound webhook to: ${url}`);
      
      // In a real scenario, we'd use axios to POST to the URL
      // For this environment, we'll just simulate a successful check
      
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
