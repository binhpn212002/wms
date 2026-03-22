import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirebaseConfig, isFirebaseConfigured } from './config';

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null;

/** @type {import('firebase/auth').Auth | null} */
let auth = null;

function ensureInit() {
  if (app) {
    return { app, auth };
  }
  if (!isFirebaseConfigured()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        '[firebase] Missing VITE_FIREBASE_* variables. Copy .env.example to .env.local and fill values.'
      );
    }
    return { app: null, auth: null };
  }
  const config = getFirebaseConfig();
  app = initializeApp(config);
  auth = getAuth(app);
  return { app, auth };
}

const initialized = ensureInit();
export const firebaseApp = initialized.app;
export const firebaseAuth = initialized.auth;

/**
 * Google Analytics (web) — chỉ chạy trên trình duyệt khi có measurementId.
 * Gọi sau khi app mount nếu cần đo lường.
 */
export async function initFirebaseAnalytics() {
  const { app: a } = ensureInit();
  if (!a) return null;
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (!(await isSupported())) {
    return null;
  }
  return getAnalytics(a);
}
