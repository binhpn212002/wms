# Nhập kho (inbound) — Detail design

## Tài liệu tham chiếu

- [Kế hoạch triển khai](./plan.md)
- [Basic design](./basic-design.md)
- [Tồn kho — detail design](../inventory/detail-design.md) (`stock_balances`, `inventory_movements`, khóa, transaction)
- [Kho & vị trí — detail design](../warehouses/detail-design.md) (`warehouse_id`, `location_id`, `type = bin`, `default_location_id`)
- [Nhà cung cấp — detail design](../suppliers/detail-design.md) (`supplier_id`, `active`, xóa mềm)
- [Sản phẩm — detail design](../products/detail-design.md) (`variant_id`, UoM mặc định, xóa mềm variant)

## Phạm vi MVP

- **Phiếu nhập** (header): số chứng từ, ngày chứng từ, NCC, kho, trạng thái workflow, audit.
- **Dòng phiếu**: biến thể, số lượng > 0 (theo UoM mặc định của sản phẩm chứa variant), `unit_price` tùy chọn, vị trí đích (`bin` trong đúng kho).
- **Hoàn tất (`completed`)**: trong **một transaction** — upsert `stock_balances`, insert `inventory_movements` ([inventory detail](../inventory/detail-design.md)); không ghi tồn “trần” ngoài luồng này.
- **Immutable sau complete**: không sửa/xóa số lượng đã ghi; MVP **cấm** chỉnh sửa dòng/header sau `completed` (điều chỉnh sau MVP).

## Mô hình dữ liệu

### Bảng `inbound_documents` (header)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa phiếu |
| `document_no` | string | Có | Số phiếu — **unique** trong phạm vi policy (vd. toàn hệ thống hoặc theo `warehouse_id` + năm — **thống nhất một quy ước**) khi không xóa mềm |
| `document_date` | date | Có | Ngày trên chứng từ (có thể khác `created_at`) |
| `supplier_id` | UUID (FK → `suppliers.id`) | Có | NCC — tồn tại, `deleted_at IS NULL`; phiếu mới nên `active = true` ([suppliers detail](../suppliers/detail-design.md)) |
| `warehouse_id` | UUID (FK → `warehouses.id`) | Có | Kho nhập — tồn tại, chưa xóa mềm; có thể thêm rule `warehouses.active = true` cho phiếu mới (đồng bộ warehouses) |
| `status` | string / enum | Có | `draft` \| `confirmed` \| `completed` — hoặc rút gọn MVP: chỉ `draft` \| `completed` ([basic](./basic-design.md)) |
| `notes` | text, nullable | Không | Ghi chú header |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm **chỉ khi policy cho phép** (thường chỉ `draft`); phiếu `completed` không xóa mềm trong MVP |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |
| `created_by` | UUID, nullable | Không | FK user — nếu có bảng user |
| `updated_by` | UUID, nullable | Không | FK user |

**Index gợi ý**

- Unique (full hoặc partial theo quy ước `document_no`): tránh trùng số phiếu.
- `(warehouse_id, document_date)`, `(supplier_id)`, `(status)` — danh sách / lọc.
- `(created_at)` — sắp xếp theo thời gian tạo.

**FK & quy tắc**

- `supplier_id` → `suppliers.id` — RESTRICT; không tham chiếu supplier đã xóa mềm khi tạo/sửa.
- `warehouse_id` → `warehouses.id` — RESTRICT.

### Bảng `inbound_lines` (dòng)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa dòng |
| `inbound_document_id` | UUID (FK → `inbound_documents.id`) | Có | Phiếu cha |
| `line_no` | integer | Có | Thứ tự hiển thị / in (1, 2, 3…) — unique per `inbound_document_id` |
| `variant_id` | UUID (FK → `product_variants.id`) | Có | SKU — chưa xóa mềm, hợp lệ ([products detail](../products/detail-design.md)) |
| `quantity` | decimal numeric | Có | `> 0`; scale theo chính sách (vd. 4); đơn vị = **`products.default_uom_id`** của product chứa variant |
| `unit_price` | decimal numeric, nullable | Không | Đơn giá tham chiếu / kế toán — không ảnh hưởng tồn trong MVP |
| `location_id` | UUID (FK → `locations.id`) | Có | Ô đích — thuộc **đúng** `inbound_documents.warehouse_id`, `locations.type = 'bin'`, chưa xóa mềm ([warehouses detail](../warehouses/detail-design.md)) |

