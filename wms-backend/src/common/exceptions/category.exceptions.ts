import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ERROR_MESSAGE, ErrorCode } from '../constants/error-code.constant';

export class CategoryNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: ErrorCode.CATEGORY_NOT_FOUND,
      message: ERROR_MESSAGE[ErrorCode.CATEGORY_NOT_FOUND],
    });
  }
}

export class CategoryCodeDuplicateException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.CATEGORY_CODE_DUPLICATE,
      message: ERROR_MESSAGE[ErrorCode.CATEGORY_CODE_DUPLICATE],
    });
  }
}

export class CategoryParentInvalidException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.CATEGORY_PARENT_INVALID,
      message: ERROR_MESSAGE[ErrorCode.CATEGORY_PARENT_INVALID],
    });
  }
}

export class CategoryParentCycleException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.CATEGORY_PARENT_CYCLE,
      message: ERROR_MESSAGE[ErrorCode.CATEGORY_PARENT_CYCLE],
    });
  }
}

export class CategoryHasChildrenException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.CATEGORY_HAS_CHILDREN,
      message: ERROR_MESSAGE[ErrorCode.CATEGORY_HAS_CHILDREN],
    });
  }
}

export class CategoryHasProductsException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.CATEGORY_HAS_PRODUCTS,
      message: ERROR_MESSAGE[ErrorCode.CATEGORY_HAS_PRODUCTS],
    });
  }
}
