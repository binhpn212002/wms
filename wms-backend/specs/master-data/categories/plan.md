# Kế hoạch triển khai — Loại sản phẩm (categories)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `categories` |
| Phạm vi | Master data — CRUD danh mục dạng cây (MVP) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API (gợi ý) | `/api/v1/master-data/categories` (theo `main.ts` + global prefix nếu có) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng `categories`: `code`, `name`, `parent_id` (nullable), `active`, soft delete `deleted_at`, audit.
- Unique partial `code` khi `deleted_at IS NULL` (migration Postgres).
- API: list (phân trang + lọc), optional tree, get by id, POST, PATCH, DELETE (soft).
- Quy tắc: trim/chuẩn hoá `code`, không chu trình cây, `parent` phải tồn tại và chưa xóa mềm; xóa mềm chặn khi còn product (khi entity Product có `category_id`) hoặc khi còn con — **chọn trước khi code**: chặn xóa khi còn con (MVP đơn giản) + chặn khi còn product.
- HTTP: 201/200/204/404/409/422 theo bảng trong detail-design; payload lỗi `code` + `message` thống nhất master-data.

## 3. Cấu trúc thư mục (áp dụng trong `src/`)

```
src/
├── database/
│   ├── entities/
│   │   └── category.entity.ts          # extends BaseEntity + DeleteDateColumn + self-relation parent/children
│   └── migrations/
│       └── xxxxx-create-categories.ts  # bảng + index unique partial (code) WHERE deleted_at IS NULL
├── common/
│   ├── constants/
│   │   └── categories.constant.ts      # tên bảng, mã lỗi nghiệp vụ (optional, có thể gộp module.constant sau)
│   └── repositories/
│       └── base.repository.ts          # đã có — CategoryRepository kế thừa
└── modules/
    └── categories/
        ├── categories.module.ts
        ├── categories.controller.ts
        ├── services/
        │   └── categories.service.ts     # cycle check, soft delete rules, product count khi có Product
        ├── repositories/
        │   └── categories.repository.ts  # findMany + filter q/parent_id/active/includeDeleted/sort
        └── dto/
            ├── create-category.dto.ts
            ├── update-category.dto.ts
            ├── list-categories-query.dto.ts   # mở rộng PageOptionDto hoặc compose
            └── category-response.dto.ts       # nếu cần tách khỏi entity
```

**Ghi chú căn chỉnh codebase hiện tại**

- Entity kế thừa `shared/base.entity.ts` (`id`, `createdAt`, `updatedAt`); thêm `@Column` snake_case qua `name` nếu cột DB là `code`, `parent_id`, …
- Dùng `common/dto/page-option.dto.ts` + `list-response.dto.ts` cho list; query DTO bổ sung `parent_id`, `active`, `includeDeleted`, `sort`.
- Đăng ký `CategoriesModule` trong `app.module.ts` và `TypeOrmModule.forFeature([Category])`.

## 4. Thứ tự công việc đề xuất

1. Migration + `Category` entity (index unique partial, FK `parent_id` → `categories`).
2. `CategoriesRepository` (list, tree build hoặc query recursive/CTE tùy chọn MVP).
3. `CategoriesService`: validate code, parent tồn tại, không cycle (transaction), soft delete + kiểm tra con + product.
4. DTO + `ValidationPipe`; filter/exception filter thống nhất mã lỗi.
5. `CategoriesController`: routes theo detail-design (`GET` list, `GET` tree optional, `GET :id`, `POST`, `PATCH`, `DELETE`).
6. (Sau khi có module Product) bổ sung kiểm tra tham chiếu `products.category_id` trước khi set `deleted_at`.

## 5. Phụ thuộc / rủi ro

- **Product**: rule xóa cần `Product` entity/repository — tạm có thể stub `countByCategoryId` = 0 nếu chưa có bảng `products`.
- **Quyền**: MVP chưa bắt buộc — có thể bỏ guard hoặc guard mở rộng sau.

## 6. Kiểm thử gợi ý

- Unit: cycle detection, unique `code` sau soft delete của bản ghi cũ.
- E2E/API: CRUD + 409 duplicate code + 422 invalid parent/cycle + 409 delete khi còn con (theo rule đã chọn).
