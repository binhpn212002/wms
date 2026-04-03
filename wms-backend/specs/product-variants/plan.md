# Kế hoạch triển khai — Biến thể sản phẩm (product variants)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên đặc tả | `product-variants` (thư mục `specs/product-variants/`) |
| Triển khai NestJS | Mở rộng module **`products`** hiện có — route lồng theo [detail-design.md](./detail-design.md) (`/products/:productId/variants`); **không** tạo `src/modules/product-variants/` trừ khi tách controller/service sau này vì quy mô. |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md); nền tảng bảng tại [products/detail-design.md](../products/detail-design.md) |
| Base API (nested) | Global prefix `api/v1` — `GET|POST /products/:productId/variants`, `PATCH|DELETE /products/:productId/variants/:variantId` |
| API tùy chọn (tra cứu) | `GET /api/v1/product-variants` — segment plural kebab-case theo [plan.promt.md](../../promt/plan.promt.md) |

## 2. Mục tiêu theo MVP (detail-design)

- **Schema `product_variants`**: bổ sung cột catalog so với baseline hiện tại (`sku`, `barcode`, `product_id`): `active`, `currency_code?`, `list_price?`, `cost_price?`, `image_urls` (jsonb/array string), `min_stock?`, `max_stock?`; index gợi ý `(product_id, active)`; ràng buộc giá và ngưỡng ≥ 0, `max_stock >= min_stock` khi cả hai có giá trị.
- **Bảng nối `product_variant_attribute_values`**: giữ như [products/detail-design](../products/detail-design.md); MVP **tối đa một** `attribute_value_id` / variant; map qua `valueId` với kiểm tra `attribute_values.attribute_id === attributeId`.
- **API body/response**: **`attributeId` + `valueId`** cùng có hoặc cùng `null`/omit (default variant); không gửi một nửa (422 `ATTRIBUTE_VALUE_MISMATCH`). Response luôn có **`productId`**; có thể embed **`attributeValue`** `{ id, attributeId, code, name }`.
- **List variant**: `GET /products/:productId/variants` với query gợi ý `q`, `active`, `includeDeleted`.
- **Xóa mềm**: `DELETE` → 204; 409 `VARIANT_IN_USE` khi còn tham chiếu kho/chứng từ; các mã lỗi khác theo bảng trong [detail-design](./detail-design.md).
- **Không** lưu tồn thực tế trên variant — chỉ ngưỡng cảnh báo; tồn theo Inventory.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + thực tế repo)

Entity đã nằm tại `src/database/entities/`. Mở rộng **`modules/products/`** (đồng bộ [spec products plan](../products/plan.md), tránh trùng module):

```
src/
├── database/
│   └── entities/
│       ├── product-variant.entity.ts              # bổ sung cột detail-design
│       └── product-variant-attribute-value.entity.ts
├── common/
│   ├── constants/
│   │   └── error-code.constant.ts                # bổ sung ATTRIBUTE_VALUE_*, SKU_CONFLICT, … nếu chưa có
│   └── repositories/
│       └── base.repository.ts
└── modules/
    └── products/
        ├── products.module.ts
        ├── products.controller.ts                  # thêm GET list variants; endpoint tùy chọn product-variants
        ├── services/
        │   └── products.service.ts                 # transaction variant + replace map; validation cặp attribute
        ├── repositories/
        │   ├── products.repository.ts
        │   └── product-variants.repository.ts      # list theo product + filter active/q; join attribute value
        └── dto/
            ├── create-product-variant.dto.ts       # chuyển từ attributeValueIds[] → attributeId? + valueId? (MVP)
            ├── update-product-variant.dto.ts       # PATCH: quy ước null cả hai = default; omit = giữ map
            ├── list-product-variants-query.dto.ts
            └── product-variant-response.dto.ts     # productId, catalog fields, attributeId/valueId, attributeValue?
```

- `TypeOrmModule.forFeature`: đã đăng ký `ProductVariant`, `ProductVariantAttributeValue` — chỉ cập nhật entity/migration.
- Nếu sau này tách **`ProductVariantsController`** (chỉ route con), vẫn import trong `ProductsModule` hoặc `imports: [ProductsModule]` để dùng chung service.

## 4. Thứ tự công việc đề xuất

