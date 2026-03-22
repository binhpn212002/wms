# Kế hoạch triển khai — Xuất kho (outbound)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `outbound` |
| Phạm vi | `outbound_documents` + `outbound_lines`; hoàn tất phiếu gọi `InventoryStockService.applyDelta` với **delta âm** trong **một transaction** ([detail-design.md](./detail-design.md)) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/outbound` (global prefix `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng **`outbound_documents`**: `document_no`, `document_date`, `warehouse_id`, `status` (`draft` \| `confirmed` \| `completed` hoặc rút gọn `draft` \| `completed`), `reason`, `notes`, `deleted_at`, audit; **không** `supplier_id`; unique `document_no` theo quy ước dự án.
- Bảng **`outbound_lines`**: `outbound_document_id`, `line_no`, `variant_id`, `quantity` (> 0), `location_id` (ô **nguồn**, bin, đúng kho phiếu) — **bắt buộc** trên mỗi dòng; không dùng `default_location_id` làm nguồn.
- **Complete**: lock phiếu → đọc dòng → validate warehouse / location (bin + cùng kho) / variant → sort khóa `(warehouse_id, location_id, variant_id)` → trong transaction: với từng dòng (theo thứ tự khóa đã sort) gọi `InventoryStockService.applyDelta(..., manager)` với `quantityDelta` **âm** (theo số lượng dòng), `movementType = OUTBOUND_ISSUE`, `referenceType = OUTBOUND`, `referenceId` = id phiếu, `referenceLineId` = id dòng — tái sử dụng [`inventory-stock.service.ts`](../../src/modules/inventory/services/inventory-stock.service.ts) (truyền `EntityManager` để không lồng transaction).
- **Validate** (`POST .../validate`): cùng logic kiểm tra tồn (đủ `stock_balances`) **không** ghi balance/movement, **không** đổi `status`.
- **Không** sửa/xóa header & dòng sau `completed`; xóa mềm chỉ khi `draft` (nếu bật DELETE).
- Enum / hằng: trạng thái phiếu — `common/constants/outbound.constant.ts`; `movement_type` / `reference_type` tái sử dụng [`inventory.constant.ts`](../../src/common/constants/inventory.constant.ts) (`InventoryMovementType.OUTBOUND_ISSUE`, `InventoryReferenceType.OUTBOUND`).
- HTTP: 200/201/404/409/422/403; payload lỗi `code` + `message` + map [`error-code.constant.ts`](../../src/common/constants/error-code.constant.ts); thiếu tồn: **`InsufficientStockException`** (đã có trong inventory) hoặc mã `INSUFFICIENT_STOCK` — thống nhất với inbound/outbound spec.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + quy ước dự án)

```
src/
├── database/
│   ├── entities/
│   │   ├── outbound-document.entity.ts
│   │   └── outbound-line.entity.ts
│   └── migrations/
│       └── xxxxx-create-outbound-tables.ts
├── common/
│   ├── constants/
│   │   └── outbound.constant.ts                # TABLE_*, OutboundDocumentStatus (hoặc enum tương đương)
│   ├── repositories/
│   │   └── base.repository.ts                  # đã có — repository outbound kế thừa nếu dùng pattern này
│   └── exceptions/
│       └── outbound.exceptions.ts              # tùy chọn: conflict status, duplicate document_no, already completed
└── modules/
    └── outbound/
        ├── outbound.module.ts
        ├── outbound.controller.ts
        ├── services/
        │   └── outbound.service.ts             # CRUD phiếu/dòng; validate(); complete() + transaction + applyDelta âm
        ├── repositories/
        │   ├── outbound-documents.repository.ts
        │   └── outbound-lines.repository.ts
        └── dto/
            ├── create-outbound.dto.ts
            ├── update-outbound.dto.ts
            ├── list-outbound-query.dto.ts
            ├── replace-outbound-lines.dto.ts
            ├── outbound-line-input.dto.ts
            ├── outbound-document-response.dto.ts
            └── outbound-line-response.dto.ts
```

