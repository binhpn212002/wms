# Kho & vị trí — Basic design

## Tài liệu tham chiếu

- [Detail design](./detail-design.md)
- [Tồn kho — detail design](../inventory/detail-design.md)

## Mục đích

Quản lý **nhiều kho**, **cấu trúc vị trí** (kệ, tầng, ô), để **tồn kho theo vị trí** rõ ràng và khớp với mô hình tồn trong [Tồn kho — detail design](../inventory/detail-design.md).

## Phạm vi MVP

| Thực thể | Mô tả |
|----------|--------|
| **Warehouse** | `code` (duy nhất), `name`, `address` (tùy chọn), `active`; `default_location_id` (tùy chọn, FK → `locations.id`) — ô mặc định cho nhập nhanh khi UI không chọn vị trí. |
| **Location** | Thuộc **một** kho (`warehouse_id`); cây **trong kho** qua `parent_id` (nullable — gốc kho); `type`: `zone` / `rack` / `bin`; `code` (duy nhất trong phạm vi kho hoặc toàn hệ thống — thống nhất dự án), `name` tùy chọn. |

## Quy tắc

- **Tồn chỉ tại lá**: Ghi nhận tồn (`stock_balances`, `inventory_movements`) chỉ tại vị trí có `type = bin` (hoặc tương đương `is_leaf` nếu sau này bổ sung). Vị trí cha (`zone`, `rack`) chỉ để tổ chức, không gán số lượng tồn trực tiếp trong MVP.
- **Không cross-warehouse**: Mọi `location_id` dùng trong chứng từ / tồn phải có `locations.warehouse_id` khớp `warehouse_id` của dòng tồn hoặc đầu phiếu — enforce bằng validate application (hoặc trigger); không gán tồn từ ô thuộc kho A vào header kho B.
- **`default_location_id`**: Nếu có, phải trỏ tới một `locations.id` của **chính** kho đó, và nên là **bin** để dùng cho luồng nhập nhanh (khớp [inventory detail — mục Vị trí](../inventory/detail-design.md)).
- **Cây vị trí**: `parent_id` (nếu có) phải thuộc cùng `warehouse_id`; không tạo vòng. Di chuyển nút trong cây: MVP hạn chế (chỉ sửa metadata), hoặc cấm khi đã có tồn tại vị trí con / chính.

## Liên kết module

- **Inventory**: Mỗi dòng tồn tức thời là `(warehouse_id, location_id, variant_id)` với `quantity` — xem [detail design](../inventory/detail-design.md). `location_id` luôn là **ô (bin)** trong MVP.
- **Inbound / Outbound / Transfers**: Dòng phiếu chỉ định kho/vị trí nguồn đích; service validate warehouse ↔ location trước khi gọi cập nhật tồn.

## Gợi ý API

- `GET/POST /warehouses`, `GET/PATCH /warehouses/:id`
- `GET/POST /warehouses/:id/locations` (tree hoặc flat có `parent_id`, `type`)

Field JSON **camelCase** nếu đồng bộ [inventory detail](../inventory/detail-design.md).
