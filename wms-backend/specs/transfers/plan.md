# Kế hoạch triển khai — Chuyển kho (transfers)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `transfers` |
| Phạm vi | `transfers` + `transfer_lines`; hoàn tất phiếu ghi **2 movements/line** (`TRANSFER_OUT`, `TRANSFER_IN`) và cập nhật `stock_balances` trong **một transaction** ([detail-design.md](./detail-design.md)) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/transfers` (global prefix `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng **`transfers`**: `document_no`, `document_date`, `status` (`draft` \| `completed`), `note`, `completed_at`, `deleted_at` (nếu dự án soft-delete chứng từ), audit.
- Bảng **`transfer_lines`**: `transfer_id`, `variant_id`, `quantity` (> 0), `warehouse_id_from` + `location_id_from`, `warehouse_id_to` + `location_id_to`.
- **Validate** (`POST .../validate`): kiểm tra line hợp lệ + đọc `stock_balances` tại nguồn để đảm bảo đủ tồn; **không** ghi balance/movement; **không** đổi `status`.
- **Complete**:
  - `SELECT ... FOR UPDATE` (lock) phiếu.
  - Validate FK + location bin + warehouse-location match + chặn from=to.
  - Gom toàn bộ “ops” theo line: 1 op **trừ nguồn** + 1 op **cộng đích**.
  - Sort khóa `(warehouse_id, location_id, variant_id)` cho **tất cả ops** để tránh deadlock.
  - Trong **một transaction**: gọi `InventoryStockService.applyDelta(..., manager)` theo thứ tự sort:
    - `movementType = InventoryMovementType.TRANSFER_OUT`, `quantityDelta = -qty`
    - `movementType = InventoryMovementType.TRANSFER_IN`, `quantityDelta = +qty`
    - `referenceType = InventoryReferenceType.TRANSFER`, `referenceId = transfer.id`, `referenceLineId = line.id`
  - Set `status = completed`, `completedAt = now()`. Không ghi ledger lần 2.
- Enum / hằng: trạng thái phiếu — `common/constants/transfers.constant.ts`; movement/reference type tái sử dụng `common/constants/inventory.constant.ts`.
- HTTP: 200/201/404/409/422/403; payload lỗi `code` + `message`; thiếu tồn: `InsufficientStockException` (inventory) / mã `INSUFFICIENT_STOCK`.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + quy ước dự án)

```
src/
├── database/
│   ├── entities/
│   │   ├── transfer.entity.ts
│   │   └── transfer-line.entity.ts
│   └── migrations/
│       └── xxxxx-create-transfer-tables.ts
├── common/
│   ├── constants/
│   │   └── transfers.constant.ts                 # TABLE_*, TransferStatus
│   └── exceptions/
│       └── transfers.exceptions.ts               # tùy chọn: conflict status, duplicate document_no, already completed
└── modules/
    └── transfers/
        ├── transfers.module.ts
        ├── transfers.controller.ts
        ├── services/
        │   └── transfers.service.ts              # CRUD phiếu/dòng; validate(); complete() + transaction + applyDelta 2 ops/line
        ├── repositories/
        │   ├── transfers.repository.ts           # header
        │   └── transfer-lines.repository.ts      # lines
        └── dto/
            ├── create-transfer.dto.ts
            ├── update-transfer.dto.ts
            ├── list-transfers-query.dto.ts
            ├── replace-transfer-lines.dto.ts
            ├── transfer-line-input.dto.ts
            ├── transfer-response.dto.ts
            └── transfer-line-response.dto.ts
```

- Entity kế thừa `shared/base.entity.ts` cho audit (`id`, `createdAt`, `updatedAt`); thêm `deletedAt` nếu bật soft-delete cho document.
- `TransferLineEntity`: `ManyToOne` → `TransferEntity`; index `(transfer_id)`.
- `TransfersModule` imports `InventoryModule` (đã export `InventoryStockService`) và dùng `TypeOrmModule.forFeature([Transfer, TransferLine, ...])`.

## 4. Thứ tự công việc đề xuất

1. **Migration / entity**: tạo 2 bảng + FK → `warehouses`, `locations`, `product_variants`; unique `document_no` theo policy; index `(transfer_id)`.
2. **`transfers.constant.ts`**: `TransferStatus`, tên bảng nếu cần tham chiếu raw query.
3. **Repositories**: CRUD header + lines; `findByIdForUpdate` (phiếu); list filter `status`, khoảng ngày, `q` (documentNo).
4. **`TransfersService`**:
   - Tạo/sửa header & thay dòng khi `draft`.
   - `validate(id)`: load lines → kiểm tra tồn nguồn (read-only) và trả lỗi thiếu tồn theo line.
   - `complete(id)`: `dataSource.transaction` → lock document → load lines → build ops (2/line) → sort theo key `(warehouseId, locationId, variantId)` → gọi `inventoryStockService.applyDelta(..., manager)` theo thứ tự → set `completed`.
   - Idempotent: nếu đã `completed`, không ghi ledger lần 2 (trả 200 hoặc 409 — chọn một và ghi rõ trong Swagger).
5. **DTO + controller** khớp [detail-design API](./detail-design.md#api).
6. Đăng ký `TransfersModule` trong `app.module.ts`.

## 5. Phụ thuộc / rủi ro

- **Inventory**: `InventoryStockService.applyDelta` đã validate variant/location (bin + đúng kho) và ném `InsufficientStockException` khi trừ vượt tồn; transfers service vẫn nên validate “from=to” và trạng thái phiếu trước.
- **Transaction boundary**: không dùng `InventoryStockService.applyTransfer` theo từng line nếu cần “một transaction cho toàn phiếu”; thay vào đó gọi `applyDelta(..., manager)` cho tất cả ops trong cùng transaction (đúng pattern inbound/outbound).
- **Concurrency**: hai request `complete` cùng phiếu — lock `transfers` `FOR UPDATE` ngăn double apply; hai phiếu khác nhau cùng SKU/ô — lock balance trong `applyDelta` đảm bảo serial hóa.

## 6. Kiểm thử gợi ý

- Tạo phiếu `draft` → thay lines → `validate` → `complete` → kiểm tra:
  - Balance nguồn giảm, balance đích tăng.
  - `inventory_movements` có đúng **2 dòng/line**: `TRANSFER_OUT` + `TRANSFER_IN`, đúng `reference_type = transfer`.
- `complete` lần hai: idempotent đúng policy (không nhân đôi movement).
- Thiếu tồn tại nguồn → **409** / `InsufficientStockException`.
- Location sai kho / không phải bin / from=to → lỗi 422/409 đúng policy.
