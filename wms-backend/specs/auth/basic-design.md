# Thiết kế xác thực (auth) — Basic design

## Tài liệu tham chiếu

- [User — detail design](../user/detail-design.md) (bảng `users`, JWT, role/permission)

## Mục tiêu

Cung cấp **xác thực** cho WMS: **không lưu mật khẩu trong DB**. Đăng nhập qua **Firebase** (client xác thực Firebase → gửi **ID token** lên API); backend **verify** bằng Firebase Admin SDK, map **UID** → bản ghi `users.firebase_id`, sau đó cấp **JWT** dùng chung cho API (claim `userId`, roles, permissions — đồng bộ [user detail](../user/detail-design.md)).

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

- Trên mọi request có bảo vệ: **JWT** → `JwtStrategy` load user + roles + permissions từ DB (hoặc payload tối thiểu `sub` + load lại).
- Decorator `@CurrentUser()` lấy user hiện tại truyền vào controller/service.
- `@Roles(...)` / `@Permissions(...)` + guard tương ứng — chi tiết [user detail](../user/detail-design.md).

## Thiết kế code mẫu (NestJS style)

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
- Bảo mật: verify token server-side; guard/permission theo [user detail](../user/detail-design.md).
