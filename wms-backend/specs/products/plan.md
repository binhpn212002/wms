# Kế hoạch triển khai — Sản phẩm (products)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `products` |
| Phạm vi | Product + Product variant + bảng nối variant ↔ `attribute_values` (MVP theo [detail-design.md](./detail-design.md)) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/products` (global prefix `api/v1` trong `main.ts`; **không** đặt dưới `master-data/` — khác với units/categories) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng `products`: `code`, `name`, `category_id`, `default_uom_id`, `active`, `deleted_at`, audit.
- Bảng `product_variants`: `product_id`, `sku`, `barcode` (nullable), `deleted_at`, audit; SKU unique (partial, bản ghi chưa xóa mềm).
- Bảng `product_variant_attribute_values`: `(variant_id, attribute_value_id)`; nghiệp vụ: mỗi `attribute_id` tối đa một value trong variant; không trùng tổ hợp giá trị giữa hai variant cùng product.
- API: list product (phân trang, `q`, `category_id`, `active`, `includeDeleted`, `includeVariants?`), get by id (embed category, UoM, variants + attribute values), POST/PATCH/DELETE product; POST/PATCH/DELETE variant lồng dưới `/products/:id/variants`.
- Phụ thuộc entity/FK: `categories`, `units`, `attribute_values` (đã có trong codebase).
- HTTP: 201/200/204/404/409/422; payload lỗi `code` + `message` thống nhất WMS.
- Xóa variant/product: **409** khi có tham chiếu kho/chứng từ tới `variant_id` — khi chưa có module kho, có thể stub kiểm tra `count = 0`.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + quy ước dự án)

```
src/
├── database/
│   └── entities/
│       ├── product.entity.ts
│       ├── product-variant.entity.ts
│       └── product-variant-attribute-value.entity.ts   # bảng nối (hoặc gộp tên ngắn tùy team)
├── common/
│   ├── constants/
│   │   └── error-code.constant.ts                      # bổ sung mã PRODUCT_* / VARIANT_* (hoặc file riêng nếu dự án tách)
│   ├── repositories/
│   │   └── base.repository.ts                          # đã có — repository module kế thừa
│   └── exceptions/
│       └── product.exceptions.ts                         # tùy chọn, thống nhất 404/409
└── modules/
    └── products/
        ├── products.module.ts
        ├── products.controller.ts
        ├── services/
        │   └── products.service.ts                     # transaction tạo/sửa variant + map; validate attribute set
        ├── repositories/
        │   ├── products.repository.ts                  # product list/detail + soft delete
        │   └── product-variants.repository.ts          # variant + junction (có thể gộp 1 file nếu muốn tối giản)
        └── dto/
            ├── create-product.dto.ts
            ├── update-product.dto.ts
            ├── list-products-query.dto.ts
            ├── get-product-query.dto.ts
            ├── product-response.dto.ts
            ├── create-product-variant.dto.ts
            ├── update-product-variant.dto.ts
            └── product-variant-response.dto.ts           # hoặc gộp vào product-response khi embed
```

- Entity kế thừa `shared/base.entity.ts` (`id`, `createdAt`, `updatedAt`, `deletedAt`) cho `products` và `product_variants`; bảng nối có thể chỉ cần PK composite / surrogate + FK, không bắt buộc soft-delete.
- `TypeOrmModule.forFeature([Product, ProductVariant, ProductVariantAttributeValue])` trong `ProductsModule`.

## 4. Thứ tự công việc đề xuất

1. **Migration / entity**: tạo 3 bảng + index unique partial (`products.code`, `product_variants.sku`, và unique `(variant_id, attribute_value_id)` hoặc `(variant_id, attribute_id)` nếu denormalize — khớp [detail-design](./detail-design.md)).
2. **Repositories**: query list product có join filter category; variant repo: CRUD map, đếm variant trùng tổ hợp theo `product_id`.
3. **ProductsService**: validate `attributeValueIds` (join/load `attribute_values` → nhóm `attribute_id`); chuẩn hóa trim `code`/`sku`; transaction khi tạo/sửa variant (ghi variant, replace junction rows).
4. **DTO + `ValidationPipe`**; mã lỗi + exceptions (duplicate code/SKU, invalid attribute set, duplicate combo).
5. **ProductsController**: `GET /products`, `GET /products/:id`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`; `POST /products/:id/variants`, `PATCH /products/:id/variants/:variantId`, `DELETE /products/:id/variants/:variantId`.
6. Đăng ký `ProductsModule` trong `app.module.ts`.

## 5. Phụ thuộc / rủi ro

- **Master data**: category/unit/attribute value phải tồn tại và (theo policy) `active` / chưa xóa mềm khi gán.
- **Units service**: sau khi có product, cập nhật kiểm tra xóa unit (đã mô tả trong [units plan](../master-data/units/plan.md)) — đếm `products.default_uom_id`.
- **Kho / chứng từ**: khi có FK từ tồn → `product_variants.id`, thay stub xóa bằng kiểm tra thật (409).
- **Quyết định API**: tạo product **có** hay **không** nested variant đầu tiên trong `POST /products` — chọn một và ghi rõ trong OpenAPI/Swagger.

## 6. Kiểm thử gợi ý

- CRUD product + duplicate `code` (409).
- Tạo hai variant cùng tổ hợp `attributeValueIds` (sau khi sort) → 409/422.
- Hai `attribute_value_id` cùng `attribute_id` trong một variant → lỗi validation.
- SKU trùng (409); xóa product/variant — idempotent DELETE nếu team thống nhất với master-data.
