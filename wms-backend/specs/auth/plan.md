# Kế hoạch triển khai — Auth (Firebase + JWT)

Quy trình tổ chức spec & code theo [plan.promt.md](../../promt/plan.promt.md). Tài liệu nghiệp vụ: [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md).

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Module NestJS | `auth` — đăng nhập Firebase, cấp JWT; `POST /auth/register` ủy quyền tạo user qua `UsersService` |
| Phụ thuộc | `UserModule` (export `UsersService` / repository) — **không** import ngược `AuthModule` từ `UserModule` để tránh vòng phụ thuộc |
| Phạm vi | Không lưu mật khẩu DB; role/permission đọc từ DB qua user — [user detail](../user/detail-design.md) |
| Base API | `/api/v1/auth/*` (prefix global trong `main.ts`) |

## 2. Mục tiêu MVP (theo detail-design)

- **Firebase Admin**: `FIREBASE_SERVICE_ACCOUNT_JSON` → verify ID token; chưa cấu hình → 503 `AUTH_FIREBASE_NOT_CONFIGURED`.
- **Đăng nhập**: `POST /auth/firebase` — resolve user (`firebase_id` hoặc liên kết SĐT/email lần đầu) → JWT `{ sub }` + body `AuthUser`.
- **JWT**: `JwtModule` + `JwtStrategy` — mỗi request có JWT → `getAuthUser(sub)`; user `inactive` → 401.
- **Guards dùng chung** (`src/common`): `JwtAuthGuard` (tôn trọng **`@Public()`**), `PermissionsGuard`, `@Permissions`, `@Public`, `@CurrentUser` — `POST /auth/firebase`: `@Public()`; `POST /auth/register`: `JwtAuthGuard` + `PermissionsGuard` + `user.create`.
- **Hằng lỗi**: `AUTH_*` trong [`error-code.constant.ts`](../../src/common/constants/error-code.constant.ts).

## 3. Cấu trúc thư mục (thực tế / mục tiêu)

Auth **không** có entity riêng; user/role/permission nằm `database/entities` (module user). Cấu trúc module `auth`:

```
src/
├── config/
│   ├── jwt.config.ts
│   └── firebase.config.ts
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── permissions.guard.ts
│   │   └── roles.guard.ts              # tùy chọn — API hiện ưu tiên @Permissions
│   ├── decorators/
│   │   ├── permissions.decorator.ts
│   │   ├── public.decorator.ts          # @Public() — bỏ qua JWT trong JwtAuthGuard
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   └── interfaces/
│       └── auth-user.interface.ts
└── modules/
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── services/
        │   ├── auth.service.ts
        │   └── firebase-admin.service.ts
        ├── strategies/
        │   └── jwt.strategy.ts
        └── dto/
            └── firebase-login.dto.ts
```

Logic **resolve user** khi login: [`users.service.ts`](../../src/modules/user/services/users.service.ts) (`resolveUserForFirebaseLogin`, `getAuthUser`).

## 4. Thứ tự / trạng thái công việc

1. **Cấu hình** `JwtModule.registerAsync`, `PassportModule`, `firebase` config — trong `AuthModule`.
2. **FirebaseAdminService** — init có điều kiện; `verifyIdToken`; `assertConfigured` trước khi verify.
3. **AuthService** — `loginWithFirebase`, `register` → delegate `UsersService`.
4. **JwtStrategy** — `validate(payload)` → `UsersService.getAuthUser`.
5. **AuthController** — `@Public()` + `POST /auth/firebase`; bảo vệ `POST /auth/register`.
6. **Đăng ký** `AuthModule` trong [`app.module.ts`](../../src/app.module.ts).

**Hàng chờ / mở rộng** (không bắt buộc MVP): đăng ký **`JwtAuthGuard`** làm **`APP_GUARD`** (toàn app) — các route đã có `@Public()` sẵn sàng; refresh token; thu gọn claim nếu permission list lớn (hiện load full từ DB mỗi request).

## 5. Kiểm thử gợi ý

- Không set Firebase JSON → `POST /api/v1/auth/firebase` → 503 + `AUTH_FIREBASE_NOT_CONFIGURED`.
- Token Firebase hợp lệ + user map được → 200 + `accessToken` + `user.permissions` khớp seed.
- Token sai / user không tồn tại / inactive → 401 + `AUTH_INVALID_CREDENTIALS`.
- `Authorization: Bearer` hợp lệ + inactive sau khi đã có JWT → 401 tại guard/strategy.

## 6. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [detail-design.md](./detail-design.md) | Endpoint, env, mã lỗi, file nguồn |
| [basic-design.md](./basic-design.md) | Luồng tổng quan, guards |
| [plan.promt.md](../../promt/plan.promt.md) | Quy tắc tạo `plan.md` theo module |
