# Firebase Admin — service account JSON

File JSON tải từ **Firebase Console → Project settings → Service accounts → Generate new private key**.

## Cách dùng với backend

1. Đặt file tại `wms-backend/credentials/` (ví dụ `firebase-adminsdk.json`).
2. Trong `wms-backend/.env` chỉ định đường dẫn tương đối từ thư mục backend:

   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON_FILE=./credentials/firebase-adminsdk.json
   ```

3. **Không** dán JSON nhiều dòng trực tiếp vào `.env` (dotenv sẽ sai; dễ gộp nhầm với biến khác như `FIREBASE_MEASUREMENT_ID`).

## Các cách khác (không dùng file)

- Một dòng minify: `FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}`
- Base64: `FIREBASE_SERVICE_ACCOUNT_JSON_B64=...` (xem `wms-backend/.env.example`)

## Bảo mật

- File `*.json` trong thư mục này được gitignore — không commit.
- Nếu key lộ, vào Firebase Console và **xoá / tạo lại** key service account.
