# Chuyển kho (transfers) — Basic design

## Tài liệu tham chiếu

- [Tồn kho — detail design](../inventory/detail-design.md) (`stock_balances`, `inventory_movements`, khóa, transaction, `TRANSFER_OUT` / `TRANSFER_IN`)
- [Xuất kho — basic design](../outbound/basic-design.md) (đối chiếu luồng validate/complete + quy tắc immutable sau complete)
- [Kho & vị trí — detail design](../warehouses/detail-design.md) (`warehouse_id`, `location_id`, chỉ `type = bin` cho tồn/chứng từ)
- [Sản phẩm — detail design](../products/detail-design.md) (`variant_id` → `product_variants.id`, UoM mặc định, xóa mềm variant)

## Mục đích

Tạo **phiếu chuyển kho/chuyển vị trí**, khai báo **nguồn** (`warehouseIdFrom`, `locationIdFrom`) và **đích** (`warehouseIdTo`, `locationIdTo`) cho từng dòng; trước khi hoàn tất **kiểm tra đủ tồn ở nguồn** tại từng `(warehouseIdFrom, locationIdFrom, variantId)`; khi **hoàn tất**, cập nhật tồn **hai phía** trong **một transaction**: nguồn trừ + đích cộng, đồng thời ghi **ledger** `inventory_movements` theo đúng chuẩn inventory.

## Phạm vi MVP

### Phiếu (header)

| Khái niệm | Mô tả |
|-----------|--------|
| **Transfer document** | Số phiếu (`documentNo` hoặc tương đương), ngày chứng từ, trạng thái, audit người tạo / cập nhật |
| **Trạng thái** | `draft` → `completed` (MVP). Mở rộng sau: `in_transit` nếu có logistics/điều phối nhiều bước |

### Dòng phiếu (lines)

| Khái niệm | Mô tả |
|-----------|--------|
| **Transfer line** | `variantId` → `product_variants.id`, `quantity` > 0 (theo UoM mặc định của product chứa variant), `warehouseIdFrom` + `locationIdFrom` **nguồn**, `warehouseIdTo` + `locationIdTo` **đích** |

## Quy tắc nghiệp vụ

### Cập nhật tồn khi `completed`

- Trong **một transaction**: với mỗi dòng — đọc/khóa `stock_balances` nguồn theo `(warehouseIdFrom, locationIdFrom, variantId)`, kiểm tra `available >= requestedQty`, sau đó:
  - **Trừ nguồn**: cập nhật balance nguồn (trừ) và insert `inventory_movements` với `quantity_delta < 0`, `movement_type = TRANSFER_OUT`, `reference_type = transfer`, `reference_id = id phiếu`, `reference_line_id = id dòng`.
  - **Cộng đích**: upsert/cập nhật balance đích (cộng) và insert `inventory_movements` với `quantity_delta > 0`, `movement_type = TRANSFER_IN`, cùng reference như trên.
  - Chi tiết chuẩn ledger xem [inventory detail](../inventory/detail-design.md) (mục transfer tạo **hai** dòng movement).
- **Khóa** balance theo thứ tự cố định trên nhiều dòng để tránh deadlock (gợi ý sort theo tuple `(warehouseId, locationId, variantId)` cho tất cả balance cần chạm: cả nguồn và đích).
- **Immutable**: sau `completed` không sửa/xóa số lượng đã ghi; sửa sai = phiếu điều chỉnh / phiếu ngược (sau MVP). MVP có thể **cấm** sửa/xóa phiếu đã `completed`.

### Kiểm tra tồn (trước `complete` hoặc dry-run)

- Với mỗi dòng: `available` ≥ `requested` — MVP `available = stock_balances.quantity` (chưa có reserve; xem mở rộng).
- Không cho `complete` nếu thiếu tồn: trả **409** (hoặc **422** nếu dự án chọn) kèm chi tiết theo dòng, mã gợi ý `INSUFFICIENT_STOCK` (thống nhất theo inventory).
- Endpoint gợi ý **`POST /transfers/:id/validate`** (dry-run): chỉ đọc + cùng logic kiểm tra, **không** ghi tồn.

### Kho & vị trí (from/to)

- `locationIdFrom` phải thuộc đúng `warehouseIdFrom`, `locations.type = 'bin'`, chưa xóa mềm.
- `locationIdTo` phải thuộc đúng `warehouseIdTo`, `locations.type = 'bin'`, chưa xóa mềm.
- Cho phép **cùng kho** (chuyển vị trí) hoặc **khác kho** (chuyển kho). MVP gợi ý **chặn** trường hợp nguồn và đích trùng hoàn toàn `(warehouseIdFrom = warehouseIdTo AND locationIdFrom = locationIdTo)` vì không tạo thay đổi thực.

### Biến thể (SKU) & đơn vị tính

- Không phát sinh movement cho variant đã xóa mềm / không hợp lệ; xung đột tham chiếu trả **409** (tham chiếu [products detail](../products/detail-design.md)).
- `quantity` và `quantity_delta` luôn theo **`products.default_uom_id`** của product chứa variant — không đổi UoM trên phiếu chuyển trong MVP ([inventory detail](../inventory/detail-design.md)).

### Đồng thời với inbound/outbound/transfers khác

- Thao tác chạm balance phải **atomic** và dùng lock như chuẩn inventory để tránh race/oversell (tham chiếu [inventory detail](../inventory/detail-design.md)).

## Liên kết module

- **Products (variants)**: dòng `variantId` (không dùng SKU string làm khóa nghiệp vụ).
- **Warehouses / locations**: validate `warehouseIdFrom/To` và `locationIdFrom/To` (chỉ `bin`).
- **Inventory**: chỉ ghi tồn qua service transfer khi complete — không CRUD tay balance từ API inventory.

## Gợi ý API

Base path gợi ý: `/transfers` (prefix `/api/v1` nếu dự án version hóa). Field JSON **camelCase**; payload lỗi `code` + `message` đồng bộ chuẩn đã dùng ở products/inventory.

- `POST /transfers` — tạo phiếu `draft` (header).
- `PATCH /transfers/:id` — sửa header khi còn `draft`.
- `PATCH /transfers/:id/lines` hoặc `PUT` thay thế toàn bộ dòng — khi `draft`.
- `POST /transfers/:id/validate` — dry-run kiểm tồn nguồn (không ghi sổ).
- `POST /transfers/:id/complete` — validate + trừ nguồn + cộng đích + ledger; idempotent theo policy (không complete hai lần).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Tạo / đọc / cập nhật thành công | 201 / 200 |
| Validation body (thiếu trường, qty <= 0, sai warehouse–location, …) | 422 |
| Trạng thái không cho phép thao tác / complete hai lần | 409 |
| **Không đủ tồn nguồn** khi validate/complete | 409 (gợi ý mã `INSUFFICIENT_STOCK`) |
| Variant / warehouse / location không hợp lệ hoặc vi phạm policy xóa mềm / active | 404 hoặc 409 (thống nhất dự án) |
| Không đủ quyền | 403 |

## Phân quyền (tham chiếu)

- NV kho: tạo phiếu, nhập dòng, validate/complete.
- Manager: duyệt/giám sát (nếu sau này có bước confirm).
- Admin: toàn quyền.

## Mở rộng sau MVP

- Workflow nhiều bước: `draft` → `confirmed` → `in_transit` → `completed`.
- Reservation (giữ hàng) cho phiếu `draft`: available = quantity − reserved (tham chiếu inventory).
- Chuyển kèm batch/serial, đa UoM, hoặc rule allocation tự động (FIFO/FEFO) theo ô nguồn/đích.
