# Sản phẩm — Basic design

## Mục đích

Quản lý **sản phẩm**, **biến thể** (size, màu, …), **SKU duy nhất** cho từng biến thể.

## Phạm vi MVP

| Thực thể | Mô tả |
|----------|--------|
| **Product** | Tên, mã nội bộ, category (FK), UoM mặc định, trạng thái active |
| **Product variant** | Tổ hợp thuộc tính (hoặc danh sách attribute value IDs), **SKU unique**, barcode tùy chọn |
| **Variant attribute** | Bảng nối variant ↔ attribute values (nhiều-nhiều qua giá trị) |

## Quy tắc

- **SKU**: unique toàn hệ thống (hoặc unique trong organization nếu sau này đa tenant).
- Tạo/sửa/xóa: xóa chỉ khi không có tồn / không có chứng từ mở (hoặc chỉ inactive).

## Luồng nghiệp vụ

1. Tạo product → thêm ít nhất một variant (hoặc cho phép “default variant” một SKU).
2. Sửa thông tin / thêm variant mới.
3. Ngừng bán: đặt `active = false` thay vì xóa cứng.

## Liên kết module

- **Master data**: category, UoM, attributes.
- **Inventory / Inbound / Outbound / Transfers**: mọi dòng chứng từ tham chiếu `variant_id` (và `warehouse_id` / `location_id` nếu có).

## Gợi ý API

- `GET/POST /products`, `GET/PATCH/DELETE /products/:id`
- `POST /products/:id/variants`, `PATCH /products/:id/variants/:vid`
