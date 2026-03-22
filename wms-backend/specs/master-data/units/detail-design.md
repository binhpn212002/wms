# Đơn vị tính (units) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Master data — tổng quan](../basic-design.md)
- [Sản phẩm — basic design](../../products/basic-design.md)

## Phạm vi MVP

- CRUD **phẳng** (không cây): mỗi bản ghi là một **UoM** (cái, thùng, kg, pallet, …).
- Trường: `code`, `name`, `symbol` (tùy chọn), `active`.
- `code` unique trong phạm vi **toàn hệ thống** (một tenant/DB như hiện tại), chỉ trong các bản ghi **chưa xóa mềm**.
- **Quy đổi** giữa các đơn vị — **ngoài MVP** (bảng `uom_conversions` hoặc tương đương sau này).

## Mô hình dữ liệu

### Bảng `units`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã nghiệp vụ (VD: `PCS`, `BOX`, `KG`, `PALLET`) — unique trong các bản ghi chưa xóa mềm |
| `name` | string | Có | Tên hiển thị đầy đủ |
| `symbol` | string, nullable | Không | Ký hiệu ngắn hiển thị (VD: `kg`, `cái`); có thể trùng giữa các bản ghi khác nhau |
| `active` | boolean | Có | Mặc định `true`; `false` ẩn khỏi gán mới (dropdown) |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm: `null` = còn hiệu lực |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial** (chỉ bản ghi chưa xóa mềm): `(code)` **WHERE** `deleted_at IS NULL` (Postgres) / tương đương DB.
- Sắp xếp danh sách mặc định (API): ví dụ `name`, `code`, hoặc `created_at` — tùy quy ước UI.
- Lọc nhanh: `(active)`, `(deleted_at)` hoặc partial `WHERE deleted_at IS NULL` cho query mặc định.

**Không MVP (có thể thêm sau)**

- `org_id` / `tenant_id` khi multi-tenant; khi đó unique `(org_id, code)` kết hợp điều kiện `deleted_at` như trên.
- Nhóm/kích thước vật lý (dimensionless / mass / …) để validate quy đổi.

### Liên kết Products & kho

- `products.default_uom_id` → `units.id` (UoM mặc định khi bán/tồn theo một đơn vị).
- Dòng chứng từ kho / định mức (inbound/outbound/transfer/BOM, …) có thể lưu `uom_id` + số lượng — chi tiết module kho ngoài phạm vi file này; khi đã có FK từ các bảng đó tới `units`, **không** cho phép xóa mềm unit đang được tham chiếu (xem mục Quy tắc).

## Quy tắc nghiệp vụ

1. **`code`**
   - Trim khoảng trắng đầu/cuối; chuẩn hóa **chữ hoa/thường** theo quy ước dự án (basic design gợi ý **uppercase** cho mã nghiệp vụ).
   - Chuẩn hóa độ dài tối đa và ký tự cho phép (VD: chữ, số, `_`, `-`) — cụ thể trong validator backend.
   - Unique trong phạm vi bản ghi **chưa xóa mềm** (`deleted_at IS NULL`).

2. **`symbol`**
   - Tùy chọn; nếu có thì trim; có thể cho phép trùng giữa nhiều unit (không unique) trừ khi team quyết policy khác.

3. **`deleted_at`**
   - List/query mặc định: chỉ `deleted_at IS NULL` trừ khi API có `includeDeleted=true` (admin/audit).

4. **`active`**
   - `active = false`: ẩn khỏi dropdown gán mới; bản ghi đã tham chiếu (sản phẩm, chứng từ) vẫn hiển thị trong lịch sử tùy policy UI.

5. **Xóa**
   - **Xóa mềm** (hành vi “xóa” chuẩn): set `deleted_at = now()` khi **không** còn tham chiếu bắt buộc:
     - Còn ít nhất một `product` có `default_uom_id` trỏ tới unit này → **chặn** (409).
     - Còn dòng chứng từ/định mức/tồn (khi các bảng đó đã có FK `uom_id`) → **chặn** (409) — thống nhất [master data — tổng quan](../basic-design.md).
   - **Xóa cứng** (purge): chỉ khi không còn tham chiếu và có policy rõ (thường không MVP).

## API

Base path gợi ý: `/master-data/units` (prefix global `/api/v1` nếu dự án dùng versioning).

### `GET /master-data/units`

- **Mục đích**: Danh sách phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize` (hoặc `limit`/`offset` theo chuẩn dự án).
  - `q`: tìm theo `code`, `name` hoặc `symbol` (partial, case-insensitive nếu DB hỗ trợ).
  - `active`: boolean.
  - `includeDeleted`: boolean (mặc định `false`).
  - `sort`: ví dụ `code`, `name`, `created_at`.

**Response**: body chuẩn list (items + meta total) theo pattern chung WMS.

### `GET /master-data/units/:id`

- **404** nếu không tồn tại hoặc đã xóa mềm (trừ khi `includeDeleted=true` và đủ quyền).

### `POST /master-data/units`

- **Body**: `{ "code", "name", "symbol?", "active?" }`.
- **201** + body entity tạo được.

### `PATCH /master-data/units/:id`

- **Body**: partial; cho phép đổi `code`, `name`, `symbol`, `active` nếu không vi phạm unique và quy tắc tham chiếu.
- **404** / **409** / **422** tùy trường hợp.

### `DELETE /master-data/units/:id`

- **204** nếu xóa mềm thành công.
- **409** nếu còn `products.default_uom_id` hoặc (khi đã triển khai) dòng chứng từ/định mức tham chiếu unit — gợi ý đổi UoM mặc định sản phẩm hoặc xử lý chứng từ trước.
- Idempotent: `DELETE` lần hai trên bản ghi đã xóa mềm → **204** hoặc **404** (chọn một và nhất quán).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công tạo | 201 |
| Thành công cập nhật | 200 |
| Thành công xóa | 204 |
| Không tìm thấy | 404 |
| Vi phạm unique `code` (trong các bản ghi chưa xóa mềm) | 409 |
| Còn product / chứng từ — không cho xóa | 409 |
| Payload không hợp lệ (validation) | 422 |

Payload lỗi nên có `code` (machine-readable) + `message` (human-readable) thống nhất với module master-data khác.

## Ghi chú triển khai

- Entity kế thừa base chung (`id`, `created_at`, `updated_at`) nếu codebase dùng `BaseEntity`; thêm `@DeleteDateColumn({ name: 'deleted_at' })` (TypeORM) cho xóa mềm.
- Trước khi xóa mềm: kiểm tra `products` theo `default_uom_id` và (khi có) các bảng kho/chứng từ trong transaction.

## Mở rộng sau MVP

- Bảng `uom_conversions` (hoặc tương đương): quy đổi giữa hai đơn vị (toàn cục hoặc theo `product_id`).
- Phân loại đơn vị theo dimension để validate quy đổi và cảnh báo sai hệ đo.
