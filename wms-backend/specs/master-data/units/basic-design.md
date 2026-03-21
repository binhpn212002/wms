# Đơn vị tính (units) — Basic design

## Mục đích

Chuẩn hóa **đơn vị đo** dùng trên sản phẩm và trên chứng từ (nhập/xuất).

## MVP

- Trường gợi ý: `code`, `name`, `symbol` (tùy chọn), `active`.
- Quy đổi giữa đơn vị (ví dụ thùng ↔ cái): **ngoài MVP** hoặc bảng `uom_conversion` sau.

## Quy tắc

- `code` unique (VD: `PCS`, `BOX`, `KG`).
- Product có `default_uom_id` tham chiếu bảng này.

## API gợi ý

`GET/POST/PATCH/DELETE /master-data/units`
