# Nhà cung cấp — Basic design

## Tài liệu tham chiếu

- [Sản phẩm — basic design](../products/basic-design.md)

## Mục đích

Lưu **nhà cung cấp** và **thông tin liên hệ**, dùng khi tạo **phiếu nhập kho**.

## Phạm vi MVP

| Thực thể | Mô tả |
|----------|--------|
| **Supplier** | Mã, tên, MST/tax id tùy chọn, ghi chú |
| **Contact** | Tên, SĐT, email, chức danh — gắn supplier (1-N) |

## Quy tắc

- Xóa mềm / inactive nếu đã có lịch sử nhập (giữ tính toàn vẹn chứng từ).
- Tìm kiếm theo mã / tên.

## Liên kết module

- **Inbound**: phiếu nhập có `supplier_id` (bắt buộc hoặc optional tùy nghiệp vụ; MVP: nên có khi nhập mua hàng).

## Gợi ý API

- `GET/POST /suppliers`, `GET/PATCH /suppliers/:id`
- `POST /suppliers/:id/contacts`, `PATCH /contacts/:cid`
