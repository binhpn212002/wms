# Kế hoạch triển khai — Nhà cung cấp (suppliers)

## 1. Xác định module

| Mục | Giá trị |
|-----|---------|
| Tên module (NestJS) | `suppliers` |
| Phạm vi | `suppliers` + `supplier_contacts` (MVP theo [detail-design.md](./detail-design.md)) |
| Tài liệu | [basic-design.md](./basic-design.md), [detail-design.md](./detail-design.md) |
| Base API | `/api/v1/suppliers` (global prefix `api/v1` trong `main.ts`) |

## 2. Mục tiêu theo MVP (detail-design)

- Bảng `suppliers`: `code`, `name`, `tax_id` (nullable), `notes` (nullable), `active`, `deleted_at`, audit; `code` unique (partial, bản ghi chưa xóa mềm); `tax_id` unique tùy policy (validate service).
- Bảng `supplier_contacts`: `supplier_id`, `name`, `phone`, `email`, `title`, `is_primary`, `deleted_at`, audit; tối đa một `is_primary = true` mỗi supplier (transaction khi đổi primary).
- API: list (phân trang, `q`, `active`, `includeDeleted`, `includeContacts?`, `sort`), get by id (embed contacts, primary trước), POST/PATCH/DELETE supplier; POST/PATCH/DELETE contact lồng dưới `/suppliers/:id/contacts`.
- Xóa supplier (soft): **409** khi còn inbound tham chiếu `supplier_id` — khi chưa có module inbound, stub `count = 0` hoặc kiểm tra bảng placeholder migration sau.
- HTTP: 201/200/204/404/409/422; payload lỗi `code` + `message` thống nhất WMS.

## 3. Cấu trúc thư mục (theo [plan.promt.md](../../promt/plan.promt.md) + quy ước dự án)

```
src/
├── database/
│   └── entities/
│       ├── supplier.entity.ts
│       └── supplier-contact.entity.ts
├── common/
│   ├── constants/
│   │   └── error-code.constant.ts                    # bổ sung mã SUPPLIER_* / SUPPLIER_CONTACT_* (hoặc file riêng nếu dự án tách)
│   ├── repositories/
│   │   └── base.repository.ts                        # đã có — repository module kế thừa
│   └── exceptions/
│       └── supplier.exceptions.ts                    # tùy chọn, thống nhất 404/409
└── modules/
    └── suppliers/
        ├── suppliers.module.ts
        ├── suppliers.controller.ts
        ├── services/
        │   └── suppliers.service.ts                  # transaction đặt primary; validate xóa supplier vs inbound
        ├── repositories/
        │   ├── suppliers.repository.ts               # list/detail + soft delete supplier
        │   └── supplier-contacts.repository.ts       # CRUD contact theo supplier_id
        └── dto/
            ├── create-supplier.dto.ts
            ├── update-supplier.dto.ts
            ├── list-suppliers-query.dto.ts
            ├── get-supplier-query.dto.ts
            ├── supplier-response.dto.ts
            ├── create-supplier-contact.dto.ts
            ├── update-supplier-contact.dto.ts
            └── supplier-contact-response.dto.ts
```

- Entity kế thừa `shared/base.entity.ts` (`id`, `createdAt`, `updatedAt`, `deletedAt`) cho `suppliers` và `supplier_contacts`.
- `SupplierContactEntity`: quan hệ `ManyToOne` → `Supplier`; index `(supplier_id)`.
- `TypeOrmModule.forFeature([Supplier, SupplierContact])` trong `SuppliersModule`.

## 4. Thứ tự công việc đề xuất

1. **Migration / entity**: tạo 2 bảng + index unique partial `suppliers.code`; optional unique partial `tax_id` khi policy bật; FK `supplier_contacts.supplier_id` → `suppliers.id` (`ON DELETE RESTRICT` hoặc tương đương).
2. **Repositories**: list supplier có filter `q` (ILIKE `code`/`name`), `active`, `includeDeleted`; contacts theo `supplierId` + sắp xếp primary trước.
3. **SuppliersService**: trim `code`/`tax_id`; duplicate code (409); khi `POST/PATCH` contact với `isPrimary`: unset primary cũ trong transaction; xóa supplier: gọi kiểm tra inbound (stub/real).
4. **DTO + `ValidationPipe`**; mã lỗi + exceptions (duplicate code/tax_id, not found, conflict inbound).
5. **SuppliersController**: `GET /suppliers`, `GET /suppliers/:id`, `POST /suppliers`, `PATCH /suppliers/:id`, `DELETE /suppliers/:id`; `POST /suppliers/:id/contacts`, `PATCH /suppliers/:id/contacts/:contactId`, `DELETE /suppliers/:id/contacts/:contactId`.
6. Đăng ký `SuppliersModule` trong `app.module.ts`.

## 5. Phụ thuộc / rủi ro

- **Inbound**: khi có bảng phiếu nhập + `supplier_id`, thay stub xóa supplier bằng đếm tham chiếu thật (409). FK inbound nên `ON DELETE RESTRICT` — khớp [detail-design](./detail-design.md).
- **Quyết định API**: `POST /suppliers` có hay không nested `contacts[]` — chọn một và ghi trong Swagger.
- **Primary contact**: nếu DB không partial-unique tiện, enforce tại service + transaction (đã mô tả detail-design).

## 6. Kiểm thử gợi ý

- CRUD supplier + duplicate `code` (409).
- Tạo hai contact cùng supplier, đặt `isPrimary` lần lượt — chỉ một primary còn `true`.
- Xóa supplier khi inbound stub = 0 (204); sau khi có inbound fixture — có FK → 409.
- List `q` khớp `code`/`name`; `active=false` không xuất hiện trong gợi ý phiếu mới (kiểm thử integration/UI sau).
