# Kế hoạch triển khai — Thuộc tính (attributes)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `attributes` |
| Phạm vi | Master data — CRUD thuộc tính biến thể phẳng (MVP) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API (gợi ý) | `/api/v1/master-data/attributes` (theo `main.ts` global prefix `api/v1`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng `attributes`: `code`, `name`, `sort_order` (nullable), `active`, soft delete `deleted_at`, audit.
- Unique partial `code` khi `deleted_at IS NULL` (migration Postgres).
- API: list (phân trang + lọc `q`, `active`, `includeDeleted`, `sort`), get by id, POST, PATCH, DELETE (soft).
- Quy tắc: trim/chuẩn hoá `code`; xóa mềm **chặn** khi còn bản ghi `attribute_values` thuộc attribute (sau khi submodule attribute-values có entity/migration); khi đã có Product/variant map qua value — kiểm tra thêm ở tầng value hoặc service (xem detail-design).
- HTTP: 201/200/204/404/409/422 theo bảng trong detail-design; payload lỗi `code` + `message` thống nhất master-data (cùng pattern `categories`).

## 3. Cấu trúc thư mục (áp dụng trong `src/`)

```
src/
├── database/
│   ├── entities/
│   │   └── attribute.entity.ts          # extends BaseEntity + DeleteDateColumn; cột snake_case theo DB
│   └── migrations/
│       └── xxxxx-create-attributes.ts   # bảng + unique partial (code) WHERE deleted_at IS NULL + index sort
├── common/
│   ├── constants/
│   │   └── attributes.constant.ts       # tên bảng, mã lỗi nghiệp vụ (optional)
│   └── repositories/
│       └── base.repository.ts           # đã có — AttributesRepository kế thừa (nếu codebase dùng pattern này)
└── modules/
    └── attributes/
        ├── attributes.module.ts
        ├── attributes.controller.ts
        ├── services/
        │   └── attributes.service.ts      # unique code, soft delete + đếm attribute_values trước xóa
        ├── repositories/
        │   └── attributes.repository.ts   # findMany + filter q/active/includeDeleted/sort
        └── dto/
            ├── create-attribute.dto.ts
            ├── update-attribute.dto.ts
            ├── list-attributes-query.dto.ts   # mở rộng PageOptionDto hoặc compose
            ├── get-attribute-query.dto.ts     # includeDeleted cho GET :id (nếu cần)
            └── attribute-response.dto.ts       # tùy chọn, nếu tách khỏi entity
```

**Ghi chú căn chỉnh codebase hiện tại**

- Entity kế thừa `shared/base.entity.ts` (`id`, `createdAt`, `updatedAt`); map cột DB `sort_order`, `deleted_at`, … qua `@Column({ name: '...' })` nếu property camelCase.
- Dùng `common/dto/page-option.dto.ts` + `list-response.dto.ts` cho list; query DTO bổ sung `q`, `active`, `includeDeleted`, `sort`.
- Đăng ký `AttributesModule` trong `app.module.ts` và `TypeOrmModule.forFeature([Attribute])`.
- Submodule **attribute-values** (sau này): FK `attribute_values.attribute_id` → `attributes.id`; controller tách route `/master-data/attributes/:attributeId/values` — không nhét trong cùng file controller nếu team muốn module riêng (có thể `attribute-values` module + forward hoặc nested controller).

## 4. Thứ tự công việc đề xuất

1. Migration + `Attribute` entity (unique partial index trên `code`).
2. `AttributesRepository`: list có filter, `findById` với tùy chọn include deleted, (optional) `countValuesByAttributeId` khi đã có bảng `attribute_values`.
3. `AttributesService`: validate `code`, soft delete — **409** nếu `countValues > 0` (khi đã có entity/repository values).
4. DTO + `ValidationPipe`; exception / mã lỗi thống nhất với `categories` (duplicate code, conflict delete).
5. `AttributesController`: `GET` list, `GET :id`, `POST`, `PATCH`, `DELETE` theo detail-design.
6. Sau khi có **attribute-values**: bổ sung FK migration + cập nhật rule xóa attribute; sau Product/variant: bổ sung kiểm tra tham chiếu nếu spec yêu cầu.

## 5. Phụ thuộc / rủi ro

- **attribute-values**: MVP xóa attribute có thể tạm **chỉ** kiểm tra bảng `attribute_values` khi bảng đã tồn tại; trước đó có thể cho phép xóa hoặc stub `count = 0`.
- **Product / variant**: không chặn trong module attributes cho đến khi có bảng map — detail-design ghi nhận chặn chủ yếu qua giá trị đang dùng.

## 6. Kiểm thử gợi ý

- Unit: unique `code` sau soft delete bản ghi cũ; DELETE idempotent (204 vs 404) theo quy ước đã chọn.
- E2E/API: CRUD + 409 duplicate code + 409 delete khi còn values (khi đã seed/link values).
