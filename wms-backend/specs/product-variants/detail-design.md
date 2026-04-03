# Biến thể sản phẩm (product variants) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Sản phẩm — detail design](../products/detail-design.md) (nền tảng `product_variants`, `product_variant_attribute_values`)
- [Thuộc tính — detail design](../master-data/attributes/detail-design.md)
- [Giá trị thuộc tính — detail design](../master-data/attribute-values/detail-design.md)

## Phạm vi MVP

- CRUD biến thể theo `product_id`.
- Mỗi biến thể có:
  - Định danh: `sku` (unique), `barcode` (tùy chọn).
  - Tổ hợp giá trị thuộc tính (MVP): API dùng **`attributeId`** + **`valueId`** (cùng là UUID) hoặc omit/`null` cả hai cho “default variant”. `valueId` = `attribute_values.id`; **`attribute_values.attribute_id` phải khớp `attributeId`** (422 nếu sai). Lưu DB qua bảng nối (tối đa **một** dòng map trên variant).
  - Thuộc tính catalog theo SKU: **giá**, **ảnh**, **trạng thái**, và các ngưỡng cảnh báo (nếu dùng).
- **Không** lưu “tồn thực tế” trên biến thể. Tồn được tính bởi module Inventory theo `variant_id` (và `warehouse_id`/`location_id`).

## Mô hình dữ liệu

### Bảng `product_variants` (mở rộng)

