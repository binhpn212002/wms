import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.USER_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.USER_NOT_FOUND],
    });
  }
}

export class UserUsernameDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.USER_USERNAME_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.USER_USERNAME_DUPLICATE],
    });
  }
}

export class UserPhoneDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.USER_PHONE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.USER_PHONE_DUPLICATE],
    });
  }
}

export class UserFirebaseIdDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.USER_FIREBASE_ID_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.USER_FIREBASE_ID_DUPLICATE],
    });
  }
}

export class UserInactiveException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.USER_INACTIVE,
      message: ERROR_MESSAGE[ErrorCode.USER_INACTIVE],
    });
  }
}

export class UserRoleNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.USER_ROLE_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.USER_ROLE_NOT_FOUND],
    });
  }
}
