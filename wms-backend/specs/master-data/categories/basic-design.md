# Loại sản phẩm (categories) — Basic design

## Mục đích

Phân nhóm sản phẩm để lọc, báo cáo, và (sau này) phân quyền theo ngành hàng.

## MVP

- Trường gợi ý: `code`, `name`, `parent_id` (nullable — MVP có thể chỉ 1 cấp), `active`, `deleted_at` (xóa mềm).
- Cây phân cấp: dùng `parent_id`; không bắt buộc MVP.

## Quy tắc

- `code` unique trong phạm vi áp dụng (toàn hệ thống hoặc org sau này).
- Không xóa cứng nếu còn product gắn category.

## API gợi ý

`GET/POST/PATCH/DELETE /master-data/categories`

## Tài liệu chi tiết

- [Detail design](./detail-design.md)
