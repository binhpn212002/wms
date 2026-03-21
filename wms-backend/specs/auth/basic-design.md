# Phân quyền — Basic design

## Mục đích

Phân quyền theo **vai trò** cho MVP: **Admin**, **Nhân viên kho**, **Manager** (duyệt).

## Phạm vi MVP

| Vai trò | Quyền gợi ý |
|---------|-------------|
| **Admin** | CRUD master data, kho, user/role, mọi chứng từ, báo cáo |
| **Nhân viên kho** | Tạo/sửa phiếu nhập/xuất/chuyển (draft), xem tồn, không xóa cấu hình hệ thống |
| **Manager** | Duyệt / hoàn tất chứng từ (nếu có workflow), xem báo cáo, có thể hạn chế sửa master data |

## Quy tắc

- JWT (đã có trong stack) + **role** claim hoặc bảng `user_roles`.
- Endpoint nhạy cảm: guard theo role + (optional) ownership.

## Liên kết module

- Gắn vào mọi controller **inbound / outbound / transfer / products / warehouses / reports**.

## Gợi ý kỹ thuật

- `@Roles('admin' | 'warehouse' | 'manager')` + `RolesGuard`.
- Policy mở rộng sau: permission granular (resource + action).