**Index gợi ý**

- `(inbound_document_id)` — tất cả dòng của phiếu.
- Unique `(inbound_document_id, line_no)`.

**FK**

- `inbound_document_id` → `inbound_documents.id` — on delete **CASCADE** (khi xóa draft) hoặc **RESTRICT** nếu chỉ cho phép xóa phiếu khi không còn dòng — team chọn; MVP thường **RESTRICT** + xóa dòng qua API thay vì CASCADE cứng.
- `variant_id` → `product_variants.id` — RESTRICT.
- `location_id` → `locations.id` — RESTRICT.

**Quy tắc**

- Không cho hai dòng trùng hoàn toàn không cần thiết — tùy UX (gộp dòng hoặc cảnh báo); MVP có thể cho phép cùng `variant_id` + `location_id` nhiều dòng (cộng dồn khi complete hoặc ghi nhiều movement — nên **cộng trong service** hoặc ghi **một movement** với tổng quantity: thống nhất một cách; khuyến nghị **mỗi dòng một dòng ledger** với `reference_line_id` để truy vết).

## Luồng hoàn tất & tồn kho

### Transaction khi `POST .../complete`

1. **Khóa phiếu**: `SELECT ... FOR UPDATE` trên `inbound_documents` WHERE `id = :id` — từ chối nếu không phải `draft` hoặc `confirmed` (tùy workflow), hoặc đã `completed` (**idempotent**: trả **200** + body giữ nguyên hoặc **409** “already completed” — **thống nhất một**).
2. **Đọc dòng**: tất cả `inbound_lines` của phiếu; reject nếu không có dòng nào (**422**).
3. **Resolve `location_id`**: với mỗi dòng, nếu client đã gửi `locationId` — validate; nếu API hỗ trợ “thiếu ô” trên dòng — gán `warehouses.default_location_id`; nếu vẫn null — **422** (thiếu vị trí).
4. **Validate tham chiếu**: supplier, warehouse, location, variant theo các rule ở [basic](./basic-design.md) và detail suppliers / warehouses / products.
5. **Sắp xếp khóa balance**: danh sách khóa `(warehouse_id, location_id, variant_id)` **unique**, sort **cố định** (vd. theo `warehouse_id`, `location_id`, `variant_id`) để tránh deadlock.
6. Với mỗi khóa (hoặc từng dòng nếu mỗi dòng một movement):
   - `SELECT ... FOR UPDATE` trên `stock_balances` tương ứng, hoặc khóa “placeholder” bằng upsert/insert zero row nếu schema cho phép ([inventory detail](../inventory/detail-design.md)).
   - **Upsert** `stock_balances`: cộng `quantity` (không âm sau cộng — CHECK `quantity >= 0`).
   - **Insert** `inventory_movements`: `quantity_delta` = +`quantity` dòng, `movement_type` = `INBOUND_RECEIPT`, `reference_type` = `inbound`, `reference_id` = `inbound_documents.id`, `reference_line_id` = `inbound_lines.id`.
7. **Cập nhật** `inbound_documents.status` = `completed`, `updated_at`.
8. **Commit**.

### Idempotent complete

- Nếu `status` đã `completed`: không ghi lại movement/balance; response thành công (GET-by-id trả cùng trạng thái) hoặc mã lỗi rõ ràng — chọn một cho toàn API chứng từ.

### Immutable

- Sau `completed`: **không** `UPDATE`/`DELETE` `inbound_lines` và **không** sửa `supplier_id`, `warehouse_id`, số lượng — **409** hoặc **422** tùy policy.

## Quy tắc nghiệp vụ (tóm tắt)

