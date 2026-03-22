import { ConflictException, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class UnitNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.UNIT_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.UNIT_NOT_FOUND],
    });
  }
}

export class UnitCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.UNIT_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.UNIT_CODE_DUPLICATE],
    });
  }
}

export class UnitInUseException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.UNIT_IN_USE,
      message: ERROR_MESSAGE[ErrorCode.UNIT_IN_USE],
    });
  }
}
