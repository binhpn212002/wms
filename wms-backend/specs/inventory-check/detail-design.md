# Check hàng tồn (inventory check) — Detail design

## Tài liệu tham chiếu

- [Basic design](./basic-design.md)
- [Tồn kho — detail design](../inventory/detail-design.md) (`stock_balances`, UoM, không ghi tồn qua read API)
- [Kho & vị trí — detail design](../warehouses/detail-design.md)
- [Sản phẩm — detail design](../products/detail-design.md) (`product_variants`, `deleted_at`)
- [Biến thể sản phẩm — detail design](../product-variants/detail-design.md) (SKU/barcode, không lưu `currentQuantity` trên variant)

## Phạm vi MVP

- **Chỉ đọc**: tra cứu tồn từ `stock_balances` + join master-data (`product_variants`, `products`, `warehouses`, `locations`).
- **Hai endpoint**:
  - `GET /inventory-check/lookup` — theo `q` (SKU hoặc barcode).
  - `GET /inventory-check/variants/:variantId` — theo id biến thể.
- **Hai chế độ** (`mode`):
  - `summary`: cộng `SUM(quantity)` theo variant (và tùy filter kho).
  - `details`: trả từng dòng `(warehouseId, locationId, variantId)` có `quantity > 0` (hoặc trả cả dòng 0 nếu policy — MVP khuyến nghị **chỉ dòng > 0** để gọn).
- **Không** bảng mới; **không** insert/update `stock_balances` / `inventory_movements` từ module này.

## Mô hình dữ liệu (logical)

Không thêm bảng. Nguồn chính:

| Nguồn | Vai trò |
|--------|--------|
| `stock_balances` | `quantity` theo `(warehouse_id, location_id, variant_id)` — xem [inventory detail](../inventory/detail-design.md) |
| `product_variants` | `sku`, `barcode`, `product_id`, `deleted_at` |
| `products` | `code`, `name`, `default_uom_id` (hiển thị / đơn vị) |
| `warehouses` | Mã/tên kho, `deleted_at` |
| `locations` | Mã/tên vị trí, `warehouse_id`, loại vị trí (bin) |

**Join tối thiểu cho lookup**

- `stock_balances` → `product_variants` ON `variant_id`
- `product_variants` → `products` ON `product_id`
- `stock_balances` → `warehouses`, `locations` khi cần hiển thị hoặc validate filter.

**Quy ước số học**

- `quantity` trong DB: decimal (vd. scale 4) — JSON trả về **number** (hoặc string decimal nếu project đồng bộ TypeORM; MVP khuyến nghị **number** sau khi parse an toàn).
- Làm tròn hiển thị theo UI; API giữ đủ precision theo policy chung inventory.

## Quy tắc nghiệp vụ

### 1. Khớp `q` (SKU / barcode)

- **Trim** whitespace đầu cuối.

- **Phạm vi tìm variant** (đề xuất MVP):
  - Chỉ variant có `product_variants.deleted_at IS NULL`.
  - Khớp **một trong hai** (OR):
    - `sku` **bằng** `q` (sau trim), hoặc
    - `barcode` **bằng** `q` khi `barcode IS NOT NULL`.

- **Phân biệt hoa thường** (thống nhất dự án):
  - Khuyến nghị: **case-sensitive** cho SKU/barcode (tránh chồng lấn dữ liệu).
  - Nếu nghiệp vụ yêu cầu quét tay không phân biệt: dùng `ILIKE` / `lower()` **có index hỗ trợ** hoặc chấp nhận sequential scan trên volume nhỏ — ghi rõ trong implement.

- **Nhiều kết quả** (cùng `q` khớp nhiều variant — hiếm nếu SKU unique toàn hệ thống; có thể xảy ra nếu policy barcode không unique):

  - Trả `items[]` với **nhiều phần tử**, mỗi phần tử một `variantId`.
  - Nếu team muốn 1-1: có thể 409 `AMBIGUOUS_LOOKUP` — không khuyến nghị cho UX quét barcode; ưu tiên list + UI chọn.

- **Không tìm thấy variant**: `200` với `items: []` (quét kho) **hoặc** `404 NOT_FOUND` — **chọn một** và thống nhất toàn API. Khuyến nghị MVP **`200` + rỗng** cho `lookup` để UI không mix lỗi mạng với “hết hàng”.

