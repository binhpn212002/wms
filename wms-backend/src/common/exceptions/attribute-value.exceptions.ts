import { ConflictException, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class AttributeValueNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND],
    });
  }
}

export class AttributeValueCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_VALUE_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_VALUE_CODE_DUPLICATE],
    });
  }
}

export class AttributeValueInUseException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_VALUE_IN_USE,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_VALUE_IN_USE],
    });
  }
}
