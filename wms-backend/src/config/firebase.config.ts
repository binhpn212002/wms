import { registerAs } from '@nestjs/config';
import { loadFirebaseServiceAccountJson } from './firebase-service-account.util';

export default registerAs('firebase', () => ({
  serviceAccountJson: loadFirebaseServiceAccountJson(),
}));
