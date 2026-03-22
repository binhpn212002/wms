# Thiết kế module User (user module design) — Role & Permission

## Tài liệu tham chiếu

- [Detail design](./detail-design.md) — schema chi tiết, API, guards
- [Kế hoạch triển khai](./plan.md)

## Mục tiêu

Xây dựng module `user` phục vụ xác thực, lưu trữ thông tin người dùng, phân quyền (role-based và permission-based), cung cấp thông tin user cũng như khả năng kiểm soát truy cập chi tiết cho các module nghiệp vụ khác (MVP cho WMS, sẵn sàng mở rộng).

## Cấu trúc dữ liệu

**Bảng `users`**:  
- `id` (UUID, PK)  
- `username` (unique, required) — tên đăng nhập  
- `phone` (unique, required) — số điện thoại dùng để đăng nhập  
- `dob` — ngày sinh (optional)  
- `firebase_id` — liên kết Firebase (optional)  
- `email` (optional)  
- `full_name`, `avatar_url` (optional)  
- `status` (`active`/`inactive`, required, default: `active`) — trạng thái hoạt động của người dùng  
- `created_at`, `updated_at` — audit  

**Bảng `roles`**:  
- `id` (UUID, PK)  
- `code` (unique) — mã vai trò: `admin`, `warehouse`, `manager`, ...  
- `name` — tên hiển thị  
- `description` (optional)

**Bảng `permissions`**:  
- `id` (UUID, PK)
- `code` (unique) — dạng: `user.create`, `outbound.complete`, ...
- `name` — tên hiển thị/diễn giải ngắn
- `resource` — ví dụ: `user`, `outbound`, `warehouse`, ...
- `action` — ví dụ: `create`, `read`, `update`, `delete`, `approve`, `export`, v.v.
- `description` (optional)

**Bảng `user_roles`** (N-N):  
- `user_id` (FK → users.id)  
- `role_id` (FK → roles.id)  

**Bảng `role_permissions`** (N-N):  
- `role_id` (FK → roles.id)  
- `permission_id` (FK → permissions.id)  

*Chú ý*:  
- Nếu cần granular permission riêng từng user, có thể bổ sung bảng `user_permissions`.
- Thiết kế này hỗ trợ: 1 user nhiều vai trò, mỗi vai trò có nhiều permission.

## Luồng chính & API trong module User

- Đăng ký user (chỉ cho admin/role đặc biệt)
- Đăng nhập (trả về JWT, chứa claim userId, roles, permissions)
- Đổi mật khẩu, cập nhật thông tin cá nhân
- Lấy profile user hiện tại (JWT)
- CRUD user, **gán vai trò cho user** (chỉ dùng `role_id` đã có trong hệ thống)
- **Role & permission**: danh sách role, permission và mapping role → permission được **định nghĩa bằng seed** (không có API CRUD role/permission / gán permission cho role trong MVP — xem [detail design](./detail-design.md))
- List user theo role, v.v.

## Phân quyền & tích hợp

- Mọi request: middleware/auth guard xác thực JWT lấy `user` + `roles` + `permissions`.
- Decorator `@CurrentUser()` lấy user hiện tại.
- Decorator `@Roles(...)` & guard `RolesGuard` — kiểm soát role.
- Decorator `@Permissions(...)` & guard `PermissionsGuard` — kiểm soát permission ở mức chi tiết, endpoint/action.
- Module khác (inbound, outbound, warehouse...) **import** UserModule; gọi service để kiểm tra quyền: `userService.hasPermission(userId, 'outbound.complete')`, `userService.hasRole(userId, 'admin')`...

## Ví dụ Enum & Entities (NestJS style)


## Kết nối giữa các module

- Module nghiệp vụ (inbound, outbound, warehouse...) sử dụng guard & decorator của user module.
- Định nghĩa mapping role → permission trong từng controller/service, hoặc check trực tiếp permission khi cần.
- Thêm role/permission mới trong MVP: cập nhật **seed** (và migration nếu cần), không qua API.

## Khả năng mở rộng

- Hỗ trợ granular permission (thao tác chi tiết từng tài nguyên, action).
- Multi-role per user, multi-permission per role.
- Có thể cấp bổ sung quyền đặc biệt trực tiếp cho từng user.
- Gắn permission động cho menu/UI.

## Tổng kết

- Module User quản lý xác thực, role, granular permission cho WMS.
- Dữ liệu linh hoạt, tuần tự mở rộng vai trò và quyền.
- Bảo mật JWT, password hash, guard/permission chặt chẽ. Có thể tích hợp SSO, social login nếu cần.
- Thiết kế chuẩn hóa, tách biệt role (vai trò) và permission (quyền), đáp ứng triển khai thực tế hệ thống lớn.
