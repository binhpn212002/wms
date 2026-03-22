# User — Role & Permission — Detail design

## Tài liệu tham chiếu

- [Kế hoạch triển khai](./plan.md)
- [Basic design](./basic-design.md)
- [Auth — basic design](../auth/basic-design.md) (JWT, đăng nhập Firebase — đồng bộ luồng xác thực)

## Phạm vi MVP

- **User**: định danh đăng nhập (`username`, `phone`), hồ sơ tùy chọn (`email`, `full_name`, `avatar_url`, `dob`), liên kết Firebase tùy chọn, trạng thái `active` / `inactive`.
- **Role**: mã `code` unique (`admin`, `warehouse`, `manager`, …), tên hiển thị, mô tả.
- **Permission**: mã `code` unique dạng `resource.action` (vd. `outbound.complete`, `user.create`), kèm `resource`, `action` để lọc và gắn UI.
- **Gán quyền**: N-N `user ↔ roles` (`user_roles`), N-N `role ↔ permissions` (`role_permissions`).
- **Role & permission — không API CRUD (MVP)**: Bảng `roles`, `permissions`, `role_permissions` được **nạp cố định bằng seed** (migration/seed script). Không có endpoint REST tạo/sửa/xóa role hay permission; không gán permission cho role qua API. Cập nhật danh sách role/permission hoặc mapping → **sửa seed + triển khai lại** (hoặc migration dữ liệu), không qua UI/API quản trị trong MVP.
- **JWT / guard**: payload chứa `userId`, danh sách `roles`, tập `permissions` (flatten từ mọi role của user) — đồng bộ [basic](./basic-design.md).
- **Bảng `user_permissions`**: **không** bắt buộc MVP; mở rộng khi cần quyền lẻ từng user.

## Mô hình dữ liệu

### Bảng `users`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `username` | string | Có | Tên đăng nhập — **unique** (toàn hệ thống MVP) |
| `phone` | string | Có | Số điện thoại — **unique**; chuẩn hóa (trim, E.164 hoặc format nội địa theo validator chung) |
| `firebase_id` | string, nullable | Không | UID Firebase — **bắt buộc có giá trị** để đăng nhập API qua ID token ([auth basic](../auth/basic-design.md)); unique khi có (partial unique index). **Không** lưu mật khẩu trong DB |
| `email` | string, nullable | Không | Email; unique tùy policy (MVP: nullable, không bắt buộc unique) |
| `full_name` | string, nullable | Không | Họ tên hiển thị |
| `avatar_url` | string, nullable | Không | URL ảnh đại diện |
| `dob` | date, nullable | Không | Ngày sinh |
| `status` | string / enum | Có | `active` \| `inactive` — mặc định `active`; `inactive` không đăng nhập được |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique: `(username)`, `(phone)`.
- Unique partial: `(firebase_id)` WHERE `firebase_id IS NOT NULL` (nếu dùng Firebase).
- Lọc danh sách: `(status)`, `(created_at)`.

**Quy tắc**

- `username` / `phone`: trim; độ dài và ký tự cho phép theo validator WMS.
- Không xóa cứng user đang tham chiếu audit bắt buộc — MVP có thể **inactive** thay vì xóa.

### Bảng `roles`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã vai trò — **unique**: `admin`, `warehouse`, `manager`, … (lowercase, snake_case hoặc thống nhất một quy ước) |
| `name` | string | Có | Tên hiển thị |
| `description` | text, nullable | Không | Mô tả |

**Index**: unique `(code)`.

### Bảng `permissions`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã quyền — **unique**, vd. `user.create`, `outbound.complete` |
| `name` | string | Có | Tên/diễn giải ngắn |
| `resource` | string | Có | Tài nguyên: `user`, `outbound`, `warehouse`, … |
| `action` | string | Có | Hành động: `create`, `read`, `update`, `delete`, `approve`, `export`, … |
| `description` | text, nullable | Không | Ghi chú |

**Index gợi ý**

- Unique `(code)`.
- `(resource)`, `(resource, action)` — lọc và tránh trùng cặp (resource, action) nếu enforce ở DB (unique tùy policy).

### Bảng `user_roles` (N-N)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `user_id` | UUID (FK → `users.id`) | Có | |
| `role_id` | UUID (FK → `roles.id`) | Có | |

**Khóa**: PK hoặc unique `(user_id, role_id)`.

### Bảng `role_permissions` (N-N)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `role_id` | UUID (FK → `roles.id`) | Có | |
| `permission_id` | UUID (FK → `permissions.id`) | Có | |

