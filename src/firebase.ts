import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper universal para leer variables tanto en Next.js (process.env) como en Vite
function getEnv(key: string, fallback: string = ""): string {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`]!;
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
    if (process.env[key]) return process.env[key]!;
  }
  return fallback;
}

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY", "AIzaSyDyGlza_RZ4n8_YTliFLsMIjb1gg9jJzpM"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN", "rpa-nomina-oficial.firebaseapp.com"),
  projectId: getEnv("FIREBASE_PROJECT_ID", "rpa-nomina-oficial"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET", "rpa-nomina-oficial.firebasestorage.app"),
  appId: getEnv("FIREBASE_APP_ID", "1:455765289403:web:a003c2cd5558020ef97c9e"),
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Prevenir inicializaciones duplicadas en Next.js hot-reload
const app = firebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
