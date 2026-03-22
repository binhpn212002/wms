# Giá trị thuộc tính (attribute values) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Thuộc tính — detail design](../attributes/detail-design.md)
- [Master data — tổng quan](../basic-design.md)

## Phạm vi MVP

- CRUD giá trị **lồng** trong một attribute: mỗi bản ghi là một lựa chọn cụ thể (`S`, `M`, `Đỏ`, …) thuộc đúng một `attribute_id`.
- Trường: `attribute_id` (FK), `code`, `name`, `active`, `sort_order` (tùy chọn).
- `code` unique trong phạm vi **cùng một `attribute_id`** (khác với `attributes.code` là unique toàn bảng).
- Tạo **tổ hợp biến thể** / SKU: module Product tham chiếu các **giá trị** (không gắn trực tiếp vào `attributes` ngoài quan hệ `attribute_id` → loại thuộc tính).

## Mô hình dữ liệu

### Bảng `attribute_values`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `attribute_id` | UUID (FK → `attributes.id`) | Có | Thuộc tính cha (Size, Color, …) |
| `code` | string | Có | Mã nghiệp vụ trong phạm vi attribute (VD: `S`, `RED`) — có thể trùng `code` với attribute khác |
| `name` | string | Có | Tên hiển thị (có thể khác `code`, VD: mã `RED`, tên `Đỏ`) |
| `active` | boolean | Có | Mặc định `true`; ẩn khỏi chọn mới mà không xóa |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm: `null` = còn hiệu lực |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial** (chỉ bản ghi chưa xóa mềm): `(attribute_id, code)` **WHERE** `deleted_at IS NULL`.
- Tra cứu theo attribute: `(attribute_id)` kèm filter `deleted_at IS NULL` trong query.
- Sắp xếp danh sách theo attribute: `(attribute_id, sort_order NULLS LAST, name)` hoặc `(attribute_id, sort_order, code)`.

**FK**

- `attribute_id` → `attributes.id` (ON DELETE: tùy policy — thường **RESTRICT** hoặc chỉ cho phép xóa attribute khi không còn value; xóa mềm attribute không xóa cascade value nếu team muốn giữ lịch sử — thống nhất với [attributes detail design](../attributes/detail-design.md)).

### Liên kết Product / variant

- Biến thể (variant) tham chiếu một tập **attribute value** (thường tối đa một giá trị cho mỗi `attribute_id` trong một combo — tùy nghiệp vụ Product).
- **Không xóa cứng** giá trị đang được variant/SKU tham chiếu; MVP: **xóa mềm** và/hoặc **chặn** xóa khi còn map (xem mục Quy tắc).

## Quy tắc nghiệp vụ

1. **`attribute_id`**
   - Phải trỏ tới `attributes` tồn tại và **chưa xóa mềm** (trừ API admin có `includeDeleted` trên attribute — nếu có; mặc định không cho gán value cho attribute đã xóa).

2. **`code`**
   - Trim khoảng trắng đầu/cuối; chuẩn hóa độ dài tối đa và ký tự cho phép giống các master-data khác.
   - Unique trong phạm vi `(attribute_id)` cho các bản ghi **chưa xóa mềm** (`deleted_at IS NULL`).

3. **`sort_order`**
   - Khi tạo mới: có thể gán tự động (max + 1 trong phạm vi `attribute_id`) hoặc để client gửi.

4. **`deleted_at`**
   - List/query mặc định: chỉ `deleted_at IS NULL` trừ khi API có `includeDeleted=true` (admin/audit).

5. **Xóa**
   - **Xóa mềm** (hành vi “xóa” chuẩn): set `deleted_at = now()` khi **không** còn variant/SKU (hoặc bảng map tương đương) tham chiếu giá trị này.
   - **409** nếu còn tham chiếu từ Product/variant — không cho xóa; cần gỡ mapping / đổi variant trước.
   - **Xóa cứng** (purge): chỉ khi không còn tham chiếu và có policy rõ (thường không MVP).

