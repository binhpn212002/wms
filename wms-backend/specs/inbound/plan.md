# Kế hoạch triển khai — Nhập kho (inbound)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `inbound` |
| Phạm vi | `inbound_documents` + `inbound_lines`; hoàn tất phiếu gọi `InventoryStockService` trong **một transaction** ([detail-design.md](./detail-design.md)) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/inbound` (global prefix `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng **`inbound_documents`**: `document_no`, `document_date`, `supplier_id`, `warehouse_id`, `status` (`draft` \| `confirmed` \| `completed` hoặc rút gọn `draft` \| `completed`), `notes`, `deleted_at`, audit; unique `document_no` theo quy ước dự án.
- Bảng **`inbound_lines`**: `inbound_document_id`, `line_no`, `variant_id`, `quantity` (> 0), `unit_price` (nullable), `location_id` (bin, đúng kho phiếu).
- **Complete**: đọc dòng → resolve `location_id` (default warehouse nếu spec cho phép bỏ trống) → sort khóa `(warehouse_id, location_id, variant_id)` → trong transaction: `SELECT … FOR UPDATE` phiếu → với từng dòng (theo thứ tự khóa đã sort) gọi `InventoryStockService.applyDelta(..., manager)` với `movementType = INBOUND_RECEIPT`, `referenceType = inbound`, `referenceId` = id phiếu, `referenceLineId` = id dòng — đã có sẵn tại [`inventory-stock.service.ts`](../../src/modules/inventory/services/inventory-stock.service.ts) (truyền `EntityManager` để không lồng transaction).
- **Không** sửa/xóa header & dòng sau `completed`; xóa mềm chỉ khi `draft` (nếu bật DELETE).
- Enum / hằng: trạng thái phiếu — `common/constants/inbound.constant.ts`; `movement_type` / `reference_type` tái sử dụng [`inventory.constant.ts`](../../src/common/constants/inventory.constant.ts) (`InventoryMovementType.INBOUND_RECEIPT`, `InventoryReferenceType.INBOUND`).
- HTTP: 200/201/404/409/422/403; payload lỗi `code` + `message` + map [`error-code.constant.ts`](../../src/common/constants/error-code.constant.ts).

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + quy ước dự án)

```
src/
├── database/
│   ├── entities/
│   │   ├── inbound-document.entity.ts
│   │   └── inbound-line.entity.ts
│   └── migrations/
│       └── xxxxx-create-inbound-tables.ts
├── common/
│   ├── constants/
│   │   └── inbound.constant.ts                 # TABLE_*, InboundDocumentStatus (hoặc enum tương đương)
│   ├── repositories/
│   │   └── base.repository.ts                  # đã có — repository inbound kế thừa nếu dùng pattern này
│   └── exceptions/
│       └── inbound.exceptions.ts               # tùy chọn: conflict status, duplicate document_no
└── modules/
    └── inbound/
        ├── inbound.module.ts
        ├── inbound.controller.ts
        ├── services/
        │   └── inbound.service.ts              # CRUD phiếu/dòng; complete() + transaction + gọi InventoryStockService
        ├── repositories/
        │   ├── inbound-documents.repository.ts
        │   └── inbound-lines.repository.ts
        └── dto/
            ├── create-inbound.dto.ts
            ├── update-inbound.dto.ts
            ├── list-inbound-query.dto.ts
            ├── replace-inbound-lines.dto.ts      # hoặc tách create-line / update-line
            ├── inbound-line-input.dto.ts
            ├── inbound-document-response.dto.ts
            └── inbound-line-response.dto.ts
```

- Entity kế thừa [`shared/base.entity.ts`](../../src/shared/base.entity.ts) cho audit (`id`, `createdAt`, `updatedAt`); thêm `deletedAt` trên document nếu khớp spec; cột `createdBy` / `updatedBy` tùy bảng user.
- `InboundLineEntity`: `ManyToOne` → `InboundDocumentEntity`; index `(inbound_document_id)`; unique `(inbound_document_id, line_no)`.
- `InboundModule` **imports** `InventoryModule` (đã [export `InventoryStockService`](../../src/modules/inventory/inventory.module.ts)); `TypeOrmModule.forFeature([InboundDocument, InboundLine, …])` nếu service cần join `Warehouse`, `Location`, `Supplier`, `ProductVariant` cho validate — có thể import thêm entity hoặc gọi repository module warehouses/products tùy kiến trúc hiện tại.
- **Generator số phiếu**: service helper (transaction + unique constraint) hoặc sequence — thống nhất một cách trong `InboundService` / repository.

## 4. Thứ tự công việc đề xuất

1. **Migration / entity**: tạo 2 bảng + FK → `suppliers`, `warehouses`, `product_variants`, `locations`, `inbound_documents`; index unique `document_no` (full hoặc partial); unique `(inbound_document_id, line_no)`.
2. **`inbound.constant.ts`**: `InboundDocumentStatus`, tên bảng nếu cần tham chiếu raw query.
3. **Repositories**: CRUD document + lines; `findByIdForUpdate` (phiếu); list có filter `warehouseId`, `supplierId`, `status`, khoảng ngày, `q` (số phiếu).
4. **`InboundService`**:
   - Tạo/sửa header & thay dòng khi `draft` (validate supplier active, warehouse, location ∈ kho + `type = bin`, variant chưa xóa mềm).
   - `complete(id)`: `dataSource.transaction` (hoặc isolation tương đương) → lock document → load lines → resolve location → sort keys → lặp `applyDelta` với `manager` → `status = completed`.
   - Idempotent: nếu đã `completed`, không ghi ledger lần 2 (trả 200 hoặc 409 — chọn một, ghi trong code + Swagger).
5. **Exceptions + mã lỗi**: trùng `document_no`, không thể sửa sau complete, supplier/location/variant không hợp lệ.
6. **DTO + `ValidationPipe`**; `InboundController` khớp [detail-design API](./detail-design.md#api).
7. Đăng ký `InboundModule` trong [`app.module.ts`](../../src/app.module.ts).

## 5. Phụ thuộc / rủi ro

- **`InventoryStockService`**: bắt buộc gọi với cùng `EntityManager` cho toàn bộ dòng trong một transaction; thứ tự `applyDelta` theo sort key (đã dùng pattern tương tự trong `applyTransfer`).
- **Suppliers**: phiếu mới chọn NCC `active`; xóa NCC khi còn phiếu — policy **409** ([suppliers plan](../suppliers/plan.md)); sau khi có bảng inbound, cập nhật đếm tham chiếu thật (nếu đang stub).
- **Warehouses**: `default_location_id` cho nhập nhanh; validate bin — khớp [`LocationType`](../../src/common/constants/inventory.constant.ts) / entity location.
- **Concurrency**: hai request `complete` cùng phiếu — khóa document `FOR UPDATE` ngăn double apply.

## 6. Kiểm thử gợi ý

- Tạo phiếu `draft` → `PUT/PATCH` dòng → `complete` → kiểm tra `stock_balances` tăng + `inventory_movements` có `reference_type = inbound`, đủ số dòng.
- `complete` lần hai: idempotent đúng policy (không nhân đôi movement).
- Thiếu `location_id` và không có default → **422**.
- Location sai kho / không phải bin → lỗi từ `applyDelta` / validate (422/409 tùy map).
- Sửa phiếu sau `completed` → **409** (hoặc 422).
