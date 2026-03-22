import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ERROR_MESSAGE, ErrorCode } from '../../../common/constants/error-code.constant';
import { AuthInvalidCredentialsException } from '../../../common/exceptions/auth.exceptions';
import { toE164VN } from '../../../common/utils/phone-normalize.util';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const webKey = this.config.get<string>('firebase.webApiKey')?.trim();
    if (!webKey) {
      this.logger.warn(
        'FIREBASE_WEB_API_KEY not set — POST /auth/login (username/password) will return 503',
      );
    }
    if (admin.apps.length) {
      return;
    }
    const json = this.config.get<string>('firebase.serviceAccountJson')?.trim();
    if (!json) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_JSON not set — POST /auth/firebase will return 503',
      );
      return;
    }
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(json) as admin.ServiceAccount),
      });
    } catch (e) {
      this.logger.error(
        `Firebase Admin init failed: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  isConfigured(): boolean {
    return admin.apps.length > 0;
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException({
        code: ErrorCode.AUTH_FIREBASE_NOT_CONFIGURED,
        message: ERROR_MESSAGE[ErrorCode.AUTH_FIREBASE_NOT_CONFIGURED],
      });
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    this.assertConfigured();
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new AuthInvalidCredentialsException();
    }
  }

  /**
   * Firebase Auth REST — Email/Password (Identity Toolkit).
   * Cần `FIREBASE_WEB_API_KEY` (Console → Project settings → General → Web API Key).
   */
  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ) {
    const apiKey = this.config.get<string>('firebase.webApiKey')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: ErrorCode.AUTH_FIREBASE_NOT_CONFIGURED,
        message: ERROR_MESSAGE[ErrorCode.AUTH_FIREBASE_NOT_CONFIGURED],
      });
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        returnSecureToken: true,
      }),
    });
    
    if (!res.ok) {
      throw new AuthInvalidCredentialsException();
    }
    return await res.json();
  }

  // register new user to firebase with email and password is phone
  async createUser(phone: string, email: string, password: string): Promise<string> {
    this.assertConfigured();
    const phoneE164 = toE164VN(phone);
    const user = await admin.auth().createUser({
      phoneNumber: phoneE164,
      email: email.trim() || undefined,
      password,
    });
    return user.uid;
  }
}
