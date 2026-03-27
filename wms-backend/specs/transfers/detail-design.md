# Chuyển kho (transfers) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Tồn kho — detail design](../inventory/detail-design.md) (`stock_balances`, `inventory_movements`, khóa, transaction, `TRANSFER_OUT` / `TRANSFER_IN`)
- [Xuất kho — basic design](../outbound/basic-design.md) (đối chiếu luồng validate/complete + immutable sau complete)
- [Kho & vị trí — detail design](../warehouses/detail-design.md) (`warehouse_id`, `location_id`, chỉ `type = bin` cho tồn/chứng từ)
- [Sản phẩm — detail design](../products/detail-design.md) (`variant_id` → `product_variants.id`, UoM mặc định, xóa mềm variant)

## Phạm vi MVP

- **Transfer (header)**: số phiếu (`document_no` hoặc tương đương), ngày chứng từ, trạng thái, ghi chú (optional), audit người tạo / cập nhật, xóa mềm (tùy policy dự án).
- **Transfer line**: `variant_id`, `quantity`, nguồn `(warehouse_id_from, location_id_from)`, đích `(warehouse_id_to, location_id_to)`.
- Workflow: `draft` → `completed`.

## Mô hình dữ liệu

### Bảng `transfers`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|------|
| `id` | UUID (PK) | Có | Khóa chính |
| `document_no` | string | Có | Số phiếu — unique theo policy (khuyến nghị unique trong các bản ghi chưa xóa mềm) |
| `document_date` | date / timestamptz | Có | Ngày chứng từ |
| `status` | string / enum | Có | `draft` \| `completed` |
| `note` | text, nullable | Không | Ghi chú |
| `completed_at` | timestamptz, nullable | Không | Thời điểm hoàn tất |
| `created_by` | UUID, nullable | Không | User tạo (nếu hệ thống có user) |
| `updated_by` | UUID, nullable | Không | User cập nhật |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm (nếu dự án dùng soft-delete cho chứng từ) |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial**: `(document_no)` **WHERE** `deleted_at IS NULL` (nếu có soft-delete).
- `(status, document_date)` cho lọc danh sách.
- `(created_at)` cho sort mặc định.

**Ghi chú**

- `document_no` có thể sinh theo sequence/prefix (ngoài phạm vi doc này). Nếu cho phép nhập tay: validate trim + độ dài theo chuẩn chung WMS; trùng trả **409**.

### Bảng `transfer_lines`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|------|
| `id` | UUID (PK) | Có | Khóa chính |
| `transfer_id` | UUID (FK → `transfers.id`) | Có | Header |
| `variant_id` | UUID (FK → `product_variants.id`) | Có | Biến thể hàng hóa |
| `quantity` | numeric/decimal | Có | \(> 0\), theo `products.default_uom_id` của product chứa variant |
| `warehouse_id_from` | UUID (FK → `warehouses.id`) | Có | Kho nguồn |
| `location_id_from` | UUID (FK → `locations.id`) | Có | Ô nguồn (`type = bin`) |
| `warehouse_id_to` | UUID (FK → `warehouses.id`) | Có | Kho đích |
| `location_id_to` | UUID (FK → `locations.id`) | Có | Ô đích (`type = bin`) |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- `(transfer_id)` để join lines.
- `(variant_id)` nếu cần tra cứu lịch sử theo SKU.
- `(warehouse_id_from, location_id_from, variant_id)` và `(warehouse_id_to, location_id_to, variant_id)` nếu dự án hay query theo nguồn/đích (không bắt buộc MVP).

**FK & quy tắc**

- `location_id_from` phải thuộc `warehouse_id_from` và `locations.type = 'bin'`, `deleted_at IS NULL`.
- `location_id_to` phải thuộc `warehouse_id_to` và `locations.type = 'bin'`, `deleted_at IS NULL`.
- Cho phép cùng kho (chuyển vị trí) hoặc khác kho (chuyển kho).
- **Chặn** dòng có nguồn và đích trùng hoàn toàn: `(warehouse_id_from = warehouse_id_to AND location_id_from = location_id_to)` → **422**.
- Variant phải tồn tại và chưa xóa mềm; nếu variant đã bị xóa mềm hoặc vi phạm policy tham chiếu, trả **409** (tham chiếu [products detail](../products/detail-design.md)).

## Quy tắc nghiệp vụ

### 1) Sửa/xóa chứng từ

- Chỉ cho phép sửa header/lines khi `status = draft`.
- Sau `completed`: **immutable** (cấm sửa/xóa/ghi đè lines). Sửa sai = phiếu điều chỉnh/phiếu ngược (ngoài MVP).

### 2) Validate tồn (dry-run)

- Với mỗi line: tính `available` tại nguồn theo `(warehouse_id_from, location_id_from, variant_id)`.
- MVP: `available = stock_balances.quantity` (chưa có reserve).
- Thiếu tồn: trả **409** (hoặc **422** nếu chuẩn dự án) với `code = INSUFFICIENT_STOCK` và chi tiết theo line.

