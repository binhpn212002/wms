# Kế hoạch triển khai — Tồn kho (inventory)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `inventory` |
| Phạm vi | `stock_balances` + `inventory_movements` (MVP theo [detail-design.md](./detail-design.md)); API **chỉ đọc**; ghi tồn qua service nội bộ gọi từ Inbound / Outbound / Transfer |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/inventory` (global prefix `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng **`stock_balances`**: khóa logic `(warehouse_id, location_id, variant_id)` — unique; `quantity` (decimal, `>= 0`); `updated_at`; FK → `warehouses`, `locations`, `product_variants`. Khuyến nghị **surrogate `id` (UUID)** + unique constraint ba cột (khớp TypeORM + `BaseEntity` nếu team dùng cho audit row).
- Bảng **`inventory_movements`**: ledger immutable — `quantity_delta`, `movement_type`, `reference_type`, `reference_id`, `reference_line_id` (nullable), `created_at`; FK tương tự balance.
- **Đọc**: `GET /inventory/balances`, `GET /inventory/summary/by-product`, `GET /inventory/summary/by-warehouse`; tùy chọn `GET /inventory/movements`.
- **Ghi**: không expose REST “set stock”; cung cấp **`InventoryStockService`** (hoặc tên tương đương) — method transaction: upsert/lock balance + insert movement; được `InboundModule` / `OutboundModule` / `TransfersModule` import (hoặc gói `@Global()` tùy kiến trúc — ưu tiên import có chủ đích).
- Enum / hằng: `movement_type` (`INBOUND_RECEIPT`, `OUTBOUND_ISSUE`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`…), `reference_type` (`inbound`, `outbound`, `transfer`, `adjustment`) — tập trung tại `common/constants/inventory.constant.ts` (hoặc `inventory-movement.enum.ts` trong module).
- HTTP (read): 200 / 403 / 422; payload lỗi `code` + `message` thống nhất WMS ([products detail](../products/detail-design.md)).

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + quy ước dự án)

```
src/
├── database/
│   └── entities/
│       ├── stock-balance.entity.ts
│       └── inventory-movement.entity.ts
├── common/
│   ├── constants/
│   │   └── inventory.constant.ts                 # tên bảng (nếu cần), movement_type, reference_type — tránh magic string
│   ├── repositories/
│   │   └── base.repository.ts                    # đã có — repository module kế thừa
│   └── exceptions/
│       └── inventory.exceptions.ts               # tùy chọn (403 không đủ quyền kho)
└── modules/
    └── inventory/
        ├── inventory.module.ts
        ├── inventory.controller.ts               # chỉ GET
        ├── services/
        │   ├── inventory.service.ts            # list balances, summaries, movements (query)
        │   └── inventory-stock.service.ts      # cập nhật balance + ghi ledger — export cho module chứng từ
        ├── repositories/
        │   ├── stock-balances.repository.ts    # find/lock/upsert theo khóa; aggregate summary
        │   └── inventory-movements.repository.ts # insert ledger; list audit
        └── dto/
            ├── list-balances-query.dto.ts
            ├── list-inventory-movements-query.dto.ts
            ├── summary-query.dto.ts              # by-product / by-warehouse (hoặc tách 2 file)
            ├── stock-balance-response.dto.ts
            ├── inventory-movement-response.dto.ts
            └── summary-response.dto.ts           # hoặc inline trong service — tùy payload
```

- **`stock_balances`**: không bắt buộc kế thừa full `BaseEntity` nếu không có `created_at` riêng trên spec — có thể chỉ `updated_at` + optional `id`; **`inventory_movements`**: `id` + `created_at` (immutable, không `updated_at` nếu không có trong spec).
- `TypeOrmModule.forFeature([StockBalance, InventoryMovement])` trong `InventoryModule`.
- **Ghi chú [plan.promt.md](../../promt/plan.promt.md)**: dự án mẫu có cả `modules/inventory/` và `modules/stock/` — MVP này gắn bảng tồn với module **`inventory`** theo spec; nếu sau này có module `stock` (vd. reservation), tách trách nhiệm rõ hoặc gộp — tránh hai nguồn sự thật cho cùng `stock_balances`.

## 4. Thứ tự công việc đề xuất

1. **Migration / entity**: tạo 2 bảng + index (unique triple; index `reference_type` + `reference_id`; index `variant_id`, `created_at`); CHECK `quantity >= 0` nếu DB hỗ trợ.
2. **Constants**: enum/string union `InventoryMovementType`, `InventoryReferenceType` (hoặc object frozen) trong `inventory.constant.ts`.
3. **Repositories**:
   - `StockBalancesRepository`: `findWithFilters` (join variant → product khi `productId`); `lockBalanceKeys` / `getOrCreateForUpdate` (transaction manager); raw query hoặc QueryBuilder cho `SUM` + `GROUP BY` summary.
   - `InventoryMovementsRepository`: `insert` batch; `findByFilters` cho GET movements.
4. **`InventoryStockService`**: method kiểu `applyDelta(params)` hoặc tách `receive` / `issue` / `transfer` — luôn trong **transaction**; `SELECT … FOR UPDATE` theo thứ tự khóa đã sort (tránh deadlock); outbound/transfer: kiểm tra đủ tồn trước khi trừ.
5. **`InventoryService`**: map DTO response (camelCase); phân quyền xem kho (guard/feature tùy dự án).
6. **DTO + `ValidationPipe`**; controller chỉ GET.
7. Đăng ký `InventoryModule` trong `app.module.ts`; **export** `InventoryStockService` để Inbound/Outbound/Transfer dùng khi các module đó được triển khai.

## 5. Phụ thuộc / rủi ro

- **Warehouses / locations**: bảng `locations` cần `warehouse_id` (hoặc tương đương) để validate “location thuộc kho” trước khi ghi balance — nếu chưa có entity migration, stub validate hoặc triển khai warehouse trước.
- **Products**: FK `variant_id` → `product_variants`; list balance cần join SKU/tên — phụ thuộc module products đã có.
- **Inbound / Outbound / Transfer**: ghi tồn chỉ khi complete phiếu — gọi `InventoryStockService` trong transaction của phiếu; thiếu tồn → **409** tại module xuất/chuyển, không tại GET inventory.
- **Concurrency**: test song song hai request complete cùng SKU/ô — đảm bảo không âm tồn.

## 6. Kiểm thử gợi ý

- `GET /inventory/balances` filter `warehouseId`, `productId` (qua variant), phân trang.
- Summary `by-product` / `by-warehouse` khớp tổng `SUM(quantity)` từ balances (cùng filter).
- (Integration, khi có `InventoryStockService` + fixture): nhập → balance tăng + 1 movement; xuất đủ/từng — trừ đúng; xuất vượt — 409; transfer — hai movement + hai balance cập nhật trong một transaction.
