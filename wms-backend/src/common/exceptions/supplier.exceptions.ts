import { ConflictException, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class SupplierNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.SUPPLIER_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.SUPPLIER_NOT_FOUND],
    });
  }
}

export class SupplierCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.SUPPLIER_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.SUPPLIER_CODE_DUPLICATE],
    });
  }
}

export class SupplierTaxIdDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.SUPPLIER_TAX_ID_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.SUPPLIER_TAX_ID_DUPLICATE],
    });
  }
}

export class SupplierInUseException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.SUPPLIER_IN_USE,
      message: ERROR_MESSAGE[ErrorCode.SUPPLIER_IN_USE],
    });
  }
}

export class SupplierContactNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.SUPPLIER_CONTACT_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.SUPPLIER_CONTACT_NOT_FOUND],
    });
  }
}
