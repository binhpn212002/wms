# Loại sản phẩm (categories) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Master data — tổng quan](../basic-design.md)

## Phạm vi MVP

- CRUD danh mục với cấu trúc cây tùy chọn (`parent_id` nullable).
- Một cấp phẳng vẫn hợp lệ (tất cả bản ghi có `parent_id = null`).
- Chưa bắt buộc phân quyền theo tổ chức/ngành hàng; `code` unique trong phạm vi **toàn hệ thống** (một tenant/DB như hiện tại).

## Mô hình dữ liệu

### Bảng `categories`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã danh mục, duy nhất toàn hệ thống (MVP) |
| `name` | string | Có | Tên hiển thị |
| `parent_id` | UUID (FK → `categories.id`), nullable | Không | Cha trực tiếp trong cây; `null` = gốc |
| `active` | boolean | Có | Mặc định `true`; có thể ẩn khỏi chọn mới mà không xóa |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm: `null` = còn hiệu lực; có giá trị = đã xóa tại thời điểm đó |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial** (chỉ bản ghi chưa xóa mềm): `(code)` **WHERE** `deleted_at IS NULL` (Postgres) / tương đương DB — tránh trùng `code` giữa các bản ghi đang “sống”, đồng thời cho phép tái sử dụng `code` sau khi bản ghi cũ đã soft-delete (nếu policy cho phép).
- Tra cứu theo cha: `(parent_id)` (partial nếu cần tối ưu danh sách con).
- Lọc xóa mềm: `(deleted_at)` hoặc partial index `WHERE deleted_at IS NULL` cho query mặc định.

**Không MVP (có thể thêm sau)**

- `org_id` / `tenant_id` khi multi-tenant; khi đó unique `(org_id, code)` (kết hợp điều kiện `deleted_at` như trên).

### Liên kết Products (ngoài module này)

- `products.category_id` → `categories.id` (khi module Product có mặt).
- Ràng buộc: không **xóa cứng** (purge) category đang được sản phẩm tham chiếu; xóa mềm (`deleted_at`) vẫn phải tuân rule “còn product thì không được coi là đã xóa” — thường **chặn** gán `deleted_at` khi còn product (xem mục Quy tắc).

## Quy tắc nghiệp vụ

1. **`code`**
   - Trim khoảng trắng đầu/cuối; nên chuẩn hóa độ dài tối đa và ký tự cho phép (VD: chữ, số, `_`, `-`) — cụ thể do team backend quyết trong validator.
   - Unique trong phạm vi bản ghi **chưa xóa mềm** (`deleted_at IS NULL`): một `code` chỉ một bản ghi “đang sống”.

2. **`deleted_at`**
   - Mọi query/list mặc định chỉ trả bản ghi `deleted_at IS NULL` trừ khi API có cờ `includeDeleted=true` (admin/audit).
   - `parent_id` khi resolve cha phải trỏ tới category **chưa xóa mềm** (trừ khi migration dữ liệu có quy tắc riêng).

3. **Cây (`parent_id`)**
   - `parent_id` nếu có phải trỏ tới bản ghi **đã tồn tại**.
   - **Không** cho phép tạo chu trình (A → B → A). Validate khi POST/PATCH (duyệt tổ tiên hoặc kiểm tra không đặt parent là chính descendant).
   - Xóa / vô hiệu hóa cha: MVP nên quy định rõ một trong các hướng (chọn trước khi code):
     - **Chặn** xóa khi còn con; hoặc
     - **Cascade** đổi `parent_id` con sang `null` hoặc sang ông (cần thêm rule).

4. **Xóa và tham chiếu Product**
   - **Xóa mềm** (`DELETE` hoặc hành vi “xóa” chuẩn): set `deleted_at = now()` khi **không** còn product tham chiếu và (theo rule cây) không vi phạm quy tắc con.
   - Nếu còn ít nhất một `product` gắn `category_id` trỏ tới bản ghi này: **không** set `deleted_at` — trả lỗi (409/422) theo basic design; gợi ý gỡ gán hoặc đổi category trước.
   - **Xóa cứng** (purge khỏi DB) chỉ dùng khi không còn tham chiếu và có policy rõ (thường không MVP / chỉ admin).

