import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class InboundNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_NOT_FOUND],
    });
  }
}

export class InboundDocumentNoDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_DOCUMENT_NO_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_DOCUMENT_NO_DUPLICATE],
    });
  }
}

export class InboundInvalidStatusException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_INVALID_STATUS,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_INVALID_STATUS],
    });
  }
}

export class InboundCannotModifyCompletedException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_CANNOT_MODIFY_COMPLETED,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_CANNOT_MODIFY_COMPLETED],
    });
  }
}

export class InboundNoLinesException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_NO_LINES,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_NO_LINES],
    });
  }
}

export class InboundMissingLocationException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_MISSING_LOCATION,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_MISSING_LOCATION],
    });
  }
}

export class InboundSupplierInactiveException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_SUPPLIER_INACTIVE,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_SUPPLIER_INACTIVE],
    });
  }
}

export class InboundWarehouseInactiveException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.INBOUND_WAREHOUSE_INACTIVE,
      message: ERROR_MESSAGE[ErrorCode.INBOUND_WAREHOUSE_INACTIVE],
    });
  }
}
