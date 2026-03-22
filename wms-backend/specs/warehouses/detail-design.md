# Kho & vị trí (warehouses / locations) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Tồn kho — detail design](../inventory/detail-design.md)
- [Sản phẩm — detail design](../products/detail-design.md) (định danh `variant_id` trên chứng từ / tồn)

## Phạm vi MVP

- **Warehouse**: `code`, `name`, `address` (nullable), `active`, `default_location_id` (nullable); xóa mềm (`deleted_at`).
- **Location**: thuộc đúng một `warehouse_id`; cây trong kho qua `parent_id`; `type` ∈ { `zone`, `rack`, `bin` }; `code`, `name` (nullable); xóa mềm.
- **Tồn & chứng từ** chỉ dùng `location_id` trỏ tới vị trí `type = bin` — validate tại service Inbound / Outbound / Transfer và khi set `default_location_id`.

## Mô hình dữ liệu

### Bảng `warehouses`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `code` | string | Có | Mã kho nội bộ — **unique** trong các bản ghi **chưa xóa mềm** |
| `name` | string | Có | Tên hiển thị |
| `address` | text, nullable | Không | Địa chỉ vật lý / ghi chú địa điểm |
| `active` | boolean | Có | Mặc định `true`; `false` = không chọn cho phiếu **mới** (báo cáo / chứng từ cũ vẫn giữ tham chiếu) |
| `default_location_id` | UUID, nullable | Không | FK logic → `locations.id` — ô mặc định cho nhập nhanh; phải thuộc **cùng** `warehouses.id` và nên là `type = bin` |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial**: `(code)` **WHERE** `deleted_at IS NULL`.
- `(default_location_id)` nếu cần join ngược (thường không bắt buộc).

**FK & quy tắc**

- `default_location_id` → `locations.id` — khi set/cập nhật: location tồn tại, `deleted_at IS NULL`, `locations.warehouse_id = warehouses.id`, và `locations.type = 'bin'` (MVP).
- Xóa mềm / xóa cứng location đang là `default_location_id`: **SET NULL** trên `warehouses.default_location_id` (hoặc chặn xóa location — team chọn một; khuyến nghị **SET NULL** + log).

### Bảng `locations`

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa chính |
| `warehouse_id` | UUID (FK → `warehouses.id`) | Có | Kho sở hữu — mọi thao tác tồn phải khớp `warehouse_id` của dòng balance / header |
| `parent_id` | UUID, nullable | Không | FK → `locations.id` — cha trong cùng kho; `null` = gốc (vd. zone trực thuộc kho) |
| `type` | string / enum | Có | `zone` \| `rack` \| `bin` — **chỉ `bin`** được ghi `stock_balances` / `inventory_movements` trong MVP |
| `code` | string | Có | Mã vị trí — **unique** trong phạm vi `(warehouse_id)` cho bản ghi **chưa xóa mềm** |
| `name` | string, nullable | Không | Tên hiển thị |
| `deleted_at` | timestamptz, nullable | Không | Xóa mềm |
| `created_at` | timestamptz | Có | Audit |
| `updated_at` | timestamptz | Có | Audit |

**Index gợi ý**

- Unique **partial**: `(warehouse_id, code)` **WHERE** `deleted_at IS NULL`.
- `(warehouse_id)` — danh sách vị trí theo kho.
- `(parent_id)` — con trực tiếp của một nút.
- `(warehouse_id, type)` — lọc nhanh danh sách `bin` trong kho.

**FK & cây**

- `warehouse_id` → `warehouses.id` — on delete **CASCADE** hoặc **RESTRICT** tùy policy (CASCADE xóa hết location con khi xóa cứng kho — thường chỉ dùng khi không còn tồn/chứng từ; MVP thường **soft delete** kho).
- `parent_id` → `locations.id` — on delete **SET NULL** hoặc **RESTRICT**; nếu SET NULL, UI có thể cần gán lại cha.
- **Validate ứng dụng** (hoặc trigger): `parent.warehouse_id = child.warehouse_id`; không cho phép **chu trình** trong đồ thị cha-con.

**Liên kết inventory**

- `stock_balances.location_id`, `inventory_movements.location_id` → `locations.id` — xem [inventory detail](../inventory/detail-design.md).
- Không tạo balance tại `type ≠ bin` (reject 422 tại API chứng từ hoặc assert service inventory).

## Quy tắc nghiệp vụ

1. **`warehouses.code`**
   - Trim; độ dài / ký tự theo validator chung WMS.
   - Unique khi `deleted_at IS NULL`.

2. **`locations.code`**
   - Trim; unique per `warehouse_id` khi `deleted_at IS NULL`.

3. **`locations.type`**
   - Chỉ chấp nhận `zone` | `rack` | `bin` (chuẩn hóa lowercase khi lưu nếu dùng string).

4. **Tạo / sửa cây**
   - Gán `parent_id`: bản ghi cha phải cùng `warehouse_id`, `deleted_at IS NULL`.
   - Đổi `parent_id` (di chuyển nhánh): MVP **chỉ** khi không vi phạm policy tồn (vd. không đổi nếu đã có `stock_balances` tại bất kỳ descendant của nút — **409** hoặc cấm hẳn; thống nhất với [basic design](./basic-design.md)).

