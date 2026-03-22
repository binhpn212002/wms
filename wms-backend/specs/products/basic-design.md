# Sản phẩm — Basic design

## Tài liệu tham chiếu

- [Thuộc tính (attributes) — basic design](../master-data/attributes/basic-design.md)
- [Giá trị thuộc tính (attribute values) — basic design](../master-data/attribute-values/basic-design.md)

## Mục đích

Quản lý **sản phẩm**, **biến thể** (tổ hợp từ các **giá trị thuộc tính**), **SKU duy nhất** cho từng biến thể.

## Phạm vi MVP

| Thực thể | Mô tả |
|----------|--------|
| **Product** | Tên, mã nội bộ, category (FK), UoM mặc định, trạng thái `active` |
| **Product variant** | Một tập **attribute value ID** (mỗi `attribute_id` tối đa một giá trị trong combo — theo nghiệp vụ attribute-values), **SKU** unique, barcode tùy chọn |
| **Variant ↔ attribute value** | Bảng nối `variant` ↔ `attribute_values` (nhiều-nhiều qua **giá trị**; loại thuộc tính suy ra từ `attribute_values.attribute_id` → `attributes`) |

Biến thể **không** gắn trực tiếp vào bản ghi `attributes` (chỉ qua các dòng `attribute_values` đã chọn), thống nhất với [detail design attribute-values](../master-data/attribute-values/detail-design.md#liên-kết-product--variant).

## Quy tắc

- **SKU**: unique toàn hệ thống (hoặc unique trong organization nếu sau này đa tenant).
- **Tổ hợp variant**: mỗi variant là một tập các `attribute_value_id` hợp lệ; không trùng cặp `(attribute_id, value)` trong cùng một variant (một màu + một size, không hai size).
- **Master data**: loại thuộc tính và danh mục giá trị do `/master-data/attributes` và `/master-data/attributes/:attributeId/values` quản lý; product chỉ **chọn** giá trị đã có.
- Tạo/sửa/xóa: xóa chỉ khi không có tồn / không có chứng từ mở (hoặc chỉ inactive).

## Luồng nghiệp vụ

1. Chuẩn bị master data: [attributes](../master-data/attributes/basic-design.md) + [attribute-values](../master-data/attribute-values/basic-design.md) (vd. Size/S/M/L, Color/Đỏ/Xanh).
2. Tạo product → thêm ít nhất một variant (hoặc “default variant” một SKU).
3. Mỗi variant: gán tập `attribute_value_id` + SKU; hệ thống đảm bảo SKU unique.
4. Ngừng bán: đặt `active = false` thay vì xóa cứng.

## Liên kết module

- **Master data**: category, UoM, **attributes**, **attribute values** (qua FK `attribute_value_id` trên bảng map variant).
- **Inventory / Inbound / Outbound / Transfers**: mọi dòng chứng từ tham chiếu `variant_id` (và `warehouse_id` / `location_id` nếu có).

## Gợi ý API

- Product (module riêng, prefix ví dụ `/api/v1`): `GET/POST /products`, `GET/PATCH/DELETE /products/:id`
- Variant: `POST /products/:id/variants`, `PATCH /products/:id/variants/:vid` (body chứa danh sách `attribute_value_id` và SKU/barcode)
- Đọc master data cho form: dùng API master-data đã định nghĩa — `GET /master-data/attributes`, `GET /master-data/attributes/:attributeId/values`
