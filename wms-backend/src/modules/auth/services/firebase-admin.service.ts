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

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
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
}
