import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class InsufficientStockException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.INSUFFICIENT_STOCK,
      message: ERROR_MESSAGE[ErrorCode.INSUFFICIENT_STOCK],
    });
  }
}

export class LocationWarehouseMismatchException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_WAREHOUSE_MISMATCH,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_WAREHOUSE_MISMATCH],
    });
  }
}

export class WarehouseNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.WAREHOUSE_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.WAREHOUSE_NOT_FOUND],
    });
  }
}

export class LocationNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_NOT_FOUND],
    });
  }
}
