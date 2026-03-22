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

  // Supplier
  SUPPLIER_NOT_FOUND: 'SUPPLIER_NOT_FOUND',
  SUPPLIER_CODE_DUPLICATE: 'SUPPLIER_CODE_DUPLICATE',
  SUPPLIER_TAX_ID_DUPLICATE: 'SUPPLIER_TAX_ID_DUPLICATE',
  SUPPLIER_IN_USE: 'SUPPLIER_IN_USE',
  SUPPLIER_CONTACT_NOT_FOUND: 'SUPPLIER_CONTACT_NOT_FOUND',

  // Inventory
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ONLY_BIN_FOR_STOCK: 'ONLY_BIN_FOR_STOCK',
  LOCATION_WAREHOUSE_MISMATCH: 'LOCATION_WAREHOUSE_MISMATCH',
  WAREHOUSE_NOT_FOUND: 'WAREHOUSE_NOT_FOUND',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  WAREHOUSE_CODE_DUPLICATE: 'WAREHOUSE_CODE_DUPLICATE',
  LOCATION_CODE_DUPLICATE: 'LOCATION_CODE_DUPLICATE',
  LOCATION_HAS_CHILDREN: 'LOCATION_HAS_CHILDREN',
  LOCATION_HAS_STOCK: 'LOCATION_HAS_STOCK',
  LOCATION_IS_DEFAULT_FOR_WAREHOUSE: 'LOCATION_IS_DEFAULT_FOR_WAREHOUSE',
  WAREHOUSE_HAS_STOCK: 'WAREHOUSE_HAS_STOCK',
  INVALID_LOCATION_TYPE: 'INVALID_LOCATION_TYPE',
  LOCATION_PARENT_INVALID: 'LOCATION_PARENT_INVALID',
  LOCATION_PARENT_CYCLE: 'LOCATION_PARENT_CYCLE',
  LOCATION_SUBTREE_HAS_STOCK: 'LOCATION_SUBTREE_HAS_STOCK',
  DEFAULT_LOCATION_MUST_BE_BIN: 'DEFAULT_LOCATION_MUST_BE_BIN',

  // Inbound
  INBOUND_NOT_FOUND: 'INBOUND_NOT_FOUND',
  INBOUND_DOCUMENT_NO_DUPLICATE: 'INBOUND_DOCUMENT_NO_DUPLICATE',
  INBOUND_INVALID_STATUS: 'INBOUND_INVALID_STATUS',
  INBOUND_CANNOT_MODIFY_COMPLETED: 'INBOUND_CANNOT_MODIFY_COMPLETED',
  INBOUND_NO_LINES: 'INBOUND_NO_LINES',
  INBOUND_MISSING_LOCATION: 'INBOUND_MISSING_LOCATION',
  INBOUND_SUPPLIER_INACTIVE: 'INBOUND_SUPPLIER_INACTIVE',
  INBOUND_WAREHOUSE_INACTIVE: 'INBOUND_WAREHOUSE_INACTIVE',

  // Outbound
  OUTBOUND_NOT_FOUND: 'OUTBOUND_NOT_FOUND',
  OUTBOUND_DOCUMENT_NO_DUPLICATE: 'OUTBOUND_DOCUMENT_NO_DUPLICATE',
  OUTBOUND_INVALID_STATUS: 'OUTBOUND_INVALID_STATUS',
  OUTBOUND_CANNOT_MODIFY_COMPLETED: 'OUTBOUND_CANNOT_MODIFY_COMPLETED',
  OUTBOUND_NO_LINES: 'OUTBOUND_NO_LINES',
  OUTBOUND_WAREHOUSE_INACTIVE: 'OUTBOUND_WAREHOUSE_INACTIVE',
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

  [ErrorCode.SUPPLIER_NOT_FOUND]: 'Không tìm thấy nhà cung cấp',
  [ErrorCode.SUPPLIER_CODE_DUPLICATE]: 'Mã nhà cung cấp đã tồn tại',
  [ErrorCode.SUPPLIER_TAX_ID_DUPLICATE]: 'Mã số thuế đã tồn tại',
  [ErrorCode.SUPPLIER_IN_USE]:
    'Không thể xóa nhà cung cấp khi còn phiếu nhập/chứng từ tham chiếu',
  [ErrorCode.SUPPLIER_CONTACT_NOT_FOUND]: 'Không tìm thấy liên hệ',

  [ErrorCode.INSUFFICIENT_STOCK]: 'Không đủ tồn kho tại kho/vị trí',
  [ErrorCode.ONLY_BIN_FOR_STOCK]: 'Chỉ được ghi tồn kho tại vị trí loại bin',
  [ErrorCode.LOCATION_WAREHOUSE_MISMATCH]: 'Vị trí không thuộc kho đã chọn',
  [ErrorCode.WAREHOUSE_NOT_FOUND]: 'Không tìm thấy kho',
  [ErrorCode.LOCATION_NOT_FOUND]: 'Không tìm thấy vị trí',
  [ErrorCode.WAREHOUSE_CODE_DUPLICATE]: 'Mã kho đã tồn tại',
  [ErrorCode.LOCATION_CODE_DUPLICATE]: 'Mã vị trí đã tồn tại trong kho này',
  [ErrorCode.LOCATION_HAS_CHILDREN]: 'Không thể xóa khi còn vị trí con',
  [ErrorCode.LOCATION_HAS_STOCK]: 'Không thể xóa khi vị trí còn tồn kho',
  [ErrorCode.LOCATION_IS_DEFAULT_FOR_WAREHOUSE]:
    'Không thể xóa vị trí đang là ô mặc định của kho — hãy đổi default trước',
  [ErrorCode.WAREHOUSE_HAS_STOCK]: 'Không thể xóa kho khi còn tồn kho',
  [ErrorCode.INVALID_LOCATION_TYPE]:
    'Loại vị trí không hợp lệ (zone / rack / bin)',
  [ErrorCode.LOCATION_PARENT_INVALID]:
    'Vị trí cha không tồn tại, không cùng kho hoặc đã bị xóa',
  [ErrorCode.LOCATION_PARENT_CYCLE]:
    'Không thể đặt cha tạo chu trình trong cây vị trí',
  [ErrorCode.LOCATION_SUBTREE_HAS_STOCK]:
    'Không thể thay đổi khi cây con còn tồn kho',
  [ErrorCode.DEFAULT_LOCATION_MUST_BE_BIN]:
    'Ô mặc định phải thuộc kho và có loại bin',

  [ErrorCode.INBOUND_NOT_FOUND]: 'Không tìm thấy phiếu nhập',
  [ErrorCode.INBOUND_DOCUMENT_NO_DUPLICATE]: 'Số phiếu nhập đã tồn tại',
  [ErrorCode.INBOUND_INVALID_STATUS]: 'Trạng thái phiếu không cho phép thao tác này',
  [ErrorCode.INBOUND_CANNOT_MODIFY_COMPLETED]:
    'Không thể sửa phiếu đã hoàn tất',
  [ErrorCode.INBOUND_NO_LINES]: 'Phiếu nhập chưa có dòng hàng',
  [ErrorCode.INBOUND_MISSING_LOCATION]:
    'Thiếu vị trí đích và kho chưa cấu hình ô mặc định',
  [ErrorCode.INBOUND_SUPPLIER_INACTIVE]:
    'Nhà cung cấp không hoạt động — không thể chọn cho phiếu mới',
  [ErrorCode.INBOUND_WAREHOUSE_INACTIVE]:
    'Kho không hoạt động — không thể chọn cho phiếu mới',

  [ErrorCode.OUTBOUND_NOT_FOUND]: 'Không tìm thấy phiếu xuất',
  [ErrorCode.OUTBOUND_DOCUMENT_NO_DUPLICATE]: 'Số phiếu xuất đã tồn tại',
  [ErrorCode.OUTBOUND_INVALID_STATUS]:
    'Trạng thái phiếu xuất không cho phép thao tác này',
  [ErrorCode.OUTBOUND_CANNOT_MODIFY_COMPLETED]:
    'Không thể sửa phiếu xuất đã hoàn tất',
  [ErrorCode.OUTBOUND_NO_LINES]: 'Phiếu xuất chưa có dòng hàng',
  [ErrorCode.OUTBOUND_WAREHOUSE_INACTIVE]:
    'Kho không hoạt động — không thể chọn cho phiếu xuất mới',
};