### 3) Complete (ghi sổ + cập nhật tồn)

Trong **một transaction**:

- Re-check đầy đủ các validate của draft (FK, trạng thái, location bin, variant, qty…).
- Lock các balance cần chạm theo thứ tự cố định để tránh deadlock (gợi ý: gom tất cả tuple nguồn + đích của toàn bộ lines, sort theo `(warehouse_id, location_id, variant_id)`).
- Với từng line:
  - **Nguồn**: đọc/khóa `stock_balances` tại `(warehouse_id_from, location_id_from, variant_id)`, kiểm tra đủ tồn, cập nhật trừ.
  - Ghi `inventory_movements`:
    - `movement_type = TRANSFER_OUT`, `quantity_delta < 0`
    - `reference_type = 'transfer'`, `reference_id = transfers.id`, `reference_line_id = transfer_lines.id`
  - **Đích**: upsert/cập nhật `stock_balances` tại `(warehouse_id_to, location_id_to, variant_id)`, cộng tồn.
  - Ghi `inventory_movements`:
    - `movement_type = TRANSFER_IN`, `quantity_delta > 0`
    - cùng reference như trên.
- Set `transfers.status = completed`, `completed_at = now()`.

**Idempotency**

- Nếu gọi complete lần 2:
  - Trả **409** (trạng thái không cho phép), hoặc
  - Trả **200** kèm entity “đã completed” nếu dự án chọn policy idempotent “no-op”.
- Tuyệt đối không ghi movement/balance lần 2.

## API

Base path gợi ý: `/transfers` (prefix `/api/v1` nếu dự án version hóa). Field JSON **camelCase**.

### `GET /transfers`

- Query gợi ý: `page`, `pageSize`, `q` (documentNo), `status`, `fromDate`, `toDate`, `sort`.
- Response: list + meta; item tóm tắt (không nhất thiết embed lines).

### `GET /transfers/:id`

- **200**: header + lines.
- **404** nếu không tồn tại / đã xóa mềm (trừ policy admin).

### `POST /transfers`

- Tạo transfer `draft`.
- Body gợi ý:
  - `documentNo?` (optional nếu hệ thống tự sinh)
  - `documentDate?`
  - `note?`
  - `lines: [{ variantId, quantity, warehouseIdFrom, locationIdFrom, warehouseIdTo, locationIdTo }]`
- **201** + entity.

### `PATCH /transfers/:id`

- Sửa header (và/hoặc lines nếu dự án tách endpoint), chỉ khi `draft`.
- **409** nếu không phải `draft`.

### `PUT /transfers/:id/lines` (hoặc `PATCH /transfers/:id/lines`)

- Replace toàn bộ lines của phiếu `draft`.
- Validate các rule ở trên.

### `POST /transfers/:id/validate`

- Dry-run validate tồn cho tất cả lines.
- **200**: trả kết quả theo line (ok / thiếu tồn + available).
- **409** nếu thiếu tồn (hoặc trả 200 + list lỗi nếu dự án chọn “partial result”; chọn 1 chuẩn cho toàn dự án).

### `POST /transfers/:id/complete`

- Validate + ghi sổ + cập nhật tồn.
- **200**: entity đã completed.
- **409**: status không hợp lệ / complete lại / thiếu tồn.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Tạo / đọc / cập nhật thành công | 201 / 200 |
| Validation body/query (qty <= 0, from=to, sai warehouse–location, …) | 422 |
| Trùng số phiếu, trạng thái không cho phép thao tác | 409 |
| **Không đủ tồn nguồn** khi validate/complete | 409 (mã `INSUFFICIENT_STOCK`) |
| Variant / warehouse / location không hợp lệ hoặc vi phạm policy xóa mềm / active | 404 hoặc 409 (thống nhất dự án) |
| Không đủ quyền | 403 |

Payload lỗi: `code` + `message` (và `details` nếu cần) thống nhất các module WMS.

## Ghi chú triển khai

- Service `complete` phải dùng transaction + lock theo chuẩn [inventory detail](../inventory/detail-design.md); tuyệt đối không update `stock_balances` ngoài transaction.
- Khi validate kho–ô: ưu tiên dùng helper chung (vd. `assertLocationForStock(warehouseId, locationId)` mô tả ở [warehouses detail](../warehouses/detail-design.md)).
- Khi build payload lỗi thiếu tồn: trả về `transferLineId` (nếu có) hoặc index trong request lines để UI map chính xác dòng lỗi.

## Mở rộng sau MVP

- Workflow nhiều bước: `draft` → `confirmed` → `in_transit` → `completed`.
- Reservation (giữ hàng) cho phiếu `draft`.
- Batch/serial, đa UoM, rule allocation tự động (FIFO/FEFO).
