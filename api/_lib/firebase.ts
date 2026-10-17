import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Misma conexión que usa server.ts (Express), pero reutilizable por las funciones serverless de Vercel.
// firebase-applet-config.json se incluye en la función mediante "includeFiles" en vercel.json.
export function getDb(): any | null {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.warn("firebase-applet-config.json no encontrado: el webhook no puede guardar en Firestore");
      return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const app = getApps().length ? getApp() : initializeApp(config);
    return getFirestore(app, config.firestoreDatabaseId);
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
    return null;
  }
}
