# Nhà cung cấp (suppliers) — Detail design

## Tài liệu tham chiếu

- [Kế hoạch triển khai](./plan.md)
- [Basic design](./basic-design.md)
- [Nhập kho — basic design](../inbound/basic-design.md)
- [Sản phẩm — detail design](../products/detail-design.md) (không FK supplier trên product; chỉ tham chiếu kiến trúc chứng từ)

## Phạm vi MVP

- **Supplier**: mã (`code`), tên (`name`), MST/tax id tùy chọn (`tax_id`), ghi chú tùy chọn (`notes`), trạng thái `active`, xóa mềm.
- **Contact**: tên, SĐT, email, chức danh — thuộc đúng một supplier (1-N); xóa mềm tùy policy (MVP: cho phép xóa mềm contact khi không cần giữ lịch sử, hoặc chỉ inactive — thống nhất một cách).
- **Inbound**: phiếu nhập tham chiếu `supplier_id` — chi tiết schema inbound nằm ở spec nhập kho khi triển khai; module suppliers chỉ đảm bảo **không** xóa cứng supplier đang được tham chiếu.

## Mô hình dữ liệu

### Bảng `suppliers`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã NCC nội bộ — **unique** trong các bản ghi **chưa xóa mềm** |
| `name` | string | Có | Tên hiển thị / tên giao dịch |
| `tax_id` | string, nullable | Không | MST / tax identification — unique tùy policy (xem quy tắc) |
| `notes` | text, nullable | Không | Ghi chú nội bộ |
| `active` | boolean | Có | Mặc định `true`; `false` = không chọn trên phiếu mới (vẫn hiển thị trên chứng từ cũ) |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial**: `(code)` **WHERE** `deleted_at IS NULL`.
- Tìm kiếm danh sách: `(name)`, `(code)` — MVP có thể `ILIKE` trên `name` / `code`.
- Nếu bắt buộc MST unique khi có giá trị: unique **partial** `(tax_id)` **WHERE** `deleted_at IS NULL AND tax_id IS NOT NULL`.

### Bảng `supplier_contacts`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `supplier_id` | UUID (FK → `suppliers.id`) | Có | NCC sở hữu |
| `name` | string | Có | Tên người liên hệ |
| `phone` | string, nullable | Không | SĐT |
| `email` | string, nullable | Không | Email — format validate ở tầng API |
| `title` | string, nullable | Không | Chức danh (vd. Kế toán, Giao nhận) |
| `is_primary` | boolean | Có | Mặc định `false`; tối đa **một** `true` mỗi `supplier_id` (ứng dụng + optional unique partial index) |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm contact |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- `(supplier_id)` cho danh sách contact theo NCC.
- Unique partial (nếu enforce “một primary” ở DB): `(supplier_id)` **WHERE** `is_primary = true AND deleted_at IS NULL` — chỉ một dòng mỗi supplier (partial unique trên cột boolean cần điều kiện đúng với engine; nếu không khả thi, enforce tại service trong transaction).

**FK**

- `supplier_id` → `suppliers.id` — supplier phải tồn tại, `deleted_at IS NULL` khi thêm/sửa contact (trừ policy migrate).

### Liên kết module nhập kho

- Bảng phiếu nhập (inbound) có `supplier_id` → `suppliers.id` — khi đã có bản ghi inbound **completed** (hoặc bất kỳ trạng thái không cho phép đổi NCC), giữ **toàn vẹn** hiển thị; không xóa cứng supplier.
- **409** khi xóa mềm / inactive supplier nếu policy cấm (vd. còn inbound `draft` đang trỏ — tùy quy tắc); tối thiểu: không xóa cứng nếu còn FK inbound.

## Quy tắc nghiệp vụ

1. **`suppliers.code`**
   - Trim; độ dài / ký tự theo validator chung WMS.
   - Unique trong các bản ghi `deleted_at IS NULL`.

2. **`suppliers.tax_id`**
   - Trim; nullable; nếu team quyết định unique thì validate trùng khi `deleted_at IS NULL` và cùng `tax_id` không null.

3. **`suppliers.active`**
   - `false`: UI không gợi ý cho phiếu nhập **mới**; báo cáo / phiếu cũ vẫn hiển thị tên NCC.

