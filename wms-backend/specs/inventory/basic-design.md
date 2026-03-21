# Tồn kho — Basic design

## Mục đích

Là nguồn sự thật cho **số lượng tồn** theo **biến thể** tại **kho + vị trí** (và tổng hợp theo SP / kho khi báo cáo).

## Phạm vi MVP

| Thực thể / khái niệm | Mô tả |
|----------------------|--------|
| **Stock balance** | Khóa: `warehouse_id`, `location_id`, `variant_id` → `quantity` |
| **Không tạo tay** | Tồn chỉ đổi qua inbound / outbound / transfer (và điều chỉnh inventory adjustment — optional sau) |

## Quy tắc

- Mọi thay đổi quantity đi kèm **tham chiếu chứng từ** + loại giao dịch (audit).
- Xem tồn:
  - Theo **sản phẩm / variant**: sum theo kho hoặc toàn hệ thống.
  - Theo **kho**: group by variant.
  - Theo **vị trí**: filter `location_id`.

## Liên kết module

- Đọc bởi **Outbound**, **Transfer**; ghi bởi **Inbound**, **Outbound**, **Transfer**.

## Gợi ý API

- `GET /inventory/balances?warehouseId=&locationId=&variantId=`
- `GET /inventory/summary/by-product`, `.../by-warehouse` (query + aggregate)
