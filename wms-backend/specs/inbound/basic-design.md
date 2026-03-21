# Nhập kho — Basic design

## Mục đích

Tạo **phiếu nhập**, chọn **NCC**, nhập **danh sách dòng** (variant + số lượng + vị trí đích), sau khi hoàn tất **cộng tồn**.

## Phạm vi MVP

| Khái niệm | Mô tả |
|-----------|--------|
| **Inbound document** | Số phiếu, ngày, supplier_id, warehouse_id, trạng thái, người tạo |
| **Inbound line** | variant_id, qty, unit_price tùy chọn, location_id đích |
| **Trạng thái** | `draft` → `confirmed` / `completed` (tồn chỉ thay đổi khi `completed` hoặc khi `confirmed` nếu không cần bước duyệt) |

## Quy tắc

- **Cộng tồn** trong transaction: cập nhật bảng inventory theo `(warehouse, location, variant)`.
- Sửa / hủy sau hoàn tất: MVP có thể **cấm** hoặc chỉ cho **phiếu điều chỉnh** (khuyến nghị cấm sửa số đã hoàn tất; dùng phiếu trả/điều chỉnh sau).

## Liên kết module

- **Suppliers**, **Products (variants)**, **Warehouses/locations**, **Inventory**.

## Gợi ý API

- `POST /inbound` (draft), `PATCH /inbound/:id/lines`
- `POST /inbound/:id/complete` (hoặc `submit` + `approve` nếu có manager)

## Phân quyền (tham chiếu)

- NV kho: tạo / nhập dòng.
- Manager: duyệt (nếu bật workflow).
- Admin: toàn quyền.
