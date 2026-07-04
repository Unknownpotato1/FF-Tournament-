// Firebase Admin SDK — used server-side only.
// Initialized from FIREBASE_SERVICE_ACCOUNT env var (JSON string set in Vercel).
// Bypasses Firestore Security Rules — used for admin operations and ID token verification.

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let app: App | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: Storage | null = null;

function getApp(): App {
  if (app) return app;

  // Avoid re-initializing on hot reload in dev
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var is not set. " +
      "Generate a service account key in Firebase Console → Project Settings → Service Accounts → " +
      "Generate new private key, then add the entire JSON as FIREBASE_SERVICE_ACCOUNT env var in Vercel."
    );
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not valid JSON.");
  }

  app = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return app;
}

export function getAdminAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getApp());
  return authInstance;
}

export function getAdminDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getApp());
  return dbInstance;
}

export function getAdminStorage(): Storage {
  if (!storageInstance) storageInstance = getStorage(getApp());
  return storageInstance;
}
