import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import config from "../firebase-applet-config.json";

const app = initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId);

// Ensure the db is using the correct database instance from config
