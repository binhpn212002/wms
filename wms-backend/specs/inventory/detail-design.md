# Tồn kho (inventory) — Detail design

## Tài liệu tham chiếu

- [Kế hoạch triển khai](./plan.md)
- [Basic design](./basic-design.md)
- [Kho & vị trí — basic design](../warehouses/basic-design.md)
- [Sản phẩm — detail design](../products/detail-design.md)
- [Nhập kho — basic design](../inbound/basic-design.md)
- [Xuất kho — basic design](../outbound/basic-design.md)
- [Xuất kho — detail design](../outbound/detail-design.md)
- [Chuyển kho — basic design](../transfers/basic-design.md)

## Phạm vi MVP

- **Tồn tức thời** (`stock_balances`): một dòng cho mỗi tổ hợp `(warehouse_id, location_id, variant_id)` với `quantity >= 0` (đơn vị = UoM mặc định của sản phẩm — `products.default_uom_id`).
- **Nhật ký thay đổi** (`inventory_movements`): mỗi lần cộng/trừ tồn ghi **một hoặc nhiều** dòng ledger kèm **tham chiếu chứng từ** + **loại nghiệp vụ**; không sửa/xóa ledger sau khi ghi (sửa sai = chứng từ điều chỉnh / phiếu ngược — sau MVP).
- **Không** CRUD tay trên bảng tồn từ API inventory; mọi ghi đến từ service **Inbound / Outbound / Transfer** (và **Adjustment** nếu bật sau).

## Mô hình dữ liệu

### Bảng `stock_balances`

Tồn “snapshot” để đọc nhanh và khóa khi complete phiếu.

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `warehouse_id` | UUID (FK → `warehouses.id`) | Có | Kho |
| `location_id` | UUID (FK → `locations.id`) | Có | Vị trí (MVP: nên là **vị trí lá** / bin — thống nhất [warehouses basic](../warehouses/basic-design.md)) |
| `variant_id` | UUID (FK → `product_variants.id`) | Có | Biến thể — định danh thống nhất với chứng từ ([products detail](../products/detail-design.md)) |
| `quantity` | decimal numeric | Có | `>= 0`; scale theo chính sách dự án (vd. 4 chữ số thập phân) |
| `updated_at` | timestamptz | Có | Cập nhật mỗi khi quantity đổi |

**Khóa & index gợi ý**

- **PK** hoặc **UNIQUE** `(warehouse_id, location_id, variant_id)` — một dòng duy nhất cho mỗi ô + SKU.
- **CHECK** `quantity >= 0`.
- Index phụ: `(warehouse_id, variant_id)` cho tổng tồn theo kho; `(location_id)` cho quét theo ô; `(variant_id)` cho báo cáo theo SKU.

**FK & quy tắc nghiệp vụ**

- `variant_id` → `product_variants.id` — variant **chưa xóa mềm** và hợp lệ khi phát sinh tồn (đồng bộ products).
- `location_id` → `locations.id` — vị trí thuộc đúng `warehouse_id` (nếu bảng `locations` có `warehouse_id`, enforce bằng validate application hoặc trigger; không cho cross-warehouse).
- Dòng balance **có thể không tồn tại** cho tổ hợp chưa từng có tồn: khi đọc, coi `quantity = 0` (hoặc upsert khi dòng đầu tiên > 0 — team chọn một; khuyến nghị **upsert khi phát sinh** để index và lock rõ ràng).

### Bảng `inventory_movements` (ledger)

Ghi **lịch sử** thay đổi; là nguồn đối soát với chứng từ.

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|--------|
| `id` | UUID (PK) | Có | Khóa dòng ledger |
| `warehouse_id` | UUID (FK → `warehouses.id`) | Có | Kho (theo ngữ cảnh dòng: nguồn hoặc đích) |
| `location_id` | UUID (FK → `locations.id`) | Có | Vị trí tương ứng |
| `variant_id` | UUID (FK → `product_variants.id`) | Có | Biến thể |
| `quantity_delta` | decimal numeric | Có | **Dương** = nhập vào ô này; **âm** = xuất khỏi ô này |
| `movement_type` | enum / string | Có | Ví dụ: `INBOUND_RECEIPT`, `OUTBOUND_ISSUE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT` — thống nhất mã trong code |
| `reference_type` | string | Có | Loại chứng từ: `inbound`, `outbound`, `transfer`, `adjustment` (khớp module) |
| `reference_id` | UUID | Có | Id phiếu (header) |
| `reference_line_id` | UUID, nullable | Không | Id dòng phiếu (nếu có) — hỗ trợ truy vết theo dòng |
| `created_at` | timestamptz | Có | Thời điểm ghi nhận |

**Quy tắc**

- **Immutable**: không `UPDATE`/`DELETE` dòng ledger sau khi insert (trừ tooling admin có audit riêng).
- Tổng `quantity_delta` theo `(warehouse_id, location_id, variant_id)` theo thời gian + trạng thái ban đầu = `quantity` hiện tại trên `stock_balances` (nếu duy trì balance từ ledger) — MVP khuyến nghị **cập nhật balance trực tiếp trong transaction** cùng insert ledger để tránh drift.
- **Transfer**: tạo **hai** dòng ledger (hoặc một dòng pair): `TRANSFER_OUT` tại nguồn (`quantity_delta < 0`), `TRANSFER_IN` tại đích (`quantity_delta > 0`) trong **một transaction** với cập nhật hai balance.