### 2. Filter `warehouseId` / `locationId`

- **Cả hai optional**. Không gửi → không giới hạn kho/vị trí (sau filter phân quyền — mục 4).

- **`warehouseId` có**:
  - Phải tồn tại `warehouses.id` và (khuyến nghị) `deleted_at IS NULL` — nếu không: **404** `NOT_FOUND` hoặc **422** `INVALID_WAREHOUSE` (thống nhất với [inventory detail](../inventory/detail-design.md)).

- **`locationId` có**:
  - Phải tồn tại `locations.id`, chưa xóa mềm (nếu có).
  - **Bắt buộc** `locations.warehouse_id === warehouseId` khi cả hai có trong request; nếu chỉ có `locationId`: suy ra `warehouseId` từ location để filter balance (hoặc bắt buộc client gửi cả hai — MVP khuyến nghị **cho phép chỉ `locationId`** và nội bộ join để lấy `warehouse_id`).

- Dòng balance không tồn tại: coi `quantity = 0`; với `mode=summary` vẫn có thể trả item với `quantity: 0` nếu variant tồn tại — tùy UX. MVP mặc định:
  - `summary`: trả **một** item cho mỗi variant khớp `q`, `quantity` = tổng balance (có thể 0).
  - `details`: chỉ các dòng `stock_balances.quantity > 0` (gọn); nếu tổng 0 thì `lines: []`.

### 3. `mode`

| Giá trị | Ý nghĩa | SQL gợi ý |
|---------|---------|-----------|
| `summary` | Một bản ghi tổng hợp / variant (và kho nếu cần tách) | `SUM(sb.quantity) GROUP BY variant_id` (+ `warehouse_id` nếu UI muốn breakdown theo kho trong cùng response) |
| `details` | Danh sách theo từng ô | `SELECT sb.*` join master, filter, `sb.quantity > 0`, sort `warehouse`, `location`, `sku` |

**Breakdown theo kho trong `summary`** (tùy chọn triển khai):

- Trường `breakdownByWarehouse[]` mỗi phần tử `{ warehouseId, quantity }` để UI một lần gọi biết tồn từng kho — tránh N lần gọi. Nếu không làm MVP: client gọi thêm với `warehouseId` lần lượt.

### 4. Phân quyền

- User chỉ thấy tồn tại **kho được cấp** (role / bảng map user–warehouse sau này).
- Áp filter **sau** parse query: intersection giữa `warehouseId` (nếu có) và tập kho cho phép.
- Nếu `warehouseId` yêu cầu ngoài phạm vi: **403** `FORBIDDEN` (không tiết lộ tồn kho khác).

### 5. `variants/:variantId`

- Variant phải tồn tại và `deleted_at IS NULL`; nếu không: **404** `NOT_FOUND`.
- Payload giống một phần tử của `lookup` (một variant), cùng query `warehouseId`, `locationId`, `mode`.

## API

Global prefix: `/api/v1`. JSON field **camelCase**. Chỉ **GET**.

### `GET /inventory-check/lookup`

#### Query

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|--------|
| `q` | string | Có | SKU hoặc barcode (sau trim) |
| `warehouseId` | uuid | Không | Lọc theo kho |
| `locationId` | uuid | Không | Lọc theo vị trí |
| `mode` | enum | Không | `summary` \| `details`, default `summary` |
| `page` | int | Không | Chỉ áp khi danh sách variant > 1 và cần phân trang (hiếm); default 1 |
| `pageSize` | int | Không | Default 20, max 100 |

#### Response `200` — `mode=summary`

```json
{
  "items": [
    {
      "variantId": "uuid-variant",
      "productId": "uuid-product",
      "sku": "TSHIRT-RED-M",
      "barcode": "8931234567890",
      "product": {
        "id": "uuid-product",
        "code": "TSHIRT",
        "name": "Áo thun"
      },
      "quantity": 125.5,
      "defaultUomId": "uuid-uom",
      "breakdownByWarehouse": [
        { "warehouseId": "uuid-wh-1", "code": "HN", "name": "Hà Nội", "quantity": 100 },
        { "warehouseId": "uuid-wh-2", "code": "HCM", "name": "Hồ Chí Minh", "quantity": 25.5 }
      ]
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1
}
```