Phần cột nền tảng xem tại [products/detail-design.md](../products/detail-design.md#bảng-product_variants). Module này **mở rộng** các cột sau:

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `active` | boolean | Có | Mặc định `true`; `false` = ngừng bán/ẩn khỏi chọn mới (không ảnh hưởng dữ liệu chứng từ lịch sử). |
| `currency_code` | char(3) | Không | ISO-4217 (VD: `VND`, `USD`). Nếu hệ thống chỉ dùng 1 tiền tệ, có thể bỏ cột này và suy ra từ config. |
| `list_price` | decimal(18,2) hoặc numeric | Không | Giá niêm yết theo SKU. Cho phép `null` nếu chưa niêm yết. |
| `cost_price` | decimal(18,2) hoặc numeric | Không | Giá vốn theo SKU (tùy nghiệp vụ); có thể `null`. |
| `image_urls` | jsonb (array string) / text[] | Không | Danh sách URL ảnh theo thứ tự hiển thị. |
| `min_stock` | decimal(18,3) hoặc numeric | Không | Ngưỡng cảnh báo tồn thấp (reorder/min). **Không** là tồn thực tế. |
| `max_stock` | decimal(18,3) hoặc numeric | Không | Ngưỡng cảnh báo tồn cao (optional). |

**Index gợi ý**

- `(product_id, active)` để list biến thể đang bán theo sản phẩm.
- Nếu có `currency_code`: index `(currency_code)` chỉ khi cần lọc nhiều; MVP thường không cần.

**Ràng buộc**

- `list_price >= 0`, `cost_price >= 0` (nếu không null).
- `min_stock >= 0`, `max_stock >= 0` (nếu không null).
- Nếu dùng `min_stock` và `max_stock`: `max_stock >= min_stock` (nếu cả hai có giá trị).

### Bảng nối `product_variant_attribute_values`

Giữ nguyên theo [products/detail-design.md](../products/detail-design.md#bảng-product_variant_attribute_values-nối-variant--giá-trị-thuộc-tính).

## Quy tắc nghiệp vụ

1. **`sku`**
   - Unique trong các bản ghi chưa xóa mềm.
   - Trim/validate ký tự theo chuẩn WMS.

2. **`barcode`**
   - Optional; nếu policy yêu cầu unique, dùng unique partial index như đã mô tả ở module Products.

3. **`attributeId` + `valueId` (body/response — UUID)**
   - Khi có phân biệt SKU: gửi **cả hai** `attributeId` (`attributes.id`) và `valueId` (`attribute_values.id`). `valueId` phải tồn tại, chưa xóa mềm, và `attribute_values.attribute_id === attributeId` (422 `ATTRIBUTE_VALUE_MISMATCH` nếu không khớp; 422 `ATTRIBUTE_VALUE_INVALID` nếu id không tồn tại).
   - **MVP**: tối đa **một** cặp trên mỗi variant; không hỗ trợ nhiều trục trong cùng biến thể — **mở rộng sau**.
   - Default variant: không gửi / `null` **cả** `attributeId` **và** `valueId` (thống nhất một quy ước) → không ghi dòng `product_variant_attribute_values`.
   - Trong cùng `product_id`: không trùng **`valueId`** (policy như trước); không hai default trùng quy tắc nếu team cấm (409 `VARIANT_COMBINATION_CONFLICT`).
   - **Response** (GET/POST/PATCH): luôn có **`productId`** (uuid). Khi có map: trả **`attributeId`**, **`valueId`** ngang hàng với các field catalog; có thể kèm `attributeValue` (code, name) để UI.

4. **Giá**
   - Cho phép `null` (chưa niêm yết) hoặc bắt buộc (nếu UI yêu cầu) — cần thống nhất ở tầng API validation.
   - \(list\_price, cost\_price \ge 0\).

5. **Ảnh**
   - MVP cho phép lưu URL tuyệt đối hoặc tương đối.
   - Giới hạn số lượng URL (VD: 10) và độ dài mỗi URL theo validator chung để tránh payload quá lớn.

6. **Số lượng**
   - `min_stock/max_stock` chỉ phục vụ cảnh báo; tồn thực tế lấy từ Inventory.

## API

Khuyến nghị giữ nested theo product để đảm bảo không thao tác nhầm quan hệ `product_id`.

### `GET /products/:productId/variants`

- **Query (gợi ý)**:
  - `q`: tìm theo `sku`/`barcode`.
  - `active`: boolean.
  - `includeDeleted`: boolean (mặc định `false`).
- **Response (gợi ý)**: danh sách variant, mỗi item có:
  - `id` (uuid), **`productId`** (uuid), `sku`, `barcode`, `active`
  - `currencyCode?`, `listPrice?`, `costPrice?`
  - `imageUrls?`
  - `minStock?`, `maxStock?`
  - **`attributeId?`** (uuid), **`valueId?`** (uuid) — default variant: cả hai `null`/omit; kèm tùy chọn **`attributeValue`** `{ id, attributeId, code, name }` trùng id với `valueId` khi có.

### `POST /products/:productId/variants`

Tạo một biến thể cho product.

- **Lưu ý MVP**: mỗi request **chỉ tạo 1 biến thể**. Không hỗ trợ “tạo nhiều biến thể cùng lúc” (bulk create / sinh tổ hợp) trong endpoint này.

- **Body (gợi ý)**:
  - `sku` (required)
  - `barcode?`
  - `active?`
  - `currencyCode?`, `listPrice?`, `costPrice?`
  - `imageUrls?` (string[])
  - `minStock?`, `maxStock?`
  - **`attributeId?`**, **`valueId?`** (uuid) — cùng lúc có hoặc cùng lúc không (default); không gửi một trong hai.

- **Validate (tối thiểu)**:
  - `productId` (từ path) tồn tại và chưa xóa mềm.
  - `sku` unique (partial unique với `deleted_at IS NULL`).
  - `attributeId` / `valueId`:
    - Cả hai có hoặc cả hai không (422 nếu chỉ có một nửa).
    - Khi có: `valueId` hợp lệ và `attribute_values.attribute_id === attributeId`.
    - Không trùng **`valueId`** với variant khác cùng `productId` (policy nhất quán).
  - Giá/ngưỡng: không âm; nếu có `minStock` và `maxStock` thì `maxStock >= minStock`.

- **Triển khai**: sau validate, ghi **0 hoặc 1** dòng `product_variant_attribute_values` với `attribute_value_id = valueId`.

- **201**: trả entity đầy đủ: **`productId`**, các field catalog, **`attributeId`**, **`valueId`**, và tùy chọn `attributeValue`.
- **409**: trùng `sku`/`barcode` hoặc trùng `valueId` / default trùng (theo rule).
- **422**: validation sai (giá âm, URL quá dài, cặp `attributeId`/`valueId` không hợp lệ…).

**Ví dụ request**

```json
{
  "sku": "TSHIRT-RED-M",
  "barcode": "8931234567890",
  "active": true,
  "currencyCode": "VND",
  "listPrice": 199000,
  "costPrice": 120000,
  "imageUrls": ["https://cdn.example.com/p/1.png", "https://cdn.example.com/p/2.png"],
  "minStock": 10,
  "maxStock": 200,
  "attributeId": "uuid-attr-color",
  "valueId": "uuid-color-red"
}
```

**Ví dụ response (201)**

```json
{
  "id": "uuid-variant",
  "productId": "uuid-product",
  "sku": "TSHIRT-RED-M",
  "barcode": "8931234567890",
  "active": true,
  "currencyCode": "VND",
  "listPrice": 199000,
  "costPrice": 120000,
  "imageUrls": ["https://cdn.example.com/p/1.png", "https://cdn.example.com/p/2.png"],
  "minStock": 10,
  "maxStock": 200,
  "attributeId": "uuid-attr-color",
  "valueId": "uuid-color-red",
  "attributeValue": {
    "id": "uuid-color-red",
    "attributeId": "uuid-attr-color",
    "code": "RED",
    "name": "Đỏ"
  },
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T10:00:00.000Z"
}
```

### `PATCH /products/:productId/variants/:variantId`

Cập nhật **một** biến thể (cùng quy ước MVP như `POST`: một variant mỗi lần gọi, tối đa một cặp `attributeId`/`valueId`).

- **Body (gợi ý)** — tất cả optional, chỉ gửi field cần đổi:
  - `sku?`
  - `barcode?`
  - `active?`
  - `currencyCode?`, `listPrice?`, `costPrice?`
  - `imageUrls?` (string[])
  - `minStock?`, `maxStock?`
  - **`attributeId?`**, **`valueId?`** (uuid)
    - Nếu body **có** một trong hai (`attributeId` hoặc `valueId`) thì phải có **đủ cả hai** (giống `POST` — 422 `ATTRIBUTE_VALUE_MISMATCH` nếu thiếu một nửa).
    - Gửi **cả hai `null`** (hoặc quy ước tương đương) để chuyển variant về **default** — xóa dòng `product_variant_attribute_values`.
    - **Không** gửi `attributeId`/`valueId` trong body → **giữ nguyên** map thuộc tính hiện tại.

- **Validate (tối thiểu)** (áp dụng cho field có trong body):
  - `variantId` thuộc `productId`, tồn tại và chưa xóa mềm — **404** nếu không.
  - `productId` (path) hợp lệ.
  - `sku` (nếu đổi): unique trên các variant chưa xóa mềm **trừ chính** `variantId` hiện tại.
  - `attributeId` / `valueId` (nếu gửi cặp): cùng quy tắc như `POST`, và `valueId` không trùng variant **khác** cùng `productId`.
  - Giá/ngưỡng: như `POST`.

- **Triển khai**: transaction — update các cột `product_variants`; nếu body có cặp `attributeId`/`valueId` hoặc explicit null cả hai, replace map (0 hoặc 1 dòng).

- **200**: trả entity đầy đủ như `GET` / response `POST` (`productId`, catalog fields, `attributeId`, `valueId`, `attributeValue?`, audit).
- **404**: product/variant không tồn tại, sai quan hệ `variantId` ↔ `productId`, hoặc đã xóa mềm.
- **409** / **422**: giống `POST` (SKU/barcode, trùng `valueId`, validation).

**Ví dụ request** (chỉ đổi giá + đổi màu)

```json
{
  "listPrice": 219000,
  "attributeId": "uuid-attr-color",
  "valueId": "uuid-color-blue"
}
```

**Ví dụ response (200)**

```json
{
  "id": "uuid-variant",
  "productId": "uuid-product",
  "sku": "TSHIRT-RED-M",
  "barcode": "8931234567890",
  "active": true,
  "currencyCode": "VND",
  "listPrice": 219000,
  "costPrice": 120000,
  "imageUrls": ["https://cdn.example.com/p/1.png"],
  "minStock": 10,
  "maxStock": 200,
  "attributeId": "uuid-attr-color",
  "valueId": "uuid-color-blue",
  "attributeValue": {
    "id": "uuid-color-blue",
    "attributeId": "uuid-attr-color",
    "code": "BLUE",
    "name": "Xanh"
  },
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T12:30:00.000Z"
}
```

### `DELETE /products/:productId/variants/:variantId`

- Xóa mềm.
- **409** nếu còn tham chiếu tồn/chứng từ tới `variant_id`.
- **204** nếu thành công.

### (Tùy chọn) `GET /product-variants`

Endpoint tra cứu SKU phục vụ luồng kho (quét barcode):

- **Query**: `q` (sku/barcode), `active`, `includeDeleted`.
- **Response**: danh sách variant + `product` minimal `{ id, code, name }`.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP | `code` gợi ý |
|------------|------|--------------|
| Không tìm thấy | 404 | `NOT_FOUND` |
| Trùng SKU | 409 | `SKU_CONFLICT` |
| Trùng barcode | 409 | `BARCODE_CONFLICT` |
| Trùng tổ hợp attribute | 409 | `VARIANT_COMBINATION_CONFLICT` |
| Attribute value không hợp lệ (`valueId` không tồn tại / đã xóa mềm) | 422 | `ATTRIBUTE_VALUE_INVALID` |
| Chỉ có `attributeId` hoặc chỉ có `valueId`; hoặc `valueId` không thuộc `attributeId` | 422 | `ATTRIBUTE_VALUE_MISMATCH` |
| Không cho xóa vì còn tham chiếu kho | 409 | `VARIANT_IN_USE` |

## Ghi chú triển khai

- Tạo/cập nhật variant nên dùng **transaction**: update `product_variants`, sau đó replace map `product_variant_attribute_values` — MVP **tối đa một** `attribute_value_id` trên variant.
- **Mở rộng sau**: nhiều trục thuộc tính (vd. Color + Size) — chấp nhận mảng `valueIds` hoặc đồng bộ lại với [products/detail-design](../products/detail-design.md) (nhiều dòng map).
- `image_urls`: nếu DB không thuận tiện json/array, có thể tách bảng `product_variant_images(variant_id, url, sort)`; MVP ưu tiên json/array cho nhanh.
- Nếu team muốn enforce DB-level “mỗi attribute tối đa một value trong variant”: cân nhắc denormalize `attribute_id` ở bảng nối và unique `(variant_id, attribute_id)` như mô tả ở spec Products.
