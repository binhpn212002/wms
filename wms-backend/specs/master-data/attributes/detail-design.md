# Thuộc tính (attributes) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Giá trị thuộc tính — basic design](../attribute-values/basic-design.md)
- [Master data — tổng quan](../basic-design.md)

## Phạm vi MVP

- CRUD **phẳng** (không cây): mỗi bản ghi là một “loại” thuộc tính biến thể (`Size`, `Color`, …).
- Trường: `code`, `name`, `active`, `sort` (tùy chọn).
- Giá trị cụ thể (`S`, `M`, `Đỏ`, …) thuộc submodule **attribute-values** (`attribute_id` → bảng này).
- `code` unique trong phạm vi **toàn hệ thống** (một tenant/DB như hiện tại), giống các master-data khác.

## Mô hình dữ liệu

### Bảng `attributes`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã nghiệp vụ, duy nhất (VD: `SIZE`, `COLOR`) |
| `name` | string | Có | Tên hiển thị |
| `sort` | int, nullable | Không | Thứ tự hiển thị trong UI; `null` hoặc quy ước “cuối danh sách” tùy team |
| `active` | boolean | Có | Mặc định `true`; có thể ẩn khỏi chọn mới mà không xóa |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm: `null` = còn hiệu lực |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial** (chỉ bản ghi chưa xóa mềm): `(code)` **WHERE** `deleted_at IS NULL`.
- Sắp xếp danh sách: `(sort NULLS LAST, name)` hoặc `(sort, code)` tùy quy ước UI.

**Không MVP (có thể thêm sau)**

- `org_id` / `tenant_id` khi multi-tenant; khi đó unique `(org_id, code)` kết hợp điều kiện `deleted_at` như trên.

### Liên kết submodule & Product

- `attribute_values.attribute_id` → `attributes.id` (xem [attribute-values](../attribute-values/basic-design.md)).
- **Variant / SKU** (module Product, ngoài phạm vi chi tiết tại đây): tổ hợp biến thể tham chiếu các **giá trị** thuộc tính, không gắn trực tiếp vào bản ghi `attributes` trừ khi có bảng map sản phẩm–thuộc tính (tùy thiết kế Product).

## Quy tắc nghiệp vụ

1. **`code`**
   - Trim khoảng trắng đầu/cuối; chuẩn hóa độ dài tối đa và ký tự cho phép (VD: chữ, số, `_`, `-`) — cụ thể trong validator backend.
   - Unique trong phạm vi bản ghi **chưa xóa mềm** (`deleted_at IS NULL`).

2. **`sort`**
   - Khi tạo mới: có thể gán tự động (max + 1) hoặc để client gửi; tránh trùng thứ tự nếu UI cần kéo-thả ổn định (có thể reorder batch sau).

3. **`deleted_at`**
   - List/query mặc định: chỉ `deleted_at IS NULL` trừ khi API có `includeDeleted=true` (admin/audit).

4. **Xóa**
   - **Xóa mềm** (hành vi “xóa” chuẩn): set `deleted_at = now()` khi **không** còn `attribute_values` thuộc attribute này **hoặc** (theo policy) khi không còn giá trị nào đang được **variant/SKU** tham chiếu — nếu chỉ chặn ở tầng giá trị thì vẫn phải kiểm tra không còn value “đang dùng” trước khi cho phép “xóa” attribute (thường **chặn** xóa attribute nếu còn ít nhất một value còn hiệu lực hoặc đang map variant).
   - **Xóa cứng** (purge): chỉ khi không còn tham chiếu và có policy rõ (thường không MVP).

5. **`active`**
   - `active = false`: ẩn khỏi dropdown tạo mới / gán mới nếu API/UI có filter; có thể vẫn hiện trong báo cáo lịch sử tùy policy.

## API

Base path gợi ý: `/master-data/attributes` (prefix global `/api/v1` nếu dự án dùng versioning).

### `GET /master-data/attributes`

- **Mục đích**: Danh sách phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize` (hoặc `limit`/`offset` theo chuẩn dự án).
  - `q`: tìm theo `code` hoặc `name` (partial, case-insensitive nếu DB hỗ trợ).
  - `active`: boolean.
  - `includeDeleted`: boolean (mặc định `false`).
  - `sort`: ví dụ `sort`, `code`, `name`, `created_at`.

**Response**: body chuẩn list (items + meta total) theo pattern chung WMS.

### `GET /master-data/attributes/:id`

- **404** nếu không tồn tại hoặc đã xóa mềm (trừ khi `includeDeleted=true` và đủ quyền).

### `POST /master-data/attributes`

- **Body**: `{ "code", "name", "sort?", "active?" }`.
- **201** + body entity tạo được.

### `PATCH /master-data/attributes/:id`

- **Body**: partial; cho phép đổi `code`, `name`, `sort`, `active` nếu không vi phạm unique và quy tắc tham chiếu.
- **404** / **409** / **422** tùy trường hợp.

### `DELETE /master-data/attributes/:id`

- **204** nếu xóa mềm thành công.
- **409** nếu còn giá trị thuộc tính hoặc (theo rule Product) còn variant map — không cho xóa; gợi ý gỡ giá trị / đổi mapping trước.
- Idempotent: `DELETE` lần hai trên bản ghi đã xóa mềm → **204** hoặc **404** (chọn một và nhất quán).

**Lưu ý**: CRUD giá trị thuộc tính nằm tại `/master-data/attributes/:attributeId/values` (xem tài liệu attribute-values).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công tạo | 201 |
| Thành công cập nhật | 200 |
| Thành công xóa | 204 |
| Không tìm thấy | 404 |
| Vi phạm unique `code` (trong các bản ghi chưa xóa mềm) | 409 |
| Còn attribute-values / variant — không cho xóa | 409 |
| Payload không hợp lệ (validation) | 422 |

Payload lỗi nên có `code` (machine-readable) + `message` (human-readable) thống nhất với module master-data khác.

## Ghi chú triển khai

- Entity kế thừa base chung (`id`, `created_at`, `updated_at`) nếu codebase dùng `BaseEntity`; thêm `@DeleteDateColumn({ name: 'deleted_at' })` (TypeORM) cho xóa mềm.
- Trước khi xóa mềm attribute: đếm `attribute_values` (và kiểm tra tham chiếu variant nếu đã có bảng) trong service/transaction.

## Mở rộng sau MVP

- Unique `code` theo `org_id` / warehouse scope.
- Bảng map `product_attributes` (sản phẩm dùng những thuộc tính nào) nếu cần ràng buộc trước khi tạo variant.
