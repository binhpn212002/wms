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

  // Attribute value
  ATTRIBUTE_VALUE_NOT_FOUND: 'ATTRIBUTE_VALUE_NOT_FOUND',
  ATTRIBUTE_VALUE_CODE_DUPLICATE: 'ATTRIBUTE_VALUE_CODE_DUPLICATE',
  ATTRIBUTE_VALUE_IN_USE: 'ATTRIBUTE_VALUE_IN_USE',

  // Unit (UoM)
  UNIT_NOT_FOUND: 'UNIT_NOT_FOUND',
  UNIT_CODE_DUPLICATE: 'UNIT_CODE_DUPLICATE',
  UNIT_IN_USE: 'UNIT_IN_USE',

  // Product
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_CODE_DUPLICATE: 'PRODUCT_CODE_DUPLICATE',

  // Product variant
  VARIANT_NOT_FOUND: 'VARIANT_NOT_FOUND',
  VARIANT_SKU_DUPLICATE: 'VARIANT_SKU_DUPLICATE',
  VARIANT_BARCODE_DUPLICATE: 'VARIANT_BARCODE_DUPLICATE',
  VARIANT_ATTRIBUTE_INVALID: 'VARIANT_ATTRIBUTE_INVALID',
  VARIANT_COMBO_DUPLICATE: 'VARIANT_COMBO_DUPLICATE',
  VARIANT_IN_USE: 'VARIANT_IN_USE',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ERROR_MESSAGE: Record<ErrorCodeValue, string> = {
  // Category messages
  [ErrorCode.CATEGORY_NOT_FOUND]: 'Không tìm thấy danh mục',
  [ErrorCode.CATEGORY_CODE_DUPLICATE]: 'Mã danh mục đã tồn tại',
  [ErrorCode.CATEGORY_PARENT_INVALID]:
    'Danh mục cha không tồn tại hoặc đã bị xóa',
  [ErrorCode.CATEGORY_PARENT_CYCLE]:
    'Không thể đặt cha là chính danh mục hoặc một danh mục con của nó',
  [ErrorCode.CATEGORY_HAS_CHILDREN]: 'Không thể xóa khi còn danh mục con',
  [ErrorCode.CATEGORY_HAS_PRODUCTS]:
    'Không thể xóa khi còn sản phẩm tham chiếu',

  // Attribute messages
  [ErrorCode.ATTRIBUTE_NOT_FOUND]: 'Không tìm thấy thuộc tính',
  [ErrorCode.ATTRIBUTE_CODE_DUPLICATE]: 'Mã thuộc tính đã tồn tại',
  [ErrorCode.ATTRIBUTE_HAS_VALUES]: 'Không thể xóa khi còn giá trị thuộc tính',

  [ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND]: 'Không tìm thấy giá trị thuộc tính',
  [ErrorCode.ATTRIBUTE_VALUE_CODE_DUPLICATE]:
    'Mã giá trị đã tồn tại trong thuộc tính này',
  [ErrorCode.ATTRIBUTE_VALUE_IN_USE]:
    'Không thể xóa khi giá trị đang được biến thể/SKU tham chiếu',

  [ErrorCode.UNIT_NOT_FOUND]: 'Không tìm thấy đơn vị tính',
  [ErrorCode.UNIT_CODE_DUPLICATE]: 'Mã đơn vị tính đã tồn tại',
  [ErrorCode.UNIT_IN_USE]:
    'Không thể xóa khi còn sản phẩm hoặc chứng từ tham chiếu đơn vị này',

  [ErrorCode.PRODUCT_NOT_FOUND]: 'Không tìm thấy sản phẩm',
  [ErrorCode.PRODUCT_CODE_DUPLICATE]: 'Mã sản phẩm đã tồn tại',

  [ErrorCode.VARIANT_NOT_FOUND]: 'Không tìm thấy biến thể',
  [ErrorCode.VARIANT_SKU_DUPLICATE]: 'Mã SKU đã tồn tại',
  [ErrorCode.VARIANT_BARCODE_DUPLICATE]: 'Mã vạch đã tồn tại',
  [ErrorCode.VARIANT_ATTRIBUTE_INVALID]:
    'Tập giá trị thuộc tính không hợp lệ (trùng loại, thiếu hoặc không khả dụng)',
  [ErrorCode.VARIANT_COMBO_DUPLICATE]:
    'Đã có biến thể khác cùng tổ hợp giá trị thuộc tính',
  [ErrorCode.VARIANT_IN_USE]:
    'Không thể xóa biến thể khi còn tồn/chứng từ tham chiếu',
};
