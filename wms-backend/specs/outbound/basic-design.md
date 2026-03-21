# Xuất kho — Basic design

## Mục đích

Tạo **phiếu xuất**, **kiểm tra đủ tồn** tại kho/vị trí, sau đó **trừ tồn** khi hoàn tất.

## Phạm vi MVP

| Khái niệm | Mô tả |
|-----------|--------|
| **Outbound document** | Số phiếu, ngày, warehouse_id, lý do xuất (optional), trạng thái |
| **Outbound line** | variant_id, qty, location_id nguồn |
| **Kiểm tra tồn** | Trước khi complete: `available_qty >= requested_qty` từng dòng |

## Quy tắc

- Không cho complete nếu thiếu hàng (báo lỗi theo dòng hoặc gom lỗi).
- Trừ tồn atomic với inbound/transfer (transaction + lock theo dòng tồn hoặc theo khoảng SKU).

## Liên kết module

- **Inventory** (đọc tồn, ghi giảm), **Products**, **Warehouses/locations**.

## Gợi ý API

- `POST /outbound`, `PATCH /outbound/:id/lines`
- `POST /outbound/:id/validate` (dry-run kiểm tồn)
- `POST /outbound/:id/complete`
