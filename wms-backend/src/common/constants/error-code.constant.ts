/** Mã lỗi + thông điệp API dùng chung (master-data và mở rộng sau). 
 * Kết hợp Category & Attribute error codes/message thành một object duy nhất.
 */

export const ErrorCode = {
  // Category
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_CODE_DUPLICATE: 'CATEGORY_CODE_DUPLICATE',
  CATEGORY_PARENT_INVALID: 'CATEGORY_PARENT_INVALID',
  CATEGORY_PARENT_CYCLE: 'CATEGORY_PARENT_CYCLE',
  CATEGORY_HAS_CHILDREN: 'CATEGORY_HAS_CHILDREN',
  CATEGORY_HAS_PRODUCTS: 'CATEGORY_HAS_PRODUCTS',

  // Attribute
  ATTRIBUTE_NOT_FOUND: 'ATTRIBUTE_NOT_FOUND',
  ATTRIBUTE_CODE_DUPLICATE: 'ATTRIBUTE_CODE_DUPLICATE',
  ATTRIBUTE_HAS_VALUES: 'ATTRIBUTE_HAS_VALUES',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ERROR_MESSAGE: Record<ErrorCodeValue, string> = {
  // Category messages
  [ErrorCode.CATEGORY_NOT_FOUND]: 'Không tìm thấy danh mục',
  [ErrorCode.CATEGORY_CODE_DUPLICATE]: 'Mã danh mục đã tồn tại',
  [ErrorCode.CATEGORY_PARENT_INVALID]: 'Danh mục cha không tồn tại hoặc đã bị xóa',
  [ErrorCode.CATEGORY_PARENT_CYCLE]:
    'Không thể đặt cha là chính danh mục hoặc một danh mục con của nó',
  [ErrorCode.CATEGORY_HAS_CHILDREN]: 'Không thể xóa khi còn danh mục con',
  [ErrorCode.CATEGORY_HAS_PRODUCTS]: 'Không thể xóa khi còn sản phẩm tham chiếu',

  // Attribute messages
  [ErrorCode.ATTRIBUTE_NOT_FOUND]: 'Không tìm thấy thuộc tính',
  [ErrorCode.ATTRIBUTE_CODE_DUPLICATE]: 'Mã thuộc tính đã tồn tại',
  [ErrorCode.ATTRIBUTE_HAS_VALUES]: 'Không thể xóa khi còn giá trị thuộc tính',
};
