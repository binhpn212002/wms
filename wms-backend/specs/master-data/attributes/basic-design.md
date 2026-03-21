# Thuộc tính (attributes) — Basic design

## Mục đích

Định nghĩa **loại** thuộc tính dùng cho biến thể: ví dụ `Size`, `Color`, `Material`.

## MVP

- Trường gợi ý: `code`, `name`, `active`, thứ tự hiển thị (optional).
- Một sản phẩm có thể dùng nhiều thuộc tính; giá trị cụ thể nằm ở submodule **attribute-values**.

## Quy tắc

- `code` unique (VD: `SIZE`, `COLOR`).
- Xóa: chỉ khi không còn giá trị / không còn variant map (hoặc soft delete).

## API gợi ý

`GET/POST/PATCH/DELETE /master-data/attributes`
