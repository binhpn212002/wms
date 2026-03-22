# Nhà cung cấp — Basic design

## Tài liệu tham chiếu

- [Detail design](./detail-design.md)
- [Sản phẩm — basic design](../products/basic-design.md)
- [Nhập kho — basic design](../inbound/basic-design.md)

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

## Luồng nghiệp vụ

1. Tạo **Supplier** (mã + tên; MST nếu cần).
2. Thêm **Contact** (một hoặc nhiều người liên hệ).
3. Khi lập [phiếu nhập](../inbound/basic-design.md): chọn `supplier_id` (theo nghiệp vụ MVP — nên có khi nhập mua hàng).

## Liên kết module

- **Inbound**: phiếu nhập có `supplier_id` (bắt buộc hoặc optional tùy nghiệp vụ; MVP: nên có khi nhập mua hàng).
- **Products**: không FK trực tiếp; NCC chỉ xuất hiện trên chứng từ nhập, không gắn vào master sản phẩm trong MVP.

## Gợi ý API

- Prefix ví dụ `/api/v1`: `GET/POST /suppliers`, `GET/PATCH /suppliers/:id`
- `POST /suppliers/:id/contacts`, `PATCH /contacts/:cid`

## Phân quyền (tham chiếu)

- NV mua / kho: xem, tạo, sửa NCC và liên hệ.
- Admin: toàn quyền (bao gồm inactive khi cần).
