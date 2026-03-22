import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class OutboundNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.OUTBOUND_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.OUTBOUND_NOT_FOUND],
    });
  }
}

export class OutboundDocumentNoDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.OUTBOUND_DOCUMENT_NO_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.OUTBOUND_DOCUMENT_NO_DUPLICATE],
    });
  }
}

export class OutboundInvalidStatusException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.OUTBOUND_INVALID_STATUS,
      message: ERROR_MESSAGE[ErrorCode.OUTBOUND_INVALID_STATUS],
    });
  }
}

export class OutboundCannotModifyCompletedException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.OUTBOUND_CANNOT_MODIFY_COMPLETED,
      message: ERROR_MESSAGE[ErrorCode.OUTBOUND_CANNOT_MODIFY_COMPLETED],
    });
  }
}

export class OutboundNoLinesException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.OUTBOUND_NO_LINES,
      message: ERROR_MESSAGE[ErrorCode.OUTBOUND_NO_LINES],
    });
  }
}

export class OutboundWarehouseInactiveException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.OUTBOUND_WAREHOUSE_INACTIVE,
      message: ERROR_MESSAGE[ErrorCode.OUTBOUND_WAREHOUSE_INACTIVE],
    });
  }
}
