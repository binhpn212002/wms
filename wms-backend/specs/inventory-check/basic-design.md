# Check hàng tồn (inventory check) — Basic design

## Tài liệu tham chiếu

- [Detail design](./detail-design.md)
- [Tồn kho — basic design](../inventory/basic-design.md)
- [Tồn kho — detail design](../inventory/detail-design.md)
- [Kho & vị trí — basic design](../warehouses/basic-design.md)
- [Sản phẩm — basic design](../products/basic-design.md)
- [Biến thể sản phẩm — basic design](../product-variants/basic-design.md)

## Mục đích

Cung cấp **API tra cứu tồn** phục vụ UI nghiệp vụ (kho, bán hàng, kiểm tra khả dụng) với các nhu cầu:

- Tra nhanh theo **SKU / barcode**.
- Xem tồn theo **kho**, **vị trí (bin)** hoặc **tổng hợp**.
- Hiển thị kèm thông tin tối thiểu của SKU (product/variant) để người dùng hiểu “hàng nào”.

Module này **không tạo nguồn tồn mới**: tồn thực tế vẫn là aggregate/đọc từ `stock_balances` (và audit ở `inventory_movements`) theo [spec inventory](../inventory/basic-design.md).

## Phạm vi MVP

| Hạng mục | Mô tả |
|---------|------|
| **Nguồn dữ liệu tồn** | `stock_balances.quantity` theo khóa `(warehouse_id, location_id, variant_id)` — không có `currentQuantity` trên `product_variants`. |
| **Tra cứu theo SKU / barcode** | Cho phép tìm `q` (sku/barcode) và trả tồn theo filter kho/vị trí. |
| **2 chế độ trả về** | (1) **Summary**: tổng theo `variant_id` (và optionally theo `warehouse_id`). (2) **Details**: chi tiết theo `warehouse_id` + `location_id`. |
| **Phân quyền xem tồn** | MVP: ít nhất chặn/giới hạn theo danh sách kho người dùng được phép xem (policy cụ thể tùy hệ thống auth/roles). |
| **Không ghi tồn** | Không có endpoint “set stock”. Mọi thay đổi tồn phải đi qua luồng Inbound / Outbound / Transfer gọi `InventoryStockService`. |

## Quy tắc nghiệp vụ

- **Tồn khả dụng (MVP)**: coi `available = quantity` (chưa có reserve/allocated).
- **Vị trí**: ưu tiên trả tồn ở **vị trí lá/bin** (đồng bộ [warehouses](../warehouses/basic-design.md)).
- **Variant hợp lệ**: chỉ trả dữ liệu cho variant chưa xóa mềm; nếu variant bị xóa mềm, tùy policy:
  - 404 khi lookup theo `variantId`, hoặc
  - list/summary: mặc định exclude `deleted_at != null` ở `product_variants`.
- **Dòng balance chưa tồn tại**: coi như `quantity = 0` (không cần tạo dòng).

## Luồng nghiệp vụ (UI)

1. Người dùng mở màn “Check hàng tồn”.
2. Nhập `q` (SKU hoặc barcode) hoặc chọn product/variant.
3. Chọn filter:
   - Kho (optional): `warehouseId`
   - Vị trí (optional): `locationId` (bin)
4. Hệ thống trả:
   - **Summary**: tổng tồn theo variant (và kho nếu yêu cầu), dùng cho danh sách nhanh.
   - **Details**: drill-down theo kho/vị trí để biết hàng nằm ở đâu.

## Gợi ý API (MVP)

Base path gợi ý: `/api/v1/inventory-check` (hoặc gộp route vào `/api/v1/inventory` tùy kiến trúc). Khuyến nghị **gộp vào InventoryController** để tránh trùng module; file spec này chỉ mô tả “use-case check tồn”.

### `GET /inventory-check/lookup`

Tra cứu theo SKU/barcode và trả về tồn.

- **Query (gợi ý)**:
  - `q` (required): sku hoặc barcode.
  - `warehouseId?`, `locationId?`
  - `mode`: `summary` \| `details` (default: `summary`)
  - `page`, `pageSize` (khi mode `summary` và danh sách SKU có thể nhiều; hoặc khi q là prefix search)

- **Response (gợi ý)**:
  - `items[]`:
    - `variantId`, `productId`, `sku`, `barcode?`
    - `quantity` (summary) hoặc `quantityByLocation[]` (details)
    - embed hiển thị: `product: { id, code, name }`, `warehouse?: { id, code, name }`, `location?: { id, code, name, path }`

### `GET /inventory-check/variants/:variantId`

Tra cứu tồn theo variant id (dùng khi UI đã có variant).

- **Query (gợi ý)**: `warehouseId?`, `locationId?`, `mode=summary|details`
- **200**: trả tương tự `lookup` nhưng chỉ cho một variant.
- **404**: variant không tồn tại / đã xóa mềm (policy MVP).

## Ghi chú mở rộng (sau MVP)

- **Available vs On-hand**: thêm `reserved/allocated` để tính \(available = onHand - reserved\).
- **Batch lookup**: `POST /inventory-check/lookup` nhận `variantIds[]` hoặc `skus[]` cho màn picklist.
- **Tìm theo product**: filter `productId` để list tất cả variant + tồn.
- **Hiệu năng**: cache summary theo variant/kho; hoặc materialized view (nếu cần).

