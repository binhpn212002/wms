import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class WarehouseCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.WAREHOUSE_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.WAREHOUSE_CODE_DUPLICATE],
    });
  }
}

export class WarehouseHasStockException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.WAREHOUSE_HAS_STOCK,
      message: ERROR_MESSAGE[ErrorCode.WAREHOUSE_HAS_STOCK],
    });
  }
}

export class LocationCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_CODE_DUPLICATE],
    });
  }
}

export class LocationHasChildrenException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_HAS_CHILDREN,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_HAS_CHILDREN],
    });
  }
}

export class LocationHasStockException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_HAS_STOCK,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_HAS_STOCK],
    });
  }
}

export class LocationIsDefaultForWarehouseException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_IS_DEFAULT_FOR_WAREHOUSE,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_IS_DEFAULT_FOR_WAREHOUSE],
    });
  }
}

export class InvalidLocationTypeException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.INVALID_LOCATION_TYPE,
      message: ERROR_MESSAGE[ErrorCode.INVALID_LOCATION_TYPE],
    });
  }
}

export class LocationParentInvalidException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_PARENT_INVALID,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_PARENT_INVALID],
    });
  }
}

export class LocationParentCycleException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_PARENT_CYCLE,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_PARENT_CYCLE],
    });
  }
}

export class LocationSubtreeHasStockException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.LOCATION_SUBTREE_HAS_STOCK,
      message: ERROR_MESSAGE[ErrorCode.LOCATION_SUBTREE_HAS_STOCK],
    });
  }
}

export class DefaultLocationMustBeBinException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.DEFAULT_LOCATION_MUST_BE_BIN,
      message: ERROR_MESSAGE[ErrorCode.DEFAULT_LOCATION_MUST_BE_BIN],
    });
  }
}
