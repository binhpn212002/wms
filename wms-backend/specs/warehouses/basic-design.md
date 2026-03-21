# Kho & vị trí — Basic design

## Mục đích

Quản lý **nhiều kho**, **cấu trúc vị trí** (kệ, tầng, ô), để **tồn kho theo vị trí** rõ ràng.

## Phạm vi MVP

| Thực thể | Mô tả |
|----------|--------|
| **Warehouse** | Mã, tên, địa chỉ tùy chọn, active |
| **Location** | Cây hoặc danh sách có quan hệ cha-con: kho → kệ → ô (dùng `parent_id` + `type`: zone / rack / bin) |
| **Mặc định** | Mỗi kho có thể có một `default_location_id` cho nhập nhanh |

## Quy tắc

- Một vị trí lá (bin) là nơi gán tồn; vị trí cha chỉ để tổ chức (không cần tồn trực tiếp nếu thiết kế chỉ tồn ở lá).
- Di chuyển vị trí trong cây: hạn chế MVP (chỉ sửa metadata), hoặc cấm khi đã có tồn.

## Liên kết module

- **Inventory**: `warehouse_id` + `location_id` + `variant_id` + `quantity`.
- **Inbound / Outbound / Transfers**: dòng phiếu chỉ định kho/vị trí nguồn đích.

## Gợi ý API

- `GET/POST /warehouses`, `GET/PATCH /warehouses/:id`
- `GET/POST /warehouses/:id/locations` (tree hoặc flat có `parent_id`)
