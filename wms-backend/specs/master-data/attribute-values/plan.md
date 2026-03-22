# Kế hoạch triển khai — Giá trị thuộc tính (attribute-values)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `attribute-values` |
| Phạm vi | Master data — CRUD giá trị lồng trong một attribute (MVP) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API (gợi ý) | `/api/v1/master-data/attributes/:attributeId/values` (global prefix `api/v1` như `main.ts`) |
| Phụ thuộc | Module `attributes` (FK `attribute_id`); bảng `attributes` đã có migration/entity |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng `attribute_values`: `attribute_id` (FK), `code`, `name`, (nullable), `active`, soft delete `deleted_at`, audit.
- Unique partial `(attribute_id, code)` khi `deleted_at IS NULL` (migration Postgres).
- API: list theo attribute (phân trang + lọc `q`, `active`, `includeDeleted`, `sort`), get by id, POST, PATCH, DELETE (soft).
- Quy tắc: trim/chuẩn hoá `code` trong phạm vi `attribute_id`; validate attribute tồn tại và chưa xóa mềm (trừ policy admin); `id` trong URL phải thuộc đúng `:attributeId`.
- Xóa: **409** khi Product/variant đã map (khi đã có bảng map); trước đó có thể stub `countUsage = 0`.
- HTTP: 201/200/204/404/409/422 theo bảng trong detail-design; payload lỗi `code` + `message` thống nhất master-data (cùng pattern `categories` / `attributes`).

## 3. Cấu trúc thư mục (áp dụng trong `src/`)

```
src/
├── database/
│   ├── entities/
│   │   └── attribute-value.entity.ts    # extends BaseEntity + DeleteDateColumn; FK ManyToOne → Attribute
│   └── migrations/
│       └── xxxxx-create-attribute-values.ts   # bảng + unique partial (attribute_id, code) WHERE deleted_at IS NULL + index
├── common/
│   ├── constants/
│   │   └── attribute-values.constant.ts   # tên bảng, mã lỗi nghiệp vụ (optional)
│   └── repositories/
│       └── base.repository.ts             # đã có — AttributeValuesRepository kế thừa (nếu codebase dùng pattern này)
└── modules/
    └── attribute-values/
        ├── attribute-values.module.ts
        ├── attribute-values.controller.ts # @Controller('master-data/attributes/:attributeId/values')
        ├── services/
        │   └── attribute-values.service.ts
        ├── repositories/
        │   └── attribute-values.repository.ts   # findMany theo attributeId + filter q/active/includeDeleted/sort
        └── dto/
            ├── create-attribute-value.dto.ts
            ├── update-attribute-value.dto.ts
            ├── list-attribute-values-query.dto.ts
            ├── get-attribute-value-query.dto.ts   # includeDeleted cho GET :id (nếu cần)
            └── attribute-value-response.dto.ts    # tùy chọn
```

**Ghi chú căn chỉnh codebase hiện tại**

- Entity kế thừa `shared/base.entity.ts`; quan hệ `@ManyToOne(() => Attribute, …)` hoặc chỉ `@Column` + FK — thống nhất với `attribute.entity.ts`.
- Controller **một file riêng** (không nhét vào `attributes.controller.ts`) để route nested rõ ràng; đăng ký `AttributeValuesModule` trong `app.module.ts` và `TypeOrmModule.forFeature([AttributeValue])`.
- Service: mọi thao tác resolve `attributeId` từ path — kiểm tra attribute tồn tại; với `:id` kiểm tra `attribute_value.attribute_id === attributeId` (404 nếu lệch).
- Dùng `PageOptionDto` + `list-response.dto` cho list; query DTO bổ sung `q`, `active`, `includeDeleted`, `sort`.
- **Không** cho PATCH đổi `attribute_id` (theo detail-design).

## 4. Thứ tự công việc đề xuất

1. Migration + `AttributeValue` entity (FK `attributes`, unique partial index trên `(attribute_id, code)`).
2. `AttributeValuesRepository`: list theo `attributeId`, `findById` scoped theo attribute + `includeDeleted`, (optional) `countUsageByValueId` khi đã có bảng variant map.
3. `AttributeValuesService`: validate parent attribute; unique `(attributeId, code)`; soft delete — **409** nếu còn tham chiếu variant (khi có); trim `code`.
4. DTO + `ValidationPipe`; exception thống nhất với `attributes` (duplicate code scoped, conflict delete).
5. `AttributeValuesController`: `GET` list, `GET :id`, `POST`, `PATCH`, `DELETE` theo detail-design.
6. Cập nhật `AttributesService` / repository: rule xóa attribute đã có — chặn khi `countValuesByAttributeId > 0` (bỏ stub nếu trước đó `count = 0`).

## 5. Phụ thuộc / rủi ro

- **attributes**: bắt buộc có entity + migration `attributes` trước hoặc cùng sprint (FK).
- **Product / variant**: chặn xóa value khi còn map — stub **409** có thể tạm luôn trả “không có map” cho đến khi có repository đếm.
- **Route trùng**: chỉ một module đăng ký path `master-data/attributes/:attributeId/values` — tránh duplicate controller.

## 6. Kiểm thử gợi ý

- Unit: unique `(attributeId, code)` sau soft delete bản ghi cũ trong cùng attribute; hai attribute khác nhau được cùng `code`.
- API: 404 khi `value.id` thuộc attribute khác với `:attributeId`; 404 khi attribute đã soft delete (list/get/create).
- E2E: CRUD + 409 duplicate code + 409 delete khi có variant map (khi đã seed/link).
