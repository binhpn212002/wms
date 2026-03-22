# Kế hoạch triển khai — Đơn vị tính (units)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `units` |
| Phạm vi | Master data — CRUD đơn vị đo lường phẳng (MVP) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/master-data/units` (global prefix `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng `units`: `code`, `name`, `symbol` (nullable), `active`, soft delete `deleted_at`, audit.
- Unique `code` trong các bản ghi chưa xóa mềm (Postgres: unique partial index khi có migration; dev: TypeORM + kiểm tra `existsBy` với soft-delete scope).
- API: list (phân trang + `q` trên code/name/symbol, `active`, `includeDeleted`, sắp xếp theo `sortBy` + hướng `sort`), get by id, POST, PATCH, DELETE (soft).
- Quy tắc: trim + **uppercase** `code`; `symbol` trim tùy chọn; xóa mềm **chặn (409)** khi còn `products.default_uom_id` (bổ sung khi có entity Product); chứng từ kho — sau khi có bảng FK `uom_id`.
- HTTP: 201/200/204/404/409/422; payload lỗi `code` + `message` thống nhất master-data.

## 3. Cấu trúc thư mục (áp dụng trong `src/`)

```
src/
├── database/
│   └── entities/
│       └── unit.entity.ts
├── common/
│   ├── constants/
│   │   └── error-code.constant.ts    # bổ sung mã lỗi UNIT_*
│   └── exceptions/
│       └── unit.exceptions.ts
└── modules/
    └── units/
        ├── units.module.ts
        ├── units.controller.ts
        ├── services/
        │   └── units.service.ts
        ├── repositories/
        │   └── units.repository.ts
        └── dto/
            ├── create-unit.dto.ts
            ├── update-unit.dto.ts
            ├── list-units-query.dto.ts
            ├── get-unit-query.dto.ts
            └── unit-response.dto.ts
```

- `common/repositories/base.repository.ts`: đã có — `UnitsRepository` kế thừa.
- Entity kế thừa `shared/base.entity.ts` (`id`, `createdAt`, `updatedAt`, `deletedAt`).

## 4. Thứ tự công việc đề xuất

1. Entity `Unit` + đăng ký `TypeOrmModule.forFeature([Unit])`.
2. `UnitsRepository`: list có filter, `findById` + `withDeleted`, `existsActiveByCode` (excludeId khi PATCH), `softDeleteById`.
3. `UnitsService`: chuẩn hoá `code` (uppercase), unique, soft delete — **409** nếu còn product tham chiếu (stub `count = 0` cho đến khi có module Product).
4. DTO + `ValidationPipe`; exceptions + `error-code.constant`.
5. `UnitsController`: `GET` list, `GET :id`, `POST`, `PATCH`, `DELETE` theo detail-design; DELETE idempotent (204 khi đã xóa mềm — giống attributes).

## 5. Phụ thuộc / rủi ro

- **Product**: khi có `products.default_uom_id`, thay stub bằng đếm thật trong service/repository.
- **Quy đổi UoM**: ngoài MVP (`uom_conversions`).

## 6. Kiểm thử gợi ý

- CRUD + duplicate `code` (409) + tìm `q` trên symbol.
- DELETE idempotent; sau Product: 409 khi còn `default_uom_id`.
