# Kế hoạch triển khai — User & phân quyền (role/permission)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Module chính (NestJS) | `user` — CRUD user, gán role, đọc profile; export service/repository cho guard & auth |
| Module tích hợp | `auth` — đăng nhập, đăng ký (nếu bật), đổi mật khẩu, cấp JWT (phụ thuộc `UserModule` + chi tiết [auth basic](../auth/basic-design.md)) |
| Phạm vi | Bảng `users`, `roles`, `permissions`, `user_roles`, `role_permissions`; **role/permission chỉ seed**, không API CRUD ([detail-design.md](./detail-design.md)) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/users`, `/api/v1/auth/...` (prefix global `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- **Entity + migration/sync**: `User`, `Role`, `Permission`; bảng nối `user_roles`, `role_permissions` (hoặc `@ManyToMany` + bảng join do TypeORM tạo — thống nhất tên bảng với spec).
- **Seed bắt buộc**: script/migration chạy sau tạo bảng — insert `roles`, `permissions`, `role_permissions` (vd. `admin`, `warehouse`, `manager` + mapping). Không endpoint REST quản lý role/permission.
- **UserService**: `findById`, `findByUsernameOrPhone`, `list` filters, `updateProfile`, `assignRoles` (validate `roleId` tồn tại, transaction cập nhật `user_roles`), `setStatus` inactive.
- **Auth**: JWT strategy đọc user + load `roles` + flatten `permissions` từ DB khi login / refresh; payload chứa `sub`, `roles[]`, `permissions[]` (mã `code`) — khớp [detail-design](./detail-design.md).
- **Guards / decorators** (`src/common` hoặc `src/modules/user` export): `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, `@CurrentUser()`, `@Roles()`, `@Permissions()` — tái sử dụng cho inbound/outbound/…
- **Hằng số**: `common/constants/user.constant.ts` — `UserStatus`, tên bảng nếu cần; `permission` mã nên tham chiếu một file enum/const để tránh typo (vd. `user.permission.ts` hoặc gộp vào `user.constant.ts`).
- **HTTP + lỗi**: `code` + `message` map [`error-code.constant.ts`](../../src/common/constants/error-code.constant.ts) — bổ sung mã `USER_*` khi triển khai.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + tách auth)

```
src/
├── database/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── role.entity.ts
│   │   ├── permission.entity.ts
│   │   └── (join tables nếu khai báo explicit)
│   └── seeds/
│       └── roles-permissions.seed.ts    # hoặc migration seed SQL — tùy chuẩn dự án
├── common/
│   ├── constants/
│   │   └── user.constant.ts             # UserStatus, TABLE_* optional
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── permissions.guard.ts
│   ├── repositories/
│   │   └── base.repository.ts           # đã có — repository user kế thừa
│   └── exceptions/
│       └── user.exceptions.ts           # tùy chọn: not found, duplicate, inactive
└── modules/
    ├── user/
    │   ├── user.module.ts
    │   ├── users.controller.ts
    │   ├── services/
    │   │   └── users.service.ts
    │   ├── repositories/
    │   │   ├── users.repository.ts
    │   │   └── roles.repository.ts      # optional: read-only findByCode, findAll
    │   └── dto/
    │       ├── create-user.dto.ts
    │       ├── update-user.dto.ts
    │       ├── update-profile.dto.ts
    │       ├── assign-user-roles.dto.ts
    │       ├── list-users-query.dto.ts
    │       └── user-response.dto.ts
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── services/
        │   ├── auth.service.ts          # loginWithFirebase, register, issue tokens
        │   └── firebase-admin.service.ts
        ├── strategies/
        │   └── jwt.strategy.ts
        └── dto/
            └── firebase-login.dto.ts
```

- **Lưu ý**: Không tạo `roles.controller.ts` / `permissions.controller.ts` trong MVP.
- **AuthModule** `imports` `UserModule` (export `UsersService`, `UsersRepository` hoặc facade); `UserModule` `imports` `JwtModule` chỉ nếu cần sign token từ `UserModule` — thường để **AuthModule** cấu hình `JwtModule.registerAsync` và `AuthService` gọi `UsersService`.

## 4. Thứ tự công việc đề xuất

1. **Entity + DB**: tạo 5 nhóm bảng (users, roles, permissions, user_roles, role_permissions); unique/index theo [detail-design](./detail-design.md).
2. **Seed**: chạy seed roles + permissions + `role_permissions`; có thể tạo user admin đầu tiên (env `ADMIN_FIREBASE_UID` + optional `ADMIN_USERNAME` / `ADMIN_PHONE`) — **không** commit secret.
3. **`user.constant.ts` + exception** (user not found, duplicate username/phone, inactive login).
4. **Repositories** kế thừa `BaseRepository`: `UsersRepository` (findByUsername, findWithRoles, list filters), đọc role cho assign.
5. **UsersService** + **UsersController**: CRUD theo policy admin; `PUT /users/:id/roles`; `GET/PATCH /users/me` (JWT).
6. **Guards + decorators**: implement `JwtAuthGuard` + strategy; `RolesGuard` / `PermissionsGuard` đọc từ `request.user` (đã gắn khi validate JWT).
7. **AuthService** + **AuthController**: `POST /auth/firebase` (ID token → JWT), register (admin-only); không lưu mật khẩu DB.
8. **Đăng ký module**: `UserModule`, `AuthModule` trong [`app.module.ts`](../../src/app.module.ts); bảo vệ route nghiệp vụ bằng guard.

## 5. Phụ thuộc / rủi ro

- **Auth vs User**: tránh circular dependency — `AuthService` → `UsersService`; `UsersModule` không import `AuthModule` (chỉ `AuthModule` import `UserModule`).
- **Firebase**: verify ID token ở `FirebaseAdminService` / `AuthService`, map `firebase_id` → user — chi tiết [auth basic](../auth/basic-design.md).
- **Permission trong JWT**: nếu danh sách lớn, cân nhắc chỉ đưa `roles` trong token và resolve permission từ DB/cache mỗi request — trade-off đã đề cập trong detail-design.

## 6. Kiểm thử gợi ý

- Seed có đủ role `admin`; tạo user gán `admin` → login → JWT có `permissions` khớp seed.
- `inactive` user → login 401/403.
- Gán role hợp lệ / roleId không tồn tại → 200 / 404 hoặc 422.
- Endpoint `POST /users` không admin → 403 (khi guard đã gắn).