| Chủ đề | Quy tắc |
|--------|---------|
| Vị trí | `location_id` thuộc `warehouse_id` của phiếu; `type = bin`; nhập nhanh = `default_location_id` khi được phép bỏ trống trên dòng |
| NCC | Tồn tại, chưa xóa mềm; phiếu mới: `active = true` |
| Variant | Chưa xóa mềm; conflict policy: **409** |
| UoM | Chỉ `products.default_uom_id`; không đổi UoM trên dòng inbound MVP |
| Tồn | Chỉ qua bước complete; ledger + balance cùng transaction |

## API

Base path gợi ý: `/inbound` (prefix `/api/v1` nếu có versioning). JSON **camelCase**; lỗi `code` + `message` đồng bộ [products detail](../products/detail-design.md).

### `POST /inbound`

- **Mục đích**: Tạo phiếu `draft`.
- **Body (gợi ý)**: `supplierId`, `warehouseId`, `documentNo?` (nếu hệ thống không auto-gen), `documentDate?` (mặc định today), `notes?`.
- **Response**: `201` + object phiếu (kèm `id`, `status`, …).

### `GET /inbound`

- **Mục đích**: Danh sách có phân trang / lọc.
- **Query (gợi ý)**: `page`, `pageSize`, `warehouseId`, `supplierId`, `status`, `from`, `to` (theo `documentDate` hoặc `createdAt`), `q` (số phiếu).

### `GET /inbound/:id`

- **Mục đích**: Chi tiết phiếu + embed lines (hoặc lines qua sub-resource tùy payload size).
- **404**: không tồn tại hoặc không thuộc phạm vi quyền (thống nhất với dự án).

### `PATCH /inbound/:id`

- **Mục đích**: Sửa header khi `draft` (và `confirmed` nếu policy cho phép).
- **409/422**: đã `completed` hoặc trạng thái không cho sửa.

### `PUT /inbound/:id/lines` hoặc `PATCH` từng phần

- **Mục đích**: Thay thế toàn bộ dòng hoặc CRUD dòng khi `draft`.
- **Body line (gợi ý)**: `lineNo`, `variantId`, `quantity`, `unitPrice?`, `locationId?` (optional nếu server resolve default).
- **422**: tổng hợp lỗi validation (thiếu ô, sai kho–location, quantity ≤ 0).

### `POST /inbound/:id/submit` / `POST /inbound/:id/confirm`

- **Mục đích**: Chuyển workflow nếu có bước `confirmed` — có thể **bỏ** trong MVP một bước.

### `POST /inbound/:id/complete`

- **Mục đích**: Validate + cộng tồn + ledger + set `completed`.
- **200**: thành công; **409**: trùng số phiếu / trạng thái / idempotent conflict; **422**: validation.

### `DELETE /inbound/:id` (tùy chọn)

- **Mục đích**: Xóa mềm chỉ khi `draft` — **404/409** nếu không được phép.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Tạo / đọc / cập nhật thành công | 201 / 200 |
| Validation body/query (thiếu ô khi không có default, sai warehouse–location, quantity không hợp lệ) | 422 |
| Trùng `document_no`, trạng thái không cho phép thao tác, variant/supplier conflict | 409 |
| Supplier / warehouse / location / variant không tồn tại hoặc vi phạm xóa mềm / active | 404 hoặc 409 (thống nhất dự án) |
| Không đủ quyền | 403 |

Payload lỗi: `code` + `message`; mã `code` nên map vào [error-code constant](../../src/common/constants/error-code.constant.ts) khi triển khai.

## Ghi chú triển khai

- **Service layer**: `InboundService` gọi module/repository **inventory** (shared) cho bước apply balance + movement — không nhân đôi SQL ledger ở controller.
- **TypeORM**: quan hệ `InboundDocument` 1-N `InboundLine`; transaction qua `EntityManager` / `QueryRunner`.
- **Số phiếu**: sequence per warehouse hoặc global — document trong basic; implement một generator có transaction để tránh trùng khi concurrent `POST`.

## Mở rộng sau MVP

- Phiếu điều chỉnh / phiếu ngược; import CSV; batch/serial; đa UoM; liên kết `contact_id` NCC trên header.
- Workflow duyệt đa cấp; in phiếu PDF.
