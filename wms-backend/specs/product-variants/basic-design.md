# Biến thể sản phẩm (product variants) — Basic design

## Tài liệu tham chiếu

- [Sản phẩm — basic design](../products/basic-design.md)
- [Sản phẩm — detail design](../products/detail-design.md) (bảng `product_variants`, `product_variant_attribute_values`)
- [Thuộc tính — basic design](../master-data/attributes/basic-design.md)
- [Giá trị thuộc tính — basic design](../master-data/attribute-values/basic-design.md)

## Mục đích

Quản lý **một SKU cụ thể** thuộc một sản phẩm: định danh (`sku`, `barcode`), **tổ hợp giá trị thuộc tính** (Size/Color/…), và **thuộc tính bán hàng–catalog** gắn theo biến thể (giá, ảnh, …). Đây là thực thể mà kho và chứng từ tham chiếu qua `variant_id`.

## Phạm vi MVP (bổ sung so với mô tả chung trong spec Products)

| Thực thể / khía cạnh | Mô tả |
|----------------------|--------|
| **Identity** | `product_id`, `sku` (bắt buộc, unique khi chưa xóa mềm), `barcode` (tùy chọn) — thống nhất [detail design products](../products/detail-design.md). |
| **Tổ hợp thuộc tính (MVP)** | API dùng **`attributeId`** + **`valueId`** (UUID), hoặc bỏ/null cả hai cho default. `valueId` ∈ `attribute_values`, khớp `attributeId`. Response kèm **`productId`**, **`attributeId`**, **`valueId`** ngang các field catalog. |
| **Giá (catalog)** | Ví dụ: `list_price` (decimal), đơn vị tiền mặc định theo cấu hình tổ chức hoặc `currency_code` (ISO) nếu cần đa tiền tệ sau này. Có thể thêm `cost_price` khi nghiệp vụ WMS cần giá vốn theo SKU. |
| **Ảnh** | MVP: danh sách URL hoặc đường dẫn lưu trữ (vd. `image_urls: string[]`) với thứ tự; mở rộng sau: bảng `media` / file service. |
| **Số lượng** | **Không** lưu “tồn thực tế” trên dòng variant: số lượng theo **từng kho / vị trí** do module Inventory tính. Trên variant có thể có **gợi ý nghiệp vụ** (tùy chọn): ví dụ `min_stock` / `reorder_point` để cảnh báo — không thay thế bảng tồn. |
| **Trạng thái** | `active` trên variant (ngừng bán từng SKU) nếu tách với `products.active`; ít nhất một variant còn hiệu lực cho mỗi product đang bán (quy ước nghiệp vụ). |

## Quy tắc

- **Master-data**: chỉ **chọn** `attribute_value_id` đã tồn tại; không tạo attribute/value trong luồng variant ([attributes](../master-data/attributes/basic-design.md), [attribute-values](../master-data/attribute-values/basic-design.md)).
- **SKU / barcode**: unique và validation như [products detail](../products/detail-design.md).
- **Giá**: ≥ 0 (hoặc cho phép null nếu “chưa niêm yết” — cần thống nhất một quy ước); làm tròn theo số chữ số thập phân tiền tệ.
- **Xóa**: xóa mềm variant; **409** nếu còn tham chiếu tồn/chứng từ tới `variant_id`.
- **Đồng bộ với Product**: mọi thao tác CRUD variant nhận biết `product_id`; variant không “mồ côi” khỏi product.

## Luồng nghiệp vụ

1. Đảm bảo [attributes + values](../products/basic-design.md) đã có cho các trục phân biệt SKU (vd. Size, Color).
2. Tạo hoặc mở **Product** → thêm **Variant**: nhập SKU, barcode (nếu có), giá, ảnh; chọn **`attributeId`** + **`valueId`** nếu cần phân biệt SKU.
   - MVP: thao tác “thêm variant” là **từng cái một** (không tạo hàng loạt).
3. Kiểm tra tự động: không trùng `valueId` trên cùng product (MVP); SKU unique.
4. Tra **số lượng tồn** theo SKU: gọi module kho / báo cáo theo `variant_id`, không đọc một cột “qty” cố định trên variant (trừ trường gợi ý reorder nếu có).

## Liên kết module

| Module | Vai trò |
|--------|---------|
| **Products** | Cha `product_id`; category, UoM mặc định ở cấp product. |
| **Attributes / Attribute values** | Định nghĩa trục và giá trị cho tổ hợp biến thể. |
| **Inventory / chứng từ** | Mọi dòng tồn nhập–xuất tham chiếu `variant_id`; số lượng thực tế nằm đây. |

## Gợi ý API

Giữ **lồng** theo product (đồng bộ [products detail](../products/detail-design.md)):

- `POST /products/:productId/variants` — body gợi ý: `sku`, `barcode?`, `attributeId?`, `valueId?`, `currencyCode?`, `listPrice?`, `costPrice?`, `imageUrls?`, `active?`, `minStock?`, `maxStock?` (`attributeId`/`valueId` cùng có hoặc cùng không).
- `PATCH /products/:productId/variants/:variantId` — partial; đổi cặp `attributeId` + `valueId` hoặc set cả hai `null` (default).
- `GET /products/:productId/variants` hoặc embed trong `GET /products/:productId` với cờ `includeVariants` — response resolve sẵn attribute/value để hiển thị.
- `DELETE /products/:productId/variants/:variantId` — xóa mềm + kiểm tra tham chiếu kho.

**Tùy chọn** sau: `GET /product-variants?q=&sku=` để tra cứu SKU xuyên product (hỗ trợ quét barcode kho) — có thể đặt module tag riêng nhưng vẫn map vào cùng service/entity `product_variants`.

## Ghi chú tài liệu

- Chi tiết cột DB và index: xem và **mở rộng** mục `product_variants` trong [products/detail-design.md](../products/detail-design.md) khi triển khai (`list_price`, `image_urls` JSON/array, …).
- File này mô tả **phạm vi nghiệp vụ** và CRUD biến thể có thuộc tính giá/ảnh/gợi ý số lượng; tránh trùng lặp bằng cách cập nhật detail design products khi chốt schema.
