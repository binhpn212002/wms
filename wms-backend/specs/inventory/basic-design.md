# Tồn kho — Basic design

## Tài liệu tham chiếu

- [Detail design](./detail-design.md)
- [Kế hoạch triển khai](./plan.md)
- [Kho & vị trí — basic design](../warehouses/basic-design.md)
- [Sản phẩm — basic design](../products/basic-design.md)
- [Sản phẩm — detail design](../products/detail-design.md) (mục liên kết kho/chứng từ, quy tắc `variant_id`, xóa mềm)

## Mục đích

Là nguồn sự thật cho **số lượng tồn** theo **biến thể sản phẩm** (`product_variants`) tại **kho + vị trí**; báo cáo tổng hợp theo sản phẩm / kho / toàn hệ thống là **aggregate** trên các dòng tồn chi tiết.

## Phạm vi MVP

| Thực thể / khái niệm | Mô tả |
|---------------------|--------|
| **Stock balance** | Khóa logic: `warehouse_id`, `location_id`, `variant_id` → `quantity` (đơn vị theo UoM mặc định của sản phẩm — xem [products detail](../products/detail-design.md) — cột `default_uom_id`) |
| **variant_id** | FK → `product_variants.id` — mọi dòng tồn/chứng từ dùng cùng định danh này |
| **location_id** | FK → `locations.id`; **tồn gán tại vị trí lá** (bin / ô chứa hàng) — vị trí cha (zone/rack) chỉ để tổ chức, không bắt buộc có dòng tồn riêng (thống nhất [warehouses](../warehouses/basic-design.md)) |
| **Không tạo tay** | Tồn chỉ đổi qua **Inbound / Outbound / Transfer** (và **inventory adjustment** — tùy chọn sau MVP) |

## Quy tắc

- Mọi thay đổi `quantity` đi kèm **tham chiếu chứng từ** (phiếu/dòng) + **loại giao dịch** để audit (không sửa “trần” bảng tồn ngoài luồng nghiệp vụ).
- **Nhập nhanh**: có thể dùng `warehouses.default_location_id` làm đích mặc định khi UI không chọn ô cụ thể (vẫn ghi nhận một `location_id` hợp lệ).
- **Xóa mềm / tham chiếu**: không xóa variant (`product_variants`) hoặc vị trí đang được dòng tồn hoặc chứng từ tham chiếu — chi tiết HTTP/policy đồng bộ [products detail](../products/detail-design.md) (409 khi còn tồn/chứng từ) và module kho khi triển khai.
- Xem tồn:
  - Theo **sản phẩm / variant**: cộng dồn theo kho hoặc toàn hệ thống.
  - Theo **kho**: nhóm theo `variant_id` (và tùy UI: join SKU/tên từ products).
  - Theo **vị trí**: lọc `location_id` (thường là bin lá).

## Liên kết module

- **Warehouses**: `warehouse_id` + `location_id` — cấu trúc vị trí, default location ([warehouses basic](../warehouses/basic-design.md)).
- **Products**: `variant_id` → `product_variants.id`, SKU unique, quy tắc inactive/xóa mềm ([products detail](../products/detail-design.md)).
- **Inbound / Outbound / Transfer**: đọc tồn để kiểm tra khả dụng; ghi thay đổi tồn trong transaction cùng chứng từ.

## Gợi ý API

Base path gợi ý: `/inventory` (prefix `/api/v1` nếu dự án version hóa). Chỉ **đọc / tổng hợp** tại module này; ghi tồn qua API các luồng nhập–xuất–chuyển.

- `GET /inventory/balances` — query: `warehouseId`, `locationId`, `variantId`, `productId` (join variant → product nếu cần), phân trang.
- `GET /inventory/summary/by-product` — aggregate theo product/variant (filter kho tùy query).
- `GET /inventory/summary/by-warehouse` — aggregate theo kho / variant.

Tham số query và body lỗi (`code`, `message`) nên thống nhất chuẩn WMS đã dùng ở [products detail](../products/detail-design.md) (mục mã lỗi HTTP).
