import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class ProductNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.PRODUCT_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.PRODUCT_NOT_FOUND],
    });
  }
}

export class ProductCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.PRODUCT_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.PRODUCT_CODE_DUPLICATE],
    });
  }
}

export class VariantNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_NOT_FOUND],
    });
  }
}

export class VariantSkuDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.SKU_CONFLICT,
      message: ERROR_MESSAGE[ErrorCode.SKU_CONFLICT],
    });
  }
}

export class VariantBarcodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.BARCODE_CONFLICT,
      message: ERROR_MESSAGE[ErrorCode.BARCODE_CONFLICT],
    });
  }
}

export class AttributeValueInvalidException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_VALUE_INVALID,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_VALUE_INVALID],
    });
  }
}

export class AttributeValueMismatchException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.ATTRIBUTE_VALUE_MISMATCH,
      message: ERROR_MESSAGE[ErrorCode.ATTRIBUTE_VALUE_MISMATCH],
    });
  }
}

export class VariantComboDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_COMBINATION_CONFLICT,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_COMBINATION_CONFLICT],
    });
  }
}

export class VariantInUseException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_IN_USE,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_IN_USE],
    });
  }
}

export class VariantRuleViolationException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_RULE_VIOLATION,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_RULE_VIOLATION],
    });
  }
}
