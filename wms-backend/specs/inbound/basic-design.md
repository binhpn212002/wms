# Nhập kho — Basic design

## Tài liệu tham chiếu

- [Tồn kho — detail design](../inventory/detail-design.md) (ghi `stock_balances` + `inventory_movements`, khóa, transaction)
- [Kho & vị trí — detail design](../warehouses/detail-design.md) (`warehouse_id`, `location_id`, chỉ `type = bin` cho tồn, `default_location_id`)
- [Nhà cung cấp — detail design](../suppliers/detail-design.md) (`supplier_id`, `active`, xóa mềm / FK)
- [Sản phẩm — detail design](../products/detail-design.md) (`variant_id` → `product_variants.id`, UoM mặc định, xóa mềm variant)
- [Tồn kho — basic design](../inventory/basic-design.md) (tổng quan balance / variant / location)

## Mục đích

Tạo **phiếu nhập**, chọn **NCC** và **kho**, nhập **danh sách dòng** (`variant_id` + số lượng + vị trí đích); khi **hoàn tất** phiếu, **cộng tồn** trong một transaction cùng **nhật ký ledger** — không ghi tồn “trần” ngoài luồng nghiệp vụ ([inventory detail](../inventory/detail-design.md)).

## Phạm vi MVP

### Phiếu (header)

| Khái niệm | Mô tả |
|-----------|--------|
| **Inbound document** | Số phiếu (`document_no` hoặc tương đương), ngày chứng từ, `supplier_id` → `suppliers.id`, `warehouse_id` → `warehouses.id`, trạng thái, audit người tạo / cập nhật |
| **Trạng thái** | `draft` → có thể `confirmed` (đã khóa nhập liệu, chờ duyệt) → `completed` (đã cộng tồn). MVP có thể gộp: `draft` → `completed` nếu không cần bước duyệt — **một** quy ước cho toàn dự án |

### Dòng phiếu (lines)

| Khái niệm | Mô tả |
|-----------|--------|
| **Inbound line** | `variant_id` → `product_variants.id`, `quantity` > 0 (theo UoM mặc định của sản phẩm chứa variant — [products detail](../products/detail-design.md)), `unit_price` tùy chọn (kế toán / tham chiếu), `location_id` đích → `locations.id` |

## Quy tắc nghiệp vụ

### Cộng tồn khi `completed`

- Trong **một transaction**: với mỗi dòng — **upsert** `stock_balances` theo `(warehouse_id, location_id, variant_id)` và **insert** `inventory_movements` với `quantity_delta` > 0, `movement_type` = `INBOUND_RECEIPT`, `reference_type` = `inbound`, `reference_id` = id phiếu, `reference_line_id` = id dòng ([inventory detail](../inventory/detail-design.md)).
- **Khóa** dòng balance theo thứ tự cố định trên nhiều dòng (vd. sort `(warehouse_id, location_id, variant_id)`) để tránh deadlock.
- **Immutable**: sau `completed`, không sửa số lượng đã ghi; sửa sai = phiếu điều chỉnh / phiếu ngược (sau MVP) — MVP có thể **cấm** sửa/xóa phiếu đã `completed`.

### Vị trí đích

- Chỉ chấp nhận `location_id` thuộc đúng `warehouse_id` của phiếu và `locations.type = bin` ([warehouses detail](../warehouses/detail-design.md)).
- **Nhập nhanh**: nếu client không gửi `locationId` trên dòng, service lấy `warehouses.default_location_id`; nếu null — **422** hoặc bắt buộc user chọn ô (thống nhất với [warehouses detail](../warehouses/detail-design.md)).

### NCC

- `supplier_id` tồn tại, `deleted_at IS NULL`; phiếu **mới** nên chọn supplier `active = true` ([suppliers detail](../suppliers/detail-design.md)).
- Xóa mềm supplier khi còn phiếu tham chiếu: policy **409** — đồng bộ module suppliers.

### Biến thể (SKU)

- Không ghi movement cho variant đã xóa mềm / không hợp lệ; xung đột tham chiếu kho: **409** ([products detail](../products/detail-design.md)).

### Đơn vị tính

- `quantity` trên dòng và trên tồn luôn theo **`products.default_uom_id`** của sản phẩm chứa variant — không đổi UoM trên dòng inbound trong MVP ([inventory detail](../inventory/detail-design.md)).

## Liên kết module

- **Suppliers**: header `supplier_id`.
- **Products (variants)**: dòng `variant_id`; không FK supplier trên product ([products detail](../products/detail-design.md)).
- **Warehouses / locations**: header `warehouse_id`; dòng `location_id` (bin).
- **Inventory**: chỉ ghi qua service inbound (hoặc shared inventory service) khi complete — không CRUD tay balance từ API inventory.

## Gợi ý API

Base path gợi ý: `/inbound` (prefix `/api/v1` nếu dự án version hóa). Field JSON **camelCase**; payload lỗi `code` + `message` đồng bộ [products detail](../products/detail-design.md).

- `POST /inbound` — tạo phiếu `draft` (body: `supplierId`, `warehouseId`, `documentDate?`, …).
- `PATCH /inbound/:id` — sửa header khi còn `draft` (và `confirmed` nếu policy cho phép).
- `PATCH /inbound/:id/lines` hoặc `PUT` thay thế toàn bộ dòng — khi `draft`.
- `POST /inbound/:id/submit` / `POST /inbound/:id/confirm` — tùy workflow (bỏ qua nếu một bước).
- `POST /inbound/:id/complete` — validate + cộng tồn + ledger; idempotent theo policy (không complete hai lần).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Tạo / đọc / cập nhật thành công | 201 / 200 |
| Validation body/query (thiếu ô khi không có default, sai warehouse–location, …) | 422 |
| Trùng số phiếu, trạng thái không cho phép thao tác | 409 |
| Variant / supplier / warehouse / location không hợp lệ hoặc vi phạm policy xóa mềm / active | 404 hoặc 409 (thống nhất dự án) |
| Không đủ quyền | 403 |

## Phân quyền (tham chiếu)

- NV kho: tạo / nhập dòng / complete (hoặc chỉ draft tùy policy).
- Manager: duyệt / confirm (nếu bật workflow).
- Admin: toàn quyền.

## Mở rộng sau MVP

- Nhập kèm **batch / serial**, đa UoM, OCR/CSV import dòng, liên kết `contact_id` NCC trên phiếu ([suppliers detail](../suppliers/detail-design.md) — mở rộng).
