# Sản phẩm (products) — Detail design

## Tài liệu tham chiếu

- [Kế hoạch triển khai](./plan.md)
- [Basic design](./basic-design.md)
- [Loại sản phẩm — detail design](../master-data/categories/detail-design.md)
- [Đơn vị tính — detail design](../master-data/units/detail-design.md)
- [Thuộc tính — detail design](../master-data/attributes/detail-design.md)
- [Giá trị thuộc tính — detail design](../master-data/attribute-values/detail-design.md)
- [Master data — tổng quan](../master-data/basic-design.md)

## Phạm vi MVP

- **Product**: tên, mã nội bộ (`code`), `category_id`, `default_uom_id`, `active`, xóa mềm.
- **Product variant**: mỗi biến thể thuộc đúng một product; **SKU** unique toàn hệ thống (trong các bản ghi variant chưa xóa mềm); **barcode** tùy chọn.
- **Tập giá trị thuộc tính trên variant**: qua bảng nối variant ↔ `attribute_values`; trong **một** variant, mỗi `attribute_id` **tối đa một** `attribute_value_id` (không hai giá trị cùng loại thuộc tính).
- Master data (category, unit, attribute, attribute value) chỉ **được chọn** qua FK / ID đã tồn tại; không tạo attribute/value trong luồng product.

## Mô hình dữ liệu

### Bảng `products`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã nội bộ sản phẩm — unique trong các bản ghi **chưa xóa mềm** |
| `name` | string | Có | Tên hiển thị |
| `category_id` | UUID (FK → `categories.id`) | Có | Danh mục |
| `default_uom_id` | UUID (FK → `units.id`) | Có | Đơn vị tính mặc định (bán/tồn theo một UoM) |
| `active` | boolean | Có | Mặc định `true`; `false` = ngừng bán / ẩn khỏi chọn mới tùy UI |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm: `null` = còn hiệu lực |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial**: `(code)` **WHERE** `deleted_at IS NULL`.
- FK: `(category_id)`, `(default_uom_id)`; lọc mặc định `deleted_at IS NULL`.
- Tìm kiếm danh sách: `(name)`, `(code)` hoặc index full-text/GIN tùy policy — MVP có thể chỉ `ILIKE` trên `name`/`code`.

**FK**

- `category_id` → `categories.id` — category phải tồn tại và **chưa xóa mềm** khi gán (trừ policy admin).
- `default_uom_id` → `units.id` — unit phải tồn tại và **chưa xóa mềm**, nên `active = true` khi tạo mới sản phẩm (tùy quy tắc dự án).

### Bảng `product_variants`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính; đây là thực thể tham chiếu ở kho/chứng từ (`variant_id`) |
| `product_id` | UUID (FK → `products.id`) | Có | Sản phẩm cha |
| `sku` | string | Có | Mã SKU **unique** trong phạm vi bản ghi variant chưa xóa mềm (toàn hệ thống MVP) |
| `barcode` | string, nullable | Không | Mã vạch in nhãn; có thể unique hoặc không tùy policy — nếu unique thì partial index tương tự `sku` |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial**: `(sku)` **WHERE** `deleted_at IS NULL`.
- `(product_id)` cho danh sách variant theo product.
- Nếu `barcode` unique khi có giá trị: unique partial `(barcode)` **WHERE** `deleted_at IS NULL AND barcode IS NOT NULL`.

**Ghi chú**

- MVP có **ít nhất một** variant cho mỗi product sau khi tạo (quy tắc nghiệp vụ / transaction tạo product + variant đầu tiên).
- Trạng thái “ngừng bán” chủ yếu qua `products.active`; có thể bổ sung `product_variants.active` sau nếu cần ngừng từng SKU.

### Bảng `product_variant_attribute_values` (nối variant ↔ giá trị thuộc tính)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `variant_id` | UUID (FK → `product_variants.id`) | Có | Biến thể |
| `attribute_value_id` | UUID (FK → `attribute_values.id`) | Có | Một lựa chọn (VD: Size=M, Color=Đỏ) |

