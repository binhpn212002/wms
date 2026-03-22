import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  ERROR_MESSAGE,
  ErrorCode,
} from '../constants/error-code.constant';

export class AttributeNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_NOT_FOUND],
    });
  }
}

export class AttributeCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_CODE_DUPLICATE],
    });
  }
}

export class AttributeHasValuesException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_HAS_VALUES,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_HAS_VALUES],
    });
  }
}