**Khóa**: PK hoặc unique `(role_id, permission_id)`.

### Mở rộng: `user_permissions` (sau MVP)

- `(user_id, permission_id)` — quyền trực tiếp cho user (override hoặc bổ sung). Khi đánh giá quyền hiệu lực: `union(permissions từ mọi role, permissions trực tiếp)` — tùy policy (additive).

## Quy tắc nghiệp vụ

1. **Đăng nhập**: xác thực theo policy (JWT sau khi verify mật khẩu hoặc Firebase token) — chi tiết endpoint [auth basic](../auth/basic-design.md).
2. **JWT payload**: gồm `sub`/`userId`, `roles` (mã hoặc id), `permissions` (mã permission đủ để `PermissionsGuard` so khớp).
3. **Tính tập permission của user**: lấy mọi `role_id` từ `user_roles` → join `role_permissions` → distinct `permission.code`; cache khi issue token hoặc load từ DB mỗi request (trade-off).
4. **Gán role cho user** (API): chỉ `admin` hoặc permission `user.assign_role` (thống nhất mã permission) — gán/bỏ `role_id` đã tồn tại trong DB (do seed).
5. **Trạng thái user**: `inactive` → từ chối đăng nhập / refresh token (401/403).

## API (gợi ý)

Base path gợi ý: `/users`, `/auth/...` (prefix `/api/v1`). JSON **camelCase**; lỗi `code` + `message` đồng bộ chuẩn WMS.

### User (có API)

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/auth/register` hoặc `/users` | Tạo user (policy admin); có thể gán `firebaseId` |
| `POST` | `/auth/firebase` | Đăng nhập — body `idToken` Firebase → JWT |
| `GET` | `/users/me` | Profile user hiện tại (JWT) |
| `PATCH` | `/users/me` | Cập nhật hồ sơ (không đổi role tại đây trừ policy) |
| `GET` | `/users` | Danh sách + lọc (role, status, `q`) |
| `GET` | `/users/:id` | Chi tiết |
| `PATCH` | `/users/:id` | Cập nhật (admin) |
| `POST` / `PUT` | `/users/:id/roles` | Gán vai trò cho user (body: `roleIds[]` — chỉ trỏ tới role đã có từ **seed**) |
| `DELETE` | `/users/:id` | Vô hiệu hóa / xóa mềm tùy policy |

### Role & permission — **không có API public (MVP)**

- **Không** triển khai `GET/POST/PATCH/DELETE` cho `/roles`, `/permissions`, cũng **không** API gán permission cho role.
- Dữ liệu đọc nội bộ trong service khi đăng nhập (load role → permission để đưa vào JWT) và trong guard — lấy từ bảng đã seed.

## Guards & decorator (NestJS)

- `JwtAuthGuard` — gắn route cần đăng nhập.
- `@CurrentUser()` — payload đã verify.
- `RolesGuard` + `@Roles('admin', …)` — kiểm tra ít nhất một role khớp.
- `PermissionsGuard` + `@Permissions('outbound.complete', …)` — kiểm tra user có **một trong** hoặc **tất cả** permission (thống nhất một semantics; thường “cần đủ tất cả” hoặc “một trong các” tùy decorator).

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công | 200 / 201 / 204 |
| Validation | 422 |
| Trùng `username` / `phone` / `firebase_id` | 409 |
| Sai credentials / token | 401 |
| Không đủ quyền | 403 |
| Không tìm thấy user (API) | 404 |

## Ghi chú triển khai

- Entity: `User`, `Role`, `Permission` + bảng nối; TypeORM `ManyToMany` hoặc bảng nối explicit để kiểm soát index.
- **Seed (bắt buộc)**: insert đầy đủ `roles`, `permissions`, `role_permissions` cho MVP (vd. `admin` + đủ quyền, `warehouse`, `manager`, …). Mọi thay đổi danh sách/mapping sau này: cập nhật seed/migration, không dựa API CRUD.
- Mật khẩu không lưu trên server (Firebase xử lý phía client/IdP); rotation JWT refresh nếu có ([auth](../auth/basic-design.md)).

## Mở rộng sau MVP

- Bảng `user_permissions`; đa tenant `org_id`; audit log thay đổi role; permission theo scope (kho cụ thể).
- **Tùy chọn**: API quản trị CRUD role/permission + gán permission cho role (khi cần UI cấu hình động) — hiện tại cố định bằng seed.
