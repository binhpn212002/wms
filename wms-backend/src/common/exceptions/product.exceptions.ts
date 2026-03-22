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
      code: ErrorCode.VARIANT_SKU_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_SKU_DUPLICATE],
    });
  }
}

export class VariantBarcodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_BARCODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_BARCODE_DUPLICATE],
    });
  }
}

export class VariantAttributeInvalidException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_ATTRIBUTE_INVALID,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_ATTRIBUTE_INVALID],
    });
  }
}

export class VariantComboDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.VARIANT_COMBO_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.VARIANT_COMBO_DUPLICATE],
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
