import { registerAs } from '@nestjs/config';
import { loadFirebaseServiceAccountJson } from './firebase-service-account.util';

function resolveWebApiKey(): string {
  const explicit = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (explicit) return explicit;
  // Same value as frontend `FIREBASE_API_KEY` (Project settings → General → Web API Key)
  return process.env.FIREBASE_API_KEY?.trim() ?? '';
}

export default registerAs('firebase', () => ({
  serviceAccountJson: loadFirebaseServiceAccountJson(),
  webApiKey: resolveWebApiKey(),
}));