5. **`active`**
   - `active = false`: ẩn khỏi dropdown “tạo mới” nếu UI/API có filter; có thể vẫn hiện trong báo cáo lịch sử tùy policy.

## API

Base path gợi ý: `/master-data/categories` (prefix global `/api/v1` nếu dự án dùng versioning).

### `GET /master-data/categories`

- **Mục đích**: Danh sách phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize` (hoặc `limit`/`offset` theo chuẩn dự án).
  - `q`: tìm theo `code` hoặc `name` (partial, case-insensitive nếu DB hỗ trợ).
  - `parent_id`: lọc con của một node; giá trị đặc biệt `null` hoặc omit = tất cả.
  - `active`: boolean.
  - `includeDeleted`: boolean (mặc định `false`) — nếu `true`, trả cả bản ghi đã xóa mềm (phân quyền tùy policy).
  - `sort`: ví dụ `code`, `name`, `created_at`.

**Response**: body chuẩn list (items + meta total) theo pattern chung WMS.

### `GET /master-data/categories/tree` (tùy chọn MVP)

- **Mục đích**: Một lần lấy cây cho UI (tránh N+1).
- **Query**: `active` (optional), `includeDeleted` (optional; mặc định chỉ node chưa xóa mềm).
- **Response**: mảng node gốc, mỗi node có `children[]` lồng nhau (hoặc flat list + `path`/`level` — chọn một và nhất quán với frontend).

### `GET /master-data/categories/:id`

- **404** nếu không tồn tại hoặc đã xóa mềm (trừ khi có query `includeDeleted=true` và đủ quyền).

### `POST /master-data/categories`

- **Body**: `{ "code", "name", "parent_id?", "active?" }`.
- **201** + body entity tạo được.

### `PATCH /master-data/categories/:id`

- **Body**: partial; cho phép đổi `parent_id` nếu không vi phạm quy tắc cây.
- **404** / **409** / **422** tùy trường hợp.

### `DELETE /master-data/categories/:id`

- **204** nếu xóa mềm thành công (`deleted_at` được set).
- **409** nếu còn product tham chiếu hoặc (theo rule đã chọn) còn category con chưa xóa.
- Idempotent tùy chọn: `DELETE` lần hai trên bản ghi đã xóa mềm → **204** hoặc **404** (chọn một và giữ nhất quán).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công tạo | 201 |
| Thành công cập nhật | 200 |
| Thành công xóa | 204 |
| Không tìm thấy | 404 |
| Vi phạm unique `code` (trong các bản ghi chưa xóa mềm) | 409 |
| Vi phạm cây (cycle, parent không tồn tại) | 422 |
| Còn product / con — không cho xóa | 409 |

Payload lỗi nên có `code` (machine-readable) + `message` (human-readable) thống nhất với module master-data khác.

## Ghi chú triển khai

- Entity kế thừa base chung (`id`, `created_at`, `updated_at`) nếu codebase dùng `BaseEntity`; thêm `@DeleteDateColumn({ name: 'deleted_at' })` (TypeORM) hoặc tương đương cho xóa mềm.
- Self-relation TypeORM: `@ManyToOne(() => Category) @JoinColumn({ name: 'parent_id' })` + `@OneToMany(() => Category, (c) => c.parent)` tùy nhu cầu.
- Transaction khi cần (đổi parent + kiểm tra cycle trong một transaction).

## Mở rộng sau MVP

- Unique `code` theo `org_id` / warehouse scope.
- Độ sâu tối đa cây, hoặc materialized path (`path` ltree / string) cho truy vấn nhanh.
- Phân quyền theo ngành hàng / role.
