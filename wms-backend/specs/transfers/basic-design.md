# Chuyển kho — Basic design

## Mục đích

**Chuyển hàng** giữa kho hoặc giữa vị trí trong cùng kho, cập nhật **tồn hai phía** (nguồn trừ, đích cộng) trong một giao dịch.

## Phạm vi MVP

| Khái niệm | Mô tả |
|-----------|--------|
| **Transfer document** | Từ `warehouse_from` / `location_from` → `warehouse_to` / `location_to` (có thể cùng kho, khác vị trí) |
| **Transfer line** | variant_id, qty |
| **Trạng thái** | `draft` → `completed` (hoặc có `in_transit` nếu sau này có logistics) |

## Quy tắc

- Kiểm tra tồn nguồn giống xuất kho.
- Một transaction: trừ nguồn + cộng đích; nếu lỗi thì rollback toàn bộ phiếu.

## Liên kết module

- **Inventory**, **Warehouses**, **Products**.

## Gợi ý API

- `POST /transfers`, `PATCH /transfers/:id/lines`
- `POST /transfers/:id/complete`
