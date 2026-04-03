# Kế hoạch triển khai — Check hàng tồn (inventory check)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên đặc tả | `inventory-check` (thư mục `specs/inventory-check/`) |
| Mục tiêu | Use-case **tra cứu tồn** theo SKU/barcode hoặc `variantId` để phục vụ UI “check hàng tồn”. |
| Nguồn tồn | `stock_balances` / `inventory_movements` theo module [inventory](../inventory/detail-design.md) — **không** thêm `currentQuantity` trên `product_variants`. |
| Triển khai NestJS | Khuyến nghị **gộp vào module `inventory`** (thêm controller/service/repository dùng chung) để tránh trùng `TypeOrmModule` và tránh 2 nơi tự join `stock_balances`. |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/inventory-check` (kebab-case plural theo [plan.promt.md](../../promt/plan.promt.md)) |

## 2. Mục tiêu theo MVP (detail-design)

- Endpoint **chỉ đọc**:
  - `GET /inventory-check/lookup` — query `q` (sku hoặc barcode), filter `warehouseId?`, `locationId?`, `mode=summary|details`.
  - `GET /inventory-check/variants/:variantId` — theo `variantId`, filter tương tự.
- `mode=summary`: `SUM(stock_balances.quantity)` theo `variantId` (và optionally breakdown theo warehouse).
- `mode=details`: trả dòng tồn theo `(warehouseId, locationId, variantId)` với `quantity > 0`.
- Embed tối thiểu để UI hiển thị: `product { id, code, name }`, và (khi details) `warehouse`, `location`.
- Validation & error:
  - 422: query invalid (q rỗng, mode sai, pageSize vượt max).
  - 403: không có quyền xem kho.
  - 404: filter id không tồn tại (theo policy dự án).
- Không tạo bảng mới; không update `stock_balances` / `inventory_movements` trong module này.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + thực tế repo)

Vì repo đã có `modules/inventory/` và entity tồn nằm trong `src/database/entities/`, khuyến nghị triển khai theo hướng **mở rộng** `InventoryModule`:

```
src/
├── database/
│   └── entities/
│       ├── stock-balance.entity.ts
│       └── inventory-movement.entity.ts
├── common/
│   ├── repositories/
│   │   └── base.repository.ts
│   └── constants/
│       └── inventory.constant.ts                # nếu cần enum/type dùng chung
└── modules/
    └── inventory/
        ├── inventory.module.ts
        ├── inventory.controller.ts              # (tùy chọn) giữ các route /inventory/*
        ├── inventory-check.controller.ts         # mới: GET /inventory-check/*
        ├── services/
        │   ├── inventory.service.ts              # list balances/summary (đã có hoặc sẽ có)
        │   └── inventory-check.service.ts        # mới: lookup/variant check (dùng repo chung)
        ├── repositories/
        │   ├── stock-balances.repository.ts      # thêm hàm aggregate theo variant + join sku/barcode
        │   └── inventory-check.repository.ts     # (tùy chọn) nếu muốn tách query lookup riêng
        └── dto/
            ├── inventory-check-lookup-query.dto.ts
            ├── inventory-check-variant-query.dto.ts
            ├── inventory-check-item.dto.ts
            └── inventory-check-line.dto.ts
```

Ghi chú:

- Nếu team không muốn thêm controller mới, có thể đặt route `/inventory/inventory-check/*` nhưng sẽ **không đúng** quy ước resource path trong [plan.promt.md](../../promt/plan.promt.md). Khuyến nghị giữ `/inventory-check/*`.
- `inventory-check` nên tái sử dụng query builder của `GET /inventory/balances` (DRY), chỉ khác phần **match q (sku/barcode)** và shape embed.

## 4. Thứ tự công việc đề xuất

1. **DTO query**: parse/validate `q`, `warehouseId`, `locationId`, `mode`, `page`, `pageSize`.
2. **Repository/query**:
   - `findVariantsBySkuOrBarcode(q)` (join `product_variants` + `products`).
   - `aggregateBalancesByVariant(variantIds, filters...)` cho `mode=summary`.
   - `listBalanceLines(variantIds, filters...)` cho `mode=details` (filter `quantity > 0`).
3. **Service**:
   - Compose 2 bước: resolve variant(s) → query stock balances → map response.
   - Áp phân quyền kho (403) + validate “location thuộc warehouse” khi cần.
4. **Controller**:
   - `GET /inventory-check/lookup`
   - `GET /inventory-check/variants/:variantId`
5. **Swagger tags**: thêm `@ApiTags('inventory-check')`, mô tả `mode`.
6. **Test**:
   - Unit test service mapping (summary/details).
   - Integration test với DB (nếu suite có): filter kho/vị trí, quantity 0, variant không tồn tại.

## 5. Phụ thuộc / rủi ro

- **Policy lỗi 404 vs 200 rỗng**: `lookup` nên thống nhất với các list API trong dự án.
- **Precision decimal**: TypeORM thường trả decimal dạng string; cần quy ước trả JSON number/string nhất quán với module inventory.
- **Phân quyền kho**: cần cơ chế “user có quyền xem kho nào” (role/ACL) — nếu chưa có, MVP có thể chỉ cho admin hoặc cho phép xem tất cả.
- **Hiệu năng**: lookup theo `barcode`/`sku` cần index; `details` có thể nhiều dòng — nên phân trang hoặc giới hạn số dòng trả về khi dữ liệu lớn.

## 6. Kiểm thử gợi ý

- `lookup`:
  - q khớp SKU → trả 1 item, quantity đúng theo tổng `stock_balances`.
  - q khớp barcode → trả item tương tự.
  - q không khớp → `items: []` (nếu policy) hoặc 404.
  - filter `warehouseId`/`locationId` đúng/sai (404/422 theo policy).
  - `mode=details` chỉ trả `quantity > 0`.
- `variants/:variantId`:
  - variant không tồn tại/đã xóa mềm → 404.
  - đủ quyền/không đủ quyền kho → 200/403.

