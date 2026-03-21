# Giá trị thuộc tính (attribute values) — Basic design

## Mục đích

Giá trị cụ thể thuộc một **attribute**: `S`, `M`, `L`, `Đỏ`, `Xanh`, … Dùng để tạo **tổ hợp biến thể** + SKU.

## MVP

- Trường gợi ý: `attribute_id` (FK), `code`, `name` (hiển thị), `sort_order`, `active`.
- `code` có thể unique trong phạm vi `(attribute_id)` — ví dụ cùng mã `RED` cho màu nhưng khác attribute.

## Quy tắc

- Không xóa cứng nếu variant đang dùng giá trị này.
- Tạo variant = chọn tập giá trị (mỗi attribute tối đa một giá trị trong combo, tùy nghiệp vụ).

## API gợi ý

`GET/POST/PATCH/DELETE /master-data/attributes/:attributeId/values`