5. **`warehouses.default_location_id`**
   - Nullable; khi có giá trị: location phải thuộc kho đó, là `bin`, còn hiệu lực.
   - Inbound “nhập nhanh”: nếu không chọn ô, service lấy giá trị này; nếu null — **422** hoặc bắt buộc user chọn ô (thống nhất product).

6. **Xóa mềm `locations`**
   - **409** (hoặc 422) nếu còn `stock_balances.quantity > 0` tại location đó.
   - **409** nếu còn location con `deleted_at IS NULL` (phải xử lý con trước — hoặc cascade soft-delete tùy policy; MVP gợi ý: **chặn** khi còn con).
   - **409** nếu location là `warehouses.default_location_id` của kho nào đó — trước hết bỏ default hoặc đổi default.

7. **Xóa mềm `warehouses`**
   - **409** nếu còn tồn hoặc chứng từ chưa hoàn thành tham chiếu kho (policy chi tiết theo module inbound/outbound/transfer khi có).
   - Sau khi xóa mềm: không hiển thị trong chọn mới; báo cáo lịch sử vẫn đọc được qua id.

## API

Base path gợi ý: `/warehouses` (prefix global `/api/v1` nếu dự án dùng versioning). Field JSON **camelCase**.

### `GET /warehouses`

- **Mục đích**: Danh sách kho phân trang + lọc.
- **Query (gợi ý)**:
  - `page`, `pageSize`.
  - `q`: tìm theo `code`, `name`.
  - `active`: boolean.
  - `includeDeleted`: boolean (mặc định `false`, admin).
  - `sort`: ví dụ `code`, `name`, `createdAt`.

**Response**: items có `id`, `code`, `name`, `address`, `active`, `defaultLocationId`, `createdAt`, `updatedAt`.

### `POST /warehouses`

- **Body**: `code`, `name`, `address?`, `active?`, `defaultLocationId?` (hoặc tạo kho trước, tạo location bin sau rồi PATCH default — tùy luồng UI).
- **201** + bản ghi tạo; **422** validation; **409** trùng `code`.

### `GET /warehouses/:id`

- **200** một kho; **404** không tồn tại hoặc đã xóa mềm (trừ khi `includeDeleted` — tùy policy).

### `PATCH /warehouses/:id`

- Sửa `name`, `address`, `active`, `defaultLocationId` (không đổi `code` nếu team coi `code` là immutable sau tạo — thống nhất dự án).
- Validate `defaultLocationId` như mục quy tắc 5.

### `DELETE /warehouses/:id`

- Xóa mềm; **409** theo quy tắc 7.

### `GET /warehouses/:warehouseId/locations`

- **Mục đích**: Danh sách vị trí trong kho — **flat** (`parentId`, `type`, …) hoặc **tree** (`children` lồng — query param `view=tree|flat`).
- **Query**: `type`, `q` (code/name), `page`, `pageSize` nếu flat lớn, `includeDeleted`.

### `POST /warehouses/:warehouseId/locations`

- **Body**: `parentId?`, `type`, `code`, `name?`.
- **201**; **422** nếu `type` không hợp lệ hoặc `parentId` khác kho / không tồn tại.

### `GET /locations/:id` (tùy chọn)

- Chi tiết một vị trí (khi cần route ngắn không gắn `warehouseId`); vẫn validate thuộc kho theo quyền.

### `PATCH /locations/:id` | `DELETE /locations/:id`

- Sửa `name`, `parentId`, `code` (nếu cho phép), `type` (hạn chế nếu đã có tồn — **409**).
- Xóa mềm — quy tắc mục 6.

**404**: `warehouseId` / `locationId` không tồn tại hoặc không thuộc phạm vi quyền user.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Đọc / tạo / sửa thành công | 200 / 201 / 204 |
| Validation (body/query) | 422 |
| Trùng `code` kho hoặc `(warehouseId, code)` vị trí | 409 |
| Vi phạm ràng buộc cây, tồn tại con, còn tồn, default location | 409 |
| Không đủ quyền | 403 |
| Không tìm thấy | 404 |

Payload lỗi: `code` + `message` đồng bộ [products detail](../products/detail-design.md).

## Ghi chú triển khai

- Entity TypeORM: `Warehouse`, `Location` extend base audit + `deleted_at` — khớp [warehouse.entity.ts](../../src/database/entities/warehouse.entity.ts), [location.entity.ts](../../src/database/entities/location.entity.ts); `default_location_id` trên warehouse có thể không khai báo `ManyToOne` để tránh import vòng — validate ở service.
- Kiểm tra `bin` trước khi ghi tồn: gọi chung từ `InventoryStockService` hoặc helper `assertLocationForStock(warehouseId, locationId)`.

## Mở rộng sau MVP

- Cột `sort_order` / `path` materialized cho hiển thị cây nhanh.
- **Barcode** in tem vị trí; quét khi putaway.
- **Capacity** (max volume / weight) theo location.
- Cho phép tồn “tạm” tại zone (virtual) — đổi mô hình inventory.