- Entity kế thừa [`shared/base.entity.ts`](../../src/shared/base.entity.ts) cho audit (`id`, `createdAt`, `updatedAt`); thêm `deletedAt` trên document nếu khớp spec; cột `createdBy` / `updatedBy` tùy bảng user.
- `OutboundLineEntity`: `ManyToOne` → `OutboundDocumentEntity`; index `(outbound_document_id)`; unique `(outbound_document_id, line_no)`.
- `OutboundModule` **imports** `InventoryModule` (đã [export `InventoryStockService`](../../src/modules/inventory/inventory.module.ts)); `TypeOrmModule.forFeature([OutboundDocument, OutboundLine, …])` nếu service cần join `Warehouse`, `Location`, `ProductVariant` cho validate — có thể import thêm entity hoặc gọi repository module warehouses/products tùy kiến trúc hiện tại (đối chiếu [`inbound.module.ts`](../../src/modules/inbound/inbound.module.ts)).
- **Generator số phiếu**: service helper (transaction + unique constraint) hoặc sequence — thống nhất một cách trong `OutboundService` / repository (giống inbound).

## 4. Thứ tự công việc đề xuất

1. **Migration / entity**: tạo 2 bảng + FK → `warehouses`, `product_variants`, `locations`, `outbound_documents`; index unique `document_no` (full hoặc partial); unique `(outbound_document_id, line_no)`.
2. **`outbound.constant.ts`**: `OutboundDocumentStatus`, tên bảng nếu cần tham chiếu raw query.
3. **Repositories**: CRUD document + lines; `findByIdForUpdate` (phiếu); list có filter `warehouseId`, `status`, khoảng ngày, `q` (số phiếu).
4. **`OutboundService`**:
   - Tạo/sửa header & thay dòng khi `draft` (validate warehouse active nếu policy, location ∈ kho + `type = bin`, variant chưa xóa mềm).
   - `validate(id)`: load lines → đọc balance (read-only) hoặc mô phỏng `applyDelta` không commit — hoặc gọi logic chung `assertSufficientStock` trước khi complete; **không** ghi tồn.
   - `complete(id)`: `dataSource.transaction` → lock document `FOR UPDATE` → load lines → sort dòng theo khóa `(warehouse_id, location_id, variant_id)` (giống [`applyTransfer`](../../src/modules/inventory/services/inventory-stock.service.ts) — `compareBalanceKeys`) → lặp `applyDelta` với `quantityDelta` = chuỗi âm cùng scale (vd. `formatQty(-qty)` tương tự `negStr` trong transfer), `movementType = OUTBOUND_ISSUE`, `referenceType = OUTBOUND` → `status = completed`.
   - Idempotent: nếu đã `completed`, không ghi ledger lần 2 (trả 200 hoặc 409 — chọn một, ghi trong code + Swagger).
5. **Exceptions + mã lỗi**: trùng `document_no`, không thể sửa sau complete, location/variant không hợp lệ, thiếu tồn (map `InsufficientStockException` → 409).
6. **DTO + `ValidationPipe`**; `OutboundController` khớp [detail-design API](./detail-design.md#api).
7. Đăng ký `OutboundModule` trong [`app.module.ts`](../../src/app.module.ts).

## 5. Phụ thuộc / rủi ro

- **`InventoryStockService.applyDelta`**: với delta âm, service đã khóa balance và ném `InsufficientStockException` khi không đủ ([inventory-stock.service.ts](../../src/modules/inventory/services/inventory-stock.service.ts)); gọi với cùng `EntityManager` cho toàn bộ dòng; thứ tự `applyDelta` theo sort key `(warehouse_id, location_id, variant_id)` (đã có `compareBalanceKeys` trong service — inbound nên sort dòng trước khi gọi; outbound tương tự).
- **Warehouses / locations**: không default ô nguồn; validate bin — khớp `LocationType.BIN` ([inventory.constant.ts](../../src/common/constants/inventory.constant.ts)).
- **Products**: variant chưa xóa mềm — `VariantNotFoundException` từ `applyDelta` nếu không tìm thấy variant record.
- **Concurrency**: hai request `complete` cùng phiếu — khóa document `FOR UPDATE` ngăn double apply; hai phiếu khác nhau cùng ô+SKU — khóa từng dòng balance trong `applyDelta` đảm bảo serial hóa.

## 6. Kiểm thử gợi ý

- Tạo phiếu `draft` → `PUT/PATCH` dòng → `validate` → `complete` → kiểm tra `stock_balances` giảm + `inventory_movements` có `reference_type = outbound`, `movement_type = OUTBOUND_ISSUE`, đủ số dòng.
- `complete` lần hai: idempotent đúng policy (không nhân đôi movement).
- Số lượng xuất > tồn tại ô → **409** / `InsufficientStockException`.
- Location sai kho / không phải bin → lỗi từ `applyDelta` / validate (422/409 tùy map).
- Sửa phiếu sau `completed` → **409** (hoặc 422).
