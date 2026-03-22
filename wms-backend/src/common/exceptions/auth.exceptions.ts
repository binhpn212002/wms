import { UnauthorizedException } from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class AuthInvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: ERROR_MESSAGE[ErrorCode.AUTH_INVALID_CREDENTIALS],
    });
  }
}