**Index gợi ý**

- `(reference_type, reference_id)` — liệt kê movement theo phiếu.
- `(variant_id, created_at)` — lịch sử theo SKU.
- `(warehouse_id, created_at)` — theo kho.

## Quy tắc nghiệp vụ

1. **Cập nhật tồn**

   - Chỉ trong transaction cùng **ghi ledger** + **cập nhật/upsert `stock_balances`**.
   - Trước khi trừ (xuất / chuyển nguồn): đọc balance (hoặc 0 nếu chưa có dòng), kiểm tra `available >= qty` (có thể trừ khả dụng từ `quantity` trừ reserve sau này — MVP chỉ `quantity`).
   - **Khóa**: `SELECT ... FOR UPDATE` trên dòng `stock_balances` tương ứng (theo thứ tự khóa cố định trên nhiều dòng để tránh deadlock — vd. sort `(warehouse_id, location_id, variant_id)`).

2. **Đơn vị tính**

   - `quantity` / `quantity_delta` luôn theo **`products.default_uom_id`** của sản phẩm chứa variant; không đổi UoM trên bảng tồn trong MVP.

3. **Vị trí**

   - Ghi nhận tồn chỉ tại `location_id` hợp lệ; ưu tiên validate `type = bin` (hoặc flag `is_leaf`) nếu schema locations có — khớp [warehouses](../warehouses/basic-design.md).
   - Nhập nhanh: nếu UI không chọn ô, service inbound lấy `warehouses.default_location_id` (phải thuộc đúng kho).

4. **Liên kết products**

   - Không tạo movement cho variant đã xóa mềm / không tồn tại; xóa variant khi còn tồn: **409** ([products detail](../products/detail-design.md)).

5. **API module inventory**

   - Chỉ đọc; không endpoint “set stock” cho user thường.

## API

Base path gợi ý: `/inventory` (prefix `/api/v1` nếu dự án dùng versioning). Field JSON kiểu **camelCase**; query tương ứng.

### `GET /inventory/balances`

- **Mục đích**: Danh sách dòng tồn chi tiết (phân trang).
- **Query (gợi ý)**:
  - `page`, `pageSize`.
  - `warehouseId`, `locationId`, `variantId`, `productId` (lọc qua join `product_variants.product_id`).
  - `q`: tìm theo SKU / mã sản phẩm (join products) — tùy triển khai.
  - `sort`: ví dụ `updatedAt`, `quantity`, `sku`.

**Response**: items gồm ít nhất `warehouseId`, `locationId`, `variantId`, `quantity`, `updatedAt`; có thể embed `sku`, `productName`, `warehouseCode`, `locationPath` (tùy performance).

### `GET /inventory/summary/by-product`

- **Mục đích**: Tổng `quantity` nhóm theo product / variant.
- **Query**: `warehouseId` (optional), `productId` (optional), phân trang nếu danh sách lớn.

### `GET /inventory/summary/by-warehouse`

- **Mục đích**: Tổng theo kho (và tùy chọn theo variant).
- **Query**: `warehouseId` (optional — nếu bỏ trống thì toàn hệ thống hoặc 403 tùy quyền).

### `GET /inventory/movements` (tùy chọn MVP)

- **Mục đích**: Audit trail theo thời gian / phiếu / SKU.
- **Query**: `variantId`, `warehouseId`, `referenceType`, `referenceId`, `from`, `to`, `page`, `pageSize`.

**404**: resource khác module (vd. warehouse id không tồn tại) — hoặc 200 + rỗng tùy chính sách list.

## Mã lỗi & HTTP (gợi ý)

| Tình huống | HTTP |
|------------|------|
| Thành công đọc danh sách / tổng hợp | 200 |
| Tham số query không hợp lệ | 422 |
| Không đủ quyền xem kho / báo cáo | 403 |
| `warehouseId` / `locationId` không tồn tại khi filter bắt buộc | 404 hoặc 422 (thống nhất dự án) |

Ghi tồn thiếu hàng / vi phạm FK thuộc **Inbound / Outbound / Transfer** (vd. **409** “insufficient stock”), không phải API read-only của inventory.

Payload lỗi: `code` + `message` đồng bộ [products detail](../products/detail-design.md).

## Ghi chú triển khai

- Cập nhật balance + insert movement trong **một transaction**; repository inbound/outbound/transfer gọi service inventory nội bộ (hoặc shared module) thay vì SQL rải rác.
- TypeORM: entity composite key hoặc surrogate `id` trên `stock_balances` — nếu dùng surrogate vẫn giữ unique `(warehouse_id, location_id, variant_id)`.
- Cân nhắc **materialized view** hoặc cache cho summary sau này; MVP có thể `SUM` + `GROUP BY` trực tiếp.

## Mở rộng sau MVP

- **Reservation** (giữ hàng cho outbound draft): cột `reserved_qty` hoặc bảng reserve; available = quantity − reserved.
- **Inventory adjustment** với approval workflow.
- **Đa UoM**: lưu thêm `uom_id` trên movement và quy đổi về base UoM.
- **Batch / serial**: bảng riêng gắn movement line.
- **Partials** cho `GET /balances` (chỉ field cần) và export CSV.