1. **Migration**: `ALTER product_variants` thêm các cột và index; default `active = true`; kiểm tra `image_urls` (jsonb) hoặc text[] tùy chuẩn dự án.
2. **Entity `ProductVariant`**: map cột mới; validator application-layer cho giá/ngưỡng/độ dài URL/số phần tử `imageUrls`.
3. **Repository**: list variants theo `productId` với `q` (sku/barcode ILIKE), `active`, soft-delete; load 0–1 dòng junction + join `attribute_values` cho response.
4. **DTO**: thay `attributeValueIds` bằng cặp `attributeId`/`valueId` (MVP); `UpdateProductVariantDto` xử lý partial và “explicit null cả hai” để xóa map — phân biệt với `undefined`/omit bằng `AllowNullable` + tài liệu hoặc field wrapper tùy stack validation.
5. **ProductsService**:
   - `createVariant` / `updateVariant`: validate product tồn tại; SKU unique; kiểm tra `valueId` tồn tại và khớp `attributeId`; không trùng `valueId` với variant khác cùng product; default variant không trùng nếu policy cấm (409 `VARIANT_COMBINATION_CONFLICT`).
   - **Transaction**: ghi `product_variants` rồi replace 0–1 dòng `product_variant_attribute_values`.
6. **Controller**: thêm `GET :id/variants` + query DTO; đảm bảo `POST/PATCH` response khớp spec (`productId`, `attributeValue?`).
7. **(Tùy chọn)** `ProductVariantsLookupController` hoặc thêm route trong `products` module: `GET /product-variants` với `q`, `active`, `includeDeleted`, trả kèm `product` minimal.
8. **Error filter / exceptions**: map HTTP 404/409/422 với `code` trong bảng detail-design.

## 5. Phụ thuộc / rủi ro

- **Breaking change API**: client đang gửi `attributeValueIds[]` cần đổi sang `attributeId`/`valueId` — phối hợp frontend và versioning nếu cần.
- **`products` plan**: đã mô tả junction đa giá trị theo thời kỳ trước; MVP product-variants **thu hẹp một cặp** — đảm bảo service không ghi >1 row map/variant.
- **Inventory**: stub 409 khi chưa có FK thật; bổ sung kiểm tra khi module kho sẵn sàng.
- **Đa tiền tệ**: cột `currency_code` optional; có thể bỏ nếu org chỉ dùng một loại tiền.

## 6. Kiểm thử gợi ý

- Default variant: không gửi `attributeId`/`valueId` → không có dòng junction; GET trả cả hai null/omit.
- Chỉ gửi `attributeId` hoặc chỉ `valueId` → 422 `ATTRIBUTE_VALUE_MISMATCH`.
- `valueId` không thuộc `attributeId` → 422; `valueId` đã xóa mềm → 422 `ATTRIBUTE_VALUE_INVALID`.
- Hai variant cùng `valueId` trên một product → 409.
- PATCH: không gửi cặp → map giữ nguyên; gửi cả hai null → xóa junction; đổi cặp → replace.
- Giá âm, `maxStock < minStock`, quá nhiều URL → 422.
- DELETE variant đang được inventory tham chiếu → 409 `VARIANT_IN_USE`.

## 7. Frontend (wms-frontend) — checklist triển khai page CRUD

Bám theo [implement.promt.md](../../../wms-frontend/promt/implement.promt.md) (service-first, Table + pagination + search debounce, dialog tách file, xóa dùng `ConfirmDeleteDialog`).

- **Page**: `src/pages/product-variants/` (hoặc lồng dưới `src/pages/products/<...>` nếu UI đặt trong màn Product detail)
  - `ProductVariantsPage.tsx` (list theo `productId`, `q`, `active`)
  - `CreateProductVariantDialog.tsx`, `UpdateProductVariantDialog.tsx`
- **Service**: `src/services/productVariants.service.ts`
  - `list(productId, { q, active, includeDeleted, page, pageSize })`
  - `create(productId, dto)`, `update(productId, variantId, dto)`, `remove(productId, variantId)`
- **Types**: `src/types/product-variant.ts` (export qua `src/types/index.ts`)
  - Khớp response: `productId`, `attributeId?`, `valueId?`, `attributeValue?`, `imageUrls?`, `listPrice?`, `minStock?`, ...
- **Routing**: thêm route trong `src/routes/AppRoutes.tsx` và constants trong `src/constants/index.ts` (nếu là page mới).
- **Build**: đảm bảo `npm run build` pass.