**Khóa & ràng buộc**

- PK hoặc unique `(variant_id, attribute_value_id)` — một variant không gán trùng cùng một `attribute_value_id` hai lần.
- **Quy tắc nghiệp vụ**: tập `attribute_value_id` của một variant phải có **các `attribute_id` đôi một khác nhau** (mỗi loại thuộc tính tối đa một giá trị). Có thể enforce bằng:
  - Validate tại service layer (join `attribute_values` để nhóm theo `attribute_id`), và/hoặc
  - Cột sinh / denormalize `attribute_id` trên bảng nối + **UNIQUE `(variant_id, attribute_id)`** nếu team chấp nhận redundancy để siết DB.

**FK**

- `attribute_value_id` → `attribute_values.id` — giá trị phải tồn tại, chưa xóa mềm; nên `active = true` khi gán mới (đồng bộ [attribute-values detail design](../master-data/attribute-values/detail-design.md)).

**Uniqueness tổ hợp variant (cùng product)**

- Hai variant của **cùng một** `product_id` không được có **cùng một tập** `attribute_value_id` (cùng “hương vị” tổ hợp). Cách kiểm tra MVP: chuẩn hóa tập ID (sắp xếp), so sánh hoặc hash; thực hiện khi POST/PATCH variant.

### Liên kết module kho / chứng từ

- Mọi dòng tồn/chứng từ tham chiếu **`product_variants.id`** (và `warehouse_id` / `location_id` nếu có) — ngoài phạm vi file này; khi đã có FK, **không** xóa mềm variant đang được tham chiếu (409).
- **Nhập kho / nhà cung cấp**: phiếu nhập có thể có `supplier_id` — thuộc module inbound/suppliers, **không** là cột trên `products` / `product_variants` trong MVP (xem [Nhà cung cấp — basic design](../suppliers/basic-design.md)).

## Quy tắc nghiệp vụ

1. **`products.code`**
   - Trim; độ dài / ký tự cho phép theo validator chung WMS.
   - Unique trong các bản ghi `deleted_at IS NULL`.

2. **`product_variants.sku`**
   - Trim; unique trong các bản ghi variant `deleted_at IS NULL` (toàn hệ thống MVP; sau này có thể `(org_id, sku)` nếu multi-tenant).

3. **Gán `attribute_value_id`**
   - Mỗi ID phải tồn tại trong `attribute_values`, chưa xóa mềm.
   - Không trùng `attribute_id` trong cùng một variant (xem mục bảng nối).
   - Không trùng **tổ hợp** giá trị với variant khác cùng `product_id`.

4. **`products.deleted_at`**
   - Query mặc định: `deleted_at IS NULL` trừ API có `includeDeleted=true` (admin).
   - Xóa mềm product: thường **cascade** xóa mềm các variant và map (trong một transaction) **hoặc** chặn khi còn variant/chứng từ — team chọn một policy nhất quán; MVP gợi ý: **chặn** xóa product nếu còn bất kỳ tham chiếu từ kho/chứng từ tới bất kỳ variant nào; nếu chưa có module kho, có thể cho phép xóa mềm product + toàn bộ variant con khi không có FK ngoài.

5. **`product_variants.deleted_at`**
   - Tương tự; **409** nếu còn tồn/chứng từ tham chiếu `variant_id`.

6. **Category / UoM**
   - Đổi `category_id` / `default_uom_id`: validate FK và quy tắc `active`/`deleted_at` như các module master-data liên quan.

## API

Base path gợi ý: `/products` (prefix global `/api/v1` nếu dự án dùng versioning). Form master-data dùng các endpoint đã có: `/master-data/categories`, `/master-data/units`, `/master-data/attributes`, `/master-data/attributes/:attributeId/values`.

### `GET /products`