6. **`active`**
   - `active = false`: ẩn khỏi dropdown gán mới nếu API/UI filter; có thể vẫn hiện trong dữ liệu lịch sử variant đã tạo.

## API

Base path gợi ý: `/master-data/attributes/:attributeId/values` (prefix global `/api/v1` nếu dự án dùng versioning). `:attributeId` phải khớp `attribute_values.attribute_id` cho mọi thao tác trên một bản ghi cụ thể (tránh client gửi sai attribute).

### `GET /master-data/attributes/:attributeId/values`

- **Mục đích**: Danh sách giá trị của một attribute, phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize` (hoặc `limit`/`offset` theo chuẩn dự án).
  - `q`: tìm theo `code` hoặc `name` (partial, case-insensitive nếu DB hỗ trợ).
  - `active`: boolean.
  - `includeDeleted`: boolean (mặc định `false`).
  - `sort`: ví dụ `sort_order`, `code`, `name`, `created_at`.

**Response**: body chuẩn list (items + meta total) theo pattern chung WMS.

**404** nếu `:attributeId` không tồn tại hoặc đã xóa mềm (trừ policy `includeDeleted` trên attribute).

### `GET /master-data/attributes/:attributeId/values/:id`

- Chi tiết một giá trị.
- **404** nếu attribute không hợp lệ, hoặc value không thuộc `attributeId`, hoặc value đã xóa mềm (trừ `includeDeleted`).

### `POST /master-data/attributes/:attributeId/values`

- **Body**: `{ "code", "name", "sort_order?", "active?" }` — không cần gửi `attribute_id` trong body nếu luôn lấy từ path (tránh lệch dữ liệu).
- **201** + body entity tạo được.

### `PATCH /master-data/attributes/:attributeId/values/:id`

- **Body**: partial; cho phép đổi `code`, `name`, `sort_order`, `active` nếu không vi phạm unique `(attribute_id, code)` và quy tắc tham chiếu.
- Không cho đổi `attribute_id` qua PATCH (nếu cần “chuyển” value sang attribute khác — không MVP hoặc endpoint riêng có kiểm tra nặng).

### `DELETE /master-data/attributes/:attributeId/values/:id`

- **204** nếu xóa mềm thành công.
- **409** nếu variant/SKU vẫn tham chiếu giá trị này.
- Idempotent: `DELETE` lần hai trên bản ghi đã xóa mềm → **204** hoặc **404** (chọn một và nhất quán với module attributes).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công tạo | 201 |
| Thành công cập nhật | 200 |
| Thành công xóa | 204 |
| `attributeId` hoặc value không tồn tại / không khớp | 404 |
| Vi phạm unique `(attribute_id, code)` trong các bản ghi chưa xóa mềm | 409 |
| Còn variant map — không cho xóa value | 409 |
| Payload không hợp lệ (validation) | 422 |

Payload lỗi nên có `code` (machine-readable) + `message` (human-readable) thống nhất với module master-data khác.

## Ghi chú triển khai

- Có thể tách module `attribute-values` (service/repository) và mount route nested dưới `attributes` hoặc dùng controller forward — route công khai vẫn `/master-data/attributes/:attributeId/values`.
- Entity kế thừa base chung (`id`, `created_at`, `updated_at`) nếu codebase dùng `BaseEntity`; `@DeleteDateColumn({ name: 'deleted_at' })` cho xóa mềm.
- Trước khi xóa mềm value: kiểm tra bảng map variant ↔ attribute value (khi Product module đã có) trong transaction.

## Mở rộng sau MVP

- Unique `(org_id, attribute_id, code)` khi multi-tenant.
- Reorder batch `sort_order` cho toàn bộ values của một attribute.
- Metadata bổ sung (màu swatch, hình ảnh minh họa) nếu UI cần.