- `breakdownByWarehouse`: **optional** trong MVP; nếu không triển khai, omit key.

#### Response `200` — `mode=details`

```json
{
  "items": [
    {
      "variantId": "uuid-variant",
      "productId": "uuid-product",
      "sku": "TSHIRT-RED-M",
      "barcode": "8931234567890",
      "product": {
        "id": "uuid-product",
        "code": "TSHIRT",
        "name": "Áo thun"
      },
      "lines": [
        {
          "warehouseId": "uuid-wh-1",
          "warehouse": { "id": "uuid-wh-1", "code": "HN", "name": "Hà Nội" },
          "locationId": "uuid-loc-bin-a",
          "location": { "id": "uuid-loc-bin-a", "code": "A-01-03", "name": "Bin A-01-03" },
          "quantity": 40,
          "balanceUpdatedAt": "2026-04-03T10:00:00.000Z"
        }
      ],
      "quantity": 125.5
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1
}
```

- `quantity` ở cấp item: tổng các `lines` (tiện UI).
- `lines`: chỉ `quantity > 0`.

#### Lỗi

| HTTP | code (gợi ý) | Khi |
|------|----------------|-----|
| 422 | `VALIDATION_ERROR` | `q` rỗng sau trim; `mode` sai; `pageSize` vượt max |
| 403 | `FORBIDDEN` | Không được xem `warehouseId` / ngoài phạm vi kho |
| 404 | `NOT_FOUND` | `warehouseId` hoặc `locationId` không tồn tại (nếu policy coi filter sai là lỗi) |

Payload lỗi thống nhất [products detail](../products/detail-design.md) (`code`, `message`).

---

### `GET /inventory-check/variants/:variantId`

#### Path

- `variantId`: UUID.

#### Query

Giống `lookup` trừ không có `q`: `warehouseId?`, `locationId?`, `mode?`.

#### Response `200`

Một object **đơn** (không bọc `items` pagination), hoặc cùng shape với một phần tử `items[0]` của `lookup` — team chọn một. Khuyến nghị:

```json
{
  "variantId": "uuid-variant",
  "productId": "uuid-product",
  "sku": "TSHIRT-RED-M",
  "barcode": "8931234567890",
  "product": { "id": "uuid-product", "code": "TSHIRT", "name": "Áo thun" },
  "quantity": 125.5,
  "defaultUomId": "uuid-uom",
  "lines": []
}
```

- Khi `mode=summary`: `lines` = `[]` hoặc omit.
- Khi `mode=details`: `lines` như trên.

#### Lỗi

| HTTP | code | Khi |
|------|------|-----|
| 404 | `NOT_FOUND` | Variant không tồn tại hoặc đã xóa mềm |
| 422 / 403 | (như lookup) | Filter không hợp lệ / không đủ quyền |

## Mối quan hệ với `GET /inventory/balance*`

Module [inventory](../inventory/detail-design.md) đã có `GET /inventory/balances` và summary. **Inventory-check** là lớp use-case:

- Tối ưu cho **quét SKU/barcode** + embed product tối thiểu.
- Tránh trùng logic: service có thể gọi chung repository/query builder với `list balances` (DRY).

## Ghi chú triển khai (NestJS)

- Đặt route trong `InventoryModule` (`InventoryController` prefix `inventory-check`) hoặc `InventoryCheckController` import cùng module — tránh hai `TypeOrmModule` trùng entity.
- DTO: `InventoryCheckLookupQueryDto`, `InventoryCheckVariantQueryDto` (class-validator).
- Repository: method `findVariantsBySkuOrBarcode(q)`, `aggregateBalancesByVariant(...)`, `listBalanceLinesForVariants(...)`.
- Test: variant không tồn tại; tồn 0; hai kho; filter location; 403 warehouse.

## Mở rộng sau MVP

- `POST /inventory-check/lookup` body `{ skus: string[] }` hoặc `{ variantIds: uuid[] }`.
- Thêm `includeZero = true` cho `details`.
- Thêm `asOf` đọc ledger (không khuyến nghị nếu đã có balance snapshot).