4. **`suppliers.deleted_at`**
   - Query mặc định: `deleted_at IS NULL`; API admin có thể `includeDeleted=true`.
   - **Không** xóa mềm nếu còn inbound tham chiếu (hoặc chỉ cho phép sau khi migrate `supplier_id` — không khuyến nghị MVP): **409** nếu còn ít nhất một inbound (hoặc chỉ khi `completed` — team chọn một dòng và giữ nhất quán).

5. **Contact**
   - Tạo/sửa: `supplier_id` phải trỏ supplier còn hiệu lực.
   - Đặt `is_primary = true`: bỏ primary cũ cùng supplier trong cùng transaction (hoặc dùng PATCH chỉ định rõ).
   - Xóa mềm contact: **204**; không bắt buộc kiểm tra inbound (contact không FK từ phiếu trong MVP trừ khi sau này lưu `contact_id` trên inbound).

## API

Base path gợi ý: `/suppliers` (prefix global `/api/v1` nếu dự án dùng versioning).

### `GET /suppliers`

- **Mục đích**: Danh sách phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize` (hoặc `limit`/`offset`).
  - `q`: tìm theo `code`, `name` (partial, case-insensitive nếu DB hỗ trợ).
  - `active`: lọc.
  - `includeDeleted`: boolean (mặc định `false`).
  - `sort`: ví dụ `name`, `code`, `created_at`.

**Response**: items + meta total. Item có thể kèm `contactCount` hoặc không embed contacts — dùng `GET /suppliers/:id` hoặc `includeContacts=true` nếu cần.

### `GET /suppliers/:id`

- Chi tiết một supplier.
- **404** nếu không tồn tại hoặc đã xóa mềm (trừ `includeDeleted` + quyền).
- Gợi ý embed: danh sách contacts (chưa xóa mềm), sắp xếp primary trước.

### `POST /suppliers`

- **Body (gợi ý)**: `{ "code", "name", "taxId?", "notes?", "active?" }`.
- Có thể tạo kèm `contacts[]` trong cùng request (optional).
- **201** + body entity.

### `PATCH /suppliers/:id`

- **Body**: partial `code`, `name`, `taxId`, `notes`, `active`.
- **404** / **409** / **422** tùy trường hợp.

### `DELETE /suppliers/:id`

- Xóa mềm (soft delete).
- **409** nếu còn inbound tham chiếu (theo policy đã chọn).
- **204** khi thành công.

### `POST /suppliers/:id/contacts`

- **Body (gợi ý)**: `{ "name", "phone?", "email?", "title?", "isPrimary?" }`.
- **201** + contact.
- **404** nếu `supplier_id` không tồn tại / đã xóa mềm.

### `PATCH /suppliers/:id/contacts/:contactId`

- **Body**: partial các trường trên.
- **404** nếu contact không thuộc supplier hoặc đã xóa mềm.

### `DELETE /suppliers/:id/contacts/:contactId`

- Xóa mềm contact (hoặc **204** hard delete nếu policy không dùng soft delete cho contact — document rõ).

### Endpoint thay thế (tùy routing)

- `PATCH /contacts/:contactId` — cùng semantics với PATCH lồng; chỉ dùng một kiểu trong toàn API để tránh trùng.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công tạo | 201 |
| Thành công cập nhật | 200 |
| Thành công xóa | 204 |
| Không tìm thấy supplier/contact | 404 |
| Trùng `code` (unique) hoặc trùng `tax_id` nếu policy unique | 409 |
| Còn inbound — không xóa supplier | 409 |
| Payload không hợp lệ (validation) | 422 |

Payload lỗi: `code` (machine-readable) + `message` (human-readable) đồng bộ các module WMS.

## Ghi chú triển khai

- Entity base (`id`, `created_at`, `updated_at`) và `@DeleteDateColumn` cho `suppliers` / `supplier_contacts` nếu dùng TypeORM.
- Đặt/gỡ `is_primary` trong transaction khi cập nhật contact.
- Module inbound khi tạo FK `supplier_id` nên `ON DELETE RESTRICT` (hoặc không FK cứng nếu microservice — thì validate bằng API).

## Mở rộng sau MVP

- `org_id` / `tenant_id`; unique `code` theo tổ chức.
- Địa chỉ NCC (quốc gia, tỉnh, đường) — bảng `supplier_addresses` hoặc JSON.
- Đánh giá NCC, điều khoản thanh toán, ngày hợp đồng.
- Liên kết `contact_id` trên phiếu nhập khi cần lưu “người giao hàng” cụ thể.
