# Auth — Detail design

## Tài liệu tham chiếu

- [Auth — basic design](./basic-design.md) (mục tiêu, luồng MVP, guards tóm tắt)
- [Auth — plan](./plan.md) (kế hoạch triển khai, cấu trúc module — theo [plan.promt.md](../../promt/plan.promt.md))
- [User — role & permission](../user/detail-design.md) (bảng `users`, seed role/permission, `PermissionCode`)

Tài liệu này mô tả **triển khai chi tiết** (endpoint, cấu hình, mã lỗi, mapping file) khớp backend hiện tại; phần khái niệm nằm ở **basic design**.

## Phạm vi

- **Đăng nhập**: Firebase ID token → verify Admin SDK → map user → JWT.
- **JWT**: chỉ claim **`sub`** (UUID user); `AuthUser` (roles, permissions) lấy từ DB trong `JwtStrategy.validate` hoặc trong response login.
- **Không** lưu mật khẩu server-side; đổi mật khẩu qua Firebase.

## API (auth module)

Base path: **`/api/v1/auth`** (prefix global `api/v1` trong `main.ts`).

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| `POST` | `/api/v1/auth/firebase` | Public | Body `{ "idToken": string }` — verify Firebase token, resolve user, trả `{ accessToken, user }`. |
| `POST` | `/api/v1/auth/register` | JWT + `user.create` | Body [CreateUserDto](../../src/modules/user/dto/create-user.dto.ts) — tạo user (admin); có thể kèm `firebaseId`. |

### Response đăng nhập (`POST /api/v1/auth/firebase`)

- **`accessToken`**: JWT, payload `{ sub: <user id> }`.
- **`user`**: `AuthUser` — `{ userId, username, roles: string[], permissions: string[] }` (mã role/permission từ DB).

## Luồng resolve user sau khi verify Firebase token

1. Tìm user theo **`firebase_id` = UID** trong token.
2. Nếu không có: duyệt user có **`firebase_id` null**, so khớp **SĐT** (`phone_number` trong token ↔ `users.phone`, chuẩn hóa số) hoặc **email** (token ↔ `users.email`).
3. Khớp → cập nhật `firebase_id` (liên kết lần đầu).
4. User **`inactive`** hoặc không tìm/liên kết được → **`AUTH_INVALID_CREDENTIALS`** (401).

Chi tiết: `UsersService.resolveUserForFirebaseLogin`, `tryLinkFirebaseUser`.

## JWT

| Hạng mục | Giá trị / ghi chú |
|----------|-------------------|
| Ký / verify | `@nestjs/jwt` + Passport `jwt` strategy |
| Payload ký | `{ sub: user.id }` |
| Header client | `Authorization: Bearer <accessToken>` |
| Secret | `JWT_SECRET` (fallback dev trong `jwt.config.ts`) |
| Hết hạn | `JWT_EXPIRES_IN` (mặc định `7d`) |
| Sau verify | `JwtStrategy.validate` → `getAuthUser(sub)` — user `inactive` → 401 |

## Firebase Admin

| Hạng mục | Giá trị / ghi chú |
|----------|-------------------|
| Biến môi trường | `FIREBASE_SERVICE_ACCOUNT_JSON` — JSON service account (một dòng hoặc escape đúng) |
| Khởi tạo | `FirebaseAdminService.onModuleInit` — không set JSON → Admin không init, log cảnh báo |
| Chưa cấu hình khi gọi `/auth/firebase` | **503**, `code`: **`AUTH_FIREBASE_NOT_CONFIGURED`** |
| Token không verify được | **401**, `code`: **`AUTH_INVALID_CREDENTIALS`** |

## Mã lỗi (auth)

| `code` | HTTP | Khi nào |
|--------|------|---------|
| `AUTH_FIREBASE_NOT_CONFIGURED` | 503 | Thiếu / lỗi init Firebase Admin |
| `AUTH_INVALID_CREDENTIALS` | 401 | ID token sai/hết hạn; không map được user; user inactive tại login |

Các mã user (409 trùng username/phone/firebase, v.v.) áp dụng cho `POST /auth/register` / user API — xem [user detail](../user/detail-design.md).

## Guards & decorator (tóm tắt triển khai)

- Route cần đăng nhập: `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions(...)` khi cần quyền.
- **`@Public()`** — `SetMetadata(IS_PUBLIC_KEY, true)`. Khi handler/class có decorator này, **`JwtAuthGuard`** trả `true` mà **không** yêu cầu Bearer token (phục vụ đăng ký guard global sau này). **`POST /api/v1/auth/firebase`** gắn `@Public()` trong code.
- Route không dùng JWT global: có thể chỉ “không gắn guard” trên handler; `@Public()` vẫn nên gắn để thống nhất ý đồ và tránh lỗi khi bật `APP_GUARD`.

Chi tiết semantics: [basic design](./basic-design.md) § Phân quyền & tích hợp; bảng role/permission: [user detail](../user/detail-design.md).

## Gợi ý file nguồn (backend)

| Khu vực | File |
|---------|------|
| Controller | `src/modules/auth/auth.controller.ts` |
| Login / register service | `src/modules/auth/services/auth.service.ts` |
| Firebase Admin | `src/modules/auth/services/firebase-admin.service.ts` |
| JWT strategy | `src/modules/auth/strategies/jwt.strategy.ts` |
| DTO login | `src/modules/auth/dto/firebase-login.dto.ts` |
| JWT config | `src/config/jwt.config.ts` |
| Firebase config | `src/config/firebase.config.ts` |
| Guards | `src/common/guards/jwt-auth.guard.ts`, `permissions.guard.ts` |
| Decorators | `src/common/decorators/permissions.decorator.ts`, `public.decorator.ts` (`@Public`), `current-user.decorator.ts` |
| `AuthUser` | `src/common/interfaces/auth-user.interface.ts` |
| Resolve user + `getAuthUser` | `src/modules/user/services/users.service.ts` |
