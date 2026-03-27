import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class TransferNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_NOT_FOUND],
    });
  }
}

export class TransferDocumentNoDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_DOCUMENT_NO_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_DOCUMENT_NO_DUPLICATE],
    });
  }
}

export class TransferInvalidStatusException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_INVALID_STATUS,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_INVALID_STATUS],
    });
  }
}

export class TransferCannotModifyCompletedException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_CANNOT_MODIFY_COMPLETED,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_CANNOT_MODIFY_COMPLETED],
    });
  }
}

export class TransferNoLinesException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_NO_LINES,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_NO_LINES],
    });
  }
}

export class TransferWarehouseInactiveException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_WAREHOUSE_INACTIVE,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_WAREHOUSE_INACTIVE],
    });
  }
}

export class TransferSourceDestSameException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.TRANSFER_SOURCE_DEST_SAME,
      message: ERROR_MESSAGE[ErrorCode.TRANSFER_SOURCE_DEST_SAME],
    });
  }
}