- **Mục đích**: Danh sách phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize` (hoặc `limit`/`offset` theo chuẩn dự án).
  - `q`: tìm theo `code`, `name` (partial, case-insensitive nếu DB hỗ trợ).
  - `category_id`, `active`: lọc.
  - `includeDeleted`: boolean (mặc định `false`).
  - `sort`: ví dụ `name`, `code`, `created_at`.

**Response**: body chuẩn list (items + meta total). Item có thể **không** embed toàn bộ variant để tránh payload lớn — hoặc có cờ `includeVariants=true`.

### `GET /products/:id`

- Chi tiết một product.
- **404** nếu không tồn tại hoặc đã xóa mềm (trừ `includeDeleted` + quyền).
- Gợi ý embed: category (id, code, name), default UoM (id, code, name), danh sách variant kèm tập attribute values đã resolve (id, code, name, `attribute_id`).

### `POST /products`

- **Body (gợi ý)**: `{ "code", "name", "categoryId", "defaultUomId", "active?" }`.
- Có thể tạo **kèm variant đầu tiên** trong cùng request (nested) hoặc bắt buộc gọi `POST .../variants` ngay sau — team chọn một luồng và giữ nhất quán.
- **201** + body entity.

### `PATCH /products/:id`

- **Body**: partial `code`, `name`, `categoryId`, `defaultUomId`, `active`.
- **404** / **409** / **422** tùy trường hợp.

### `DELETE /products/:id`

- **204** nếu xóa mềm thành công (theo policy không vi phạm tham chiếu kho).
- **409** nếu còn chứng từ/tồn tham chiếu bất kỳ variant — hoặc nếu policy là cascade, mô tả rõ trong triển khai.

### `POST /products/:id/variants`

- **Body (gợi ý)**: `{ "sku", "barcode?", "attributeValueIds": ["uuid", ...] }`.
- Validate tập `attributeValueIds` theo quy tắc trùng `attribute_id` và trùng tổ hợp trên product.
- **201** + variant đã tạo (kèm map giá trị đã resolve nếu cần).

### `PATCH /products/:id/variants/:variantId`

- **Body**: partial `sku`, `barcode`, `attributeValueIds` (thay toàn bộ tập hoặc diff tùy quy ước API — nên document rõ).
- **404** nếu `variantId` không thuộc `id`.

### `DELETE /products/:id/variants/:variantId`

- **204** / **409** tương tự rule tham chiếu kho.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công tạo | 201 |
| Thành công cập nhật | 200 |
| Thành công xóa | 204 |
| Không tìm thấy product/variant | 404 |
| Trùng `products.code` hoặc trùng `sku` / `barcode` (unique) | 409 |
| Vi phạm tập attribute (trùng attribute trong variant, trùng tổ hợp variant, value không hợp lệ) | 422 hoặc 409 (thống nhất mã `code` trong payload lỗi) |
| Còn tồn/chứng từ — không xóa | 409 |
| Payload không hợp lệ (validation) | 422 |

Payload lỗi: `code` (machine-readable) + `message` (human-readable) đồng bộ các module WMS.

## Ghi chú triển khai

- Entity base (`id`, `created_at`, `updated_at`) và `@DeleteDateColumn` cho `products` / `product_variants` nếu dùng TypeORM.
- Tạo/cập nhật variant nên trong **transaction**: ghi `product_variants`, xóa/ghi lại dòng bảng nối, kiểm tra unique SKU và tổ hợp.
- Đồng bộ với [attribute-values](../master-data/attribute-values/detail-design.md): không xóa mềm value đang map — đã mô tả ở master-data; product chỉ đọc.

## Mở rộng sau MVP

- `org_id` / `tenant_id`; unique `sku` theo tổ chức.
- `product_variants.active` để ngừng từng SKU.
- Hình ảnh, mô tả dài, thuộc tính mở rộng (EAV) hoặc JSON schema.
- Sinh variant **hàng loạt** từ tích Descartes các giá trị thuộc tính (kèm rule loại trừ tổ hợp).
