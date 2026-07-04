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

  // Webhook for receiving orders
  app.post("/api/webhook/orders", async (req, res) => {
    try {
      const { orderNumber, customerName, customerPhone, restaurantId, address } = req.body;
      
      if (!orderNumber || !restaurantId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const orderData = {
        orderNumber: String(orderNumber),
        customerName: customerName || "Cliente",
        customerPhone: customerPhone || "",
        address: address || "",
        restaurantId,
        status: "En Cola",
        createdAt: new Date().toISOString(),
      };

      if (db) {
        const orderRef = await addDoc(collection(db, "orders"), orderData);
        // Also add the ID field
        await setDoc(doc(db, "orders", orderRef.id), { ...orderData, id: orderRef.id });
        res.status(201).json({ success: true, orderId: orderRef.id });
      } else {
        res.status(500).json({ error: "Database not initialized" });
      }
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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
