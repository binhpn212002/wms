# Thiết kế xác thực (auth) — Basic design



## Tài liệu tham chiếu



- [Auth — detail design](./detail-design.md) (API, cấu hình env, mã lỗi, file nguồn)

- [User — detail design](../user/detail-design.md) (bảng `users`, JWT, role/permission)



## Mục tiêu



Cung cấp **xác thực** cho WMS: **không lưu mật khẩu trong DB**. Đăng nhập qua **Firebase** (client xác thực Firebase → gửi **ID token** lên API); backend **verify** bằng Firebase Admin SDK, map **UID** → bản ghi `users.firebase_id`, sau đó cấp **JWT** (payload tối thiểu **`sub`** = `userId`) dùng chung cho API. **`roles` / `permissions`** trên `request.user` và trong body đăng nhập do **load từ DB** trong `JwtStrategy.validate` — đồng bộ [user detail](../user/detail-design.md).



## Luồng đăng nhập (MVP)



| Điều kiện trên `users` | Cách xác thực |

|-------------------------|----------------|

| `firebase_id` **trùng UID** từ token đã verify | `POST /auth/firebase` với `idToken` → verify token → tìm user theo `firebase_id` → cấp JWT |



- User **phải** được tạo trước (vd. `POST /auth/register` với quyền `user.create`) và **gán `firebaseId`** (UID Firebase) để lần đăng nhập đầu khớp UID.

- **Không** có cột `password_hash` / hash mật khẩu cục bộ trên server.

- Đổi mật khẩu: thực hiện phía **Firebase** (client / console); backend không có endpoint đổi mật khẩu lưu DB.



## Cấu trúc dữ liệu (rút gọn — chi tiết bảng xem [user detail](../user/detail-design.md))



**Bảng `users` (liên quan auth):**  

- `username` (unique), `phone` (unique) — định danh trong hệ thống  

- **`firebase_id` (nullable, unique khi có)** — UID Firebase; bắt buộc có giá trị để đăng nhập bằng `POST /auth/firebase`  

- `status` (`active` / `inactive`) — `inactive` không cấp JWT  

- Phân quyền: role/permission theo [user detail](../user/detail-design.md) (seed).



**Cấu hình backend:** biến môi trường `FIREBASE_SERVICE_ACCOUNT_JSON` — JSON service account (một dòng hoặc escape đúng) để khởi tạo Firebase Admin. Nếu thiếu, `POST /auth/firebase` trả **503** với mã `AUTH_FIREBASE_NOT_CONFIGURED`.



## Luồng chính & API (auth / user)



- Đăng nhập **Firebase**: `POST /auth/firebase` — body `{ "idToken": "<Firebase ID token>" }` → JWT  

- Đăng ký / tạo user (admin): `POST /auth/register` — body có thể gồm `firebaseId` để liên kết UID — xem [user detail](../user/detail-design.md)  

- Profile: `GET /users/me` (JWT)



## Phân quyền & tích hợp



- Trên route **có bảo vệ**: gắn **`JwtAuthGuard`** (xác thực JWT) và khi cần kiểm tra quyền thêm **`PermissionsGuard`** cùng decorator **`@Permissions(...)`**.

- **`JwtAuthGuard`** — `AuthGuard('jwt')` (Passport). Đọc token **`Authorization: Bearer <JWT>`**; **`JwtStrategy`** verify bằng `jwt.secret`, payload tối thiểu `{ sub: userId }`, rồi **`validate()`** gọi `UsersService.getAuthUser(sub)` → gắn **`request.user`** kiểu **`AuthUser`** (`userId`, `username`, `roles[]`, **`permissions[]`**).

- **`PermissionsGuard`** — Đọc metadata từ **`@Permissions('code1', 'code2', ...)`** (key `permissions`). Nếu **không** có permission nào được yêu cầu trên handler/class → **cho qua**. Nếu có → user phải có **đủ tất cả** mã permission đó (`required.every` trên `user.permissions`); thiếu → **403 Forbidden**. Mã permission dùng hằng **`PermissionCode`** (seed) — xem [user detail](../user/detail-design.md).

- **`@Permissions(...codes)`** — Khai báo permission **bắt buộc** cho route (hoặc áp cả class nếu gắn trên controller). **Không** thay thế JWT: luôn cần user đã qua `JwtAuthGuard` (trừ route public).

- **`@Public()`** — Metadata `isPublic` = true. **`JwtAuthGuard`** kiểm tra: nếu handler hoặc class có `@Public()` → **bỏ qua** xác thực JWT (cho phép gọi không có Bearer). Dùng cho **`POST /api/v1/auth/firebase`** và mọi endpoint công khai. Khi **`JwtAuthGuard` chỉ gắn từng route** (không global), route không gắn guard vẫn public — `@Public()` ghi nhận ý đồ và **bắt buộc** khi chuyển sang **`APP_GUARD` + `JwtAuthGuard` toàn app**.

- Decorator **`@CurrentUser()`** — Lấy field từ `request.user` (sau JWT), ví dụ `@CurrentUser('userId')`.



## Thiết kế code mẫu (NestJS style)



**Guards + permission trên route (ví dụ):**

```ts

@Post('register')

@UseGuards(JwtAuthGuard, PermissionsGuard)

@Permissions(PermissionCode.USER_CREATE)

register(@Body() dto: CreateUserDto) { /* ... */ }

```

**Route public — `@Public()` + `JwtAuthGuard` (global hoặc từng route):**

```ts

@Public()

@Post('firebase')

loginWithFirebase(@Body() dto: FirebaseLoginDto) { /* ... */ }

```



```ts

// entity/user.entity.ts — không có password_hash

@Entity('users')

export class UserEntity {

  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true }) username: string;

  @Column({ nullable: true }) firebaseId: string;

  @Column({ nullable: true }) dob: string;

  @Column({ nullable: true }) email: string;

  @Column({ nullable: true }) phone: string;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;

}

```



## Tổng kết



- **Auth**: JWT sau khi verify Firebase ID token; **không** lưu mật khẩu trong DB.

- Bảo mật: verify token server-side; **`JwtAuthGuard`** + **`PermissionsGuard`** + **`@Permissions()`**; route công khai: **`@Public()`** (và không gắn guard trên handler nếu chưa dùng JWT global). Chi tiết permission/seed: [user detail](../user/detail-design.md).

- Endpoint `/api/v1/auth/...`, biến môi trường, mã lỗi, file nguồn: [auth detail](./detail-design.md).

