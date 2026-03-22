# Xuất kho (outbound) — Detail design



## Tài liệu tham chiếu

- [Kế hoạch triển khai](./plan.md)
- [Basic design](./basic-design.md)

- [Tồn kho — detail design](../inventory/detail-design.md) (`stock_balances`, `inventory_movements`, khóa, transaction, `OUTBOUND_ISSUE`)

- [Kho & vị trí — detail design](../warehouses/detail-design.md) (`warehouse_id`, `location_id` nguồn, `type = bin`)

- [Sản phẩm — detail design](../products/detail-design.md) (`variant_id`, UoM mặc định, xóa mềm variant)

- [Nhập kho — detail design](../inbound/detail-design.md) (đối chiếu schema chứng từ + transaction complete; inbound có `supplier_id`, outbound **không**)



## Phạm vi MVP



- **Phiếu xuất** (header): số chứng từ, ngày chứng từ, kho, lý do xuất (optional), trạng thái workflow, audit — **không** `supplier_id` ([basic](./basic-design.md), [suppliers detail](../suppliers/detail-design.md)).

- **Dòng phiếu**: biến thể, số lượng > 0 (theo UoM mặc định của sản phẩm chứa variant), vị trí **nguồn** (`bin` trong đúng kho).

- **Hoàn tất (`completed`)**: trong **một transaction** — đọc/khóa `stock_balances`, kiểm tra đủ tồn, trừ balance, insert `inventory_movements` ([inventory detail](../inventory/detail-design.md)); không ghi tồn “trần” ngoài luồng này.

- **Immutable sau complete**: không sửa/xóa số lượng đã ghi; MVP **cấm** chỉnh sửa dòng/header sau `completed` (điều chỉnh sau MVP).



## Mô hình dữ liệu



### Bảng `outbound_documents` (header)



| Cột | Kiểu | Bắt buộc | Mô tả |

|-----|------|----------|--------|

| `id` | UUID (PK) | Có | Khóa phiếu |

| `document_no` | string | Có | Số phiếu — **unique** trong phạm vi policy (vd. toàn hệ thống hoặc theo `warehouse_id` + năm — **thống nhất một quy ước**) khi không xóa mềm |

| `document_date` | date | Có | Ngày trên chứng từ (có thể khác `created_at`) |

| `warehouse_id` | UUID (FK → `warehouses.id`) | Có | Kho xuất — tồn tại, chưa xóa mềm; có thể thêm rule `warehouses.active = true` cho phiếu mới (đồng bộ warehouses) |

| `status` | string / enum | Có | `draft` \| `confirmed` \| `completed` — hoặc rút gọn MVP: chỉ `draft` \| `completed` ([basic](./basic-design.md)) |

| `reason` | text, nullable | Không | Lý do xuất (ghi chú nghiệp vụ) |

| `notes` | text, nullable | Không | Ghi chú header khác |

| `deleted_at` | timestamptz, nullable | Không | Xóa mềm **chỉ khi policy cho phép** (thường chỉ `draft`); phiếu `completed` không xóa mềm trong MVP |

| `created_at` | timestamptz | Có | Audit |

| `updated_at` | timestamptz | Có | Audit |

| `created_by` | UUID, nullable | Không | FK user — nếu có bảng user |

| `updated_by` | UUID, nullable | Không | FK user |



**Index gợi ý**



- Unique (full hoặc partial theo quy ước `document_no`): tránh trùng số phiếu.

- `(warehouse_id, document_date)`, `(status)` — danh sách / lọc.

- `(created_at)` — sắp xếp theo thời gian tạo.



**FK & quy tắc**



- `warehouse_id` → `warehouses.id` — RESTRICT.



### Bảng `outbound_lines` (dòng)



| Cột | Kiểu | Bắt buộc | Mô tả |

|-----|------|----------|--------|

| `id` | UUID (PK) | Có | Khóa dòng |

| `outbound_document_id` | UUID (FK → `outbound_documents.id`) | Có | Phiếu cha |

| `line_no` | integer | Có | Thứ tự hiển thị / in (1, 2, 3…) — unique per `outbound_document_id` |

| `variant_id` | UUID (FK → `product_variants.id`) | Có | SKU — chưa xóa mềm, hợp lệ ([products detail](../products/detail-design.md)) |

| `quantity` | decimal numeric | Có | `> 0`; scale theo chính sách (vd. 4); đơn vị = **`products.default_uom_id`** của product chứa variant |

| `location_id` | UUID (FK → `locations.id`) | Có | Ô **nguồn** — thuộc **đúng** `outbound_documents.warehouse_id`, `locations.type = 'bin'`, chưa xóa mềm ([warehouses detail](../warehouses/detail-design.md)) |



**Index gợi ý**



- `(outbound_document_id)` — tất cả dòng của phiếu.

- Unique `(outbound_document_id, line_no)`.



**FK**



- `outbound_document_id` → `outbound_documents.id` — on delete **RESTRICT** (xóa dòng qua API khi `draft`).

- `variant_id` → `product_variants.id` — RESTRICT.

- `location_id` → `locations.id` — RESTRICT.



**Quy tắc**



- Không dùng `warehouses.default_location_id` để suy ô nguồn — mỗi dòng phải có `location_id` hợp lệ ([basic](./basic-design.md)).

- Cho phép nhiều dòng cùng `variant_id` + `location_id` — mỗi dòng **một** dòng ledger với `reference_line_id` để truy vết; khi complete, khóa và trừ theo từng dòng (hoặc gộp quantity trước khi một movement — **khuyến nghị một movement mỗi dòng** cho audit rõ).



## Luồng hoàn tất & tồn kho



### Transaction khi `POST .../complete`



1. **Khóa phiếu**: `SELECT ... FOR UPDATE` trên `outbound_documents` WHERE `id = :id` — từ chối nếu không phải `draft` hoặc `confirmed` (tùy workflow), hoặc đã `completed` (**idempotent**: trả **200** + body giữ nguyên hoặc **409** “already completed” — **thống nhất một**).

2. **Đọc dòng**: tất cả `outbound_lines` của phiếu; reject nếu không có dòng nào (**422**).

3. **Validate tham chiếu**: warehouse, location (bin + cùng kho), variant theo các rule ở [basic](./basic-design.md) và detail warehouses / products.

4. **Sắp xếp khóa balance**: danh sách khóa `(warehouse_id, location_id, variant_id)` **unique** (gộp nhiều dòng cùng khóa thành một nhóm trừ tổng **hoặc** giữ từng dòng — nếu gộp phải cộng `quantity` trước khi một lần trừ; MVP đơn giản: **khóa và xử lý theo từng dòng** theo `line_no` nhưng **thứ tự khóa** vẫn sort `(warehouse_id, location_id, variant_id)` để tránh deadlock khi cùng ô+SKU nhiều dòng), sort **cố định**.

5. Với mỗi dòng (theo thứ tự đã sort khóa):

   - `SELECT ... FOR UPDATE` trên `stock_balances` WHERE `(warehouse_id, location_id, variant_id)` = phiếu.`warehouse_id` + dòng.`location_id` + dòng.`variant_id`.

   - Nếu không có dòng balance: coi `quantity` = 0 (hoặc reject **409** insufficient — **thống nhất**: thiếu dòng balance với qty yêu cầu > 0 ⇒ **409**).

   - Nếu `balance.quantity` < dòng.`quantity`: **409** `INSUFFICIENT_STOCK` (hoặc mã tương đương) — không partial complete.

   - **Update** `stock_balances`: trừ `quantity`; sau cập nhật phải thỏa CHECK `quantity >= 0`.

   - **Insert** `inventory_movements`: `quantity_delta` = −`quantity` dòng, `movement_type` = `OUTBOUND_ISSUE`, `reference_type` = `outbound`, `reference_id` = `outbound_documents.id`, `reference_line_id` = `outbound_lines.id`.

6. **Cập nhật** `outbound_documents.status` = `completed`, `updated_at`.

7. **Commit**.



### `POST .../validate` (dry-run)



- Thực hiện bước 2–5 **logic** (đọc balance hiện tại, so sánh) trong transaction **READ ONLY** hoặc không transaction — **không** `UPDATE` balance, **không** insert movement, **không** đổi `status`.

- Response: `200` + `{ "ok": true }` hoặc **409** với danh sách dòng thiếu hàng (cùng shape lỗi với complete).



### Idempotent complete



- Nếu `status` đã `completed`: không ghi lại movement/balance; response thành công (GET-by-id trả cùng trạng thái) hoặc mã lỗi rõ ràng — chọn một cho toàn API chứng từ.



### Immutable



- Sau `completed`: **không** `UPDATE`/`DELETE` `outbound_lines` và **không** sửa `warehouse_id`, số lượng — **409** hoặc **422** tùy policy.



## Quy tắc nghiệp vụ (tóm tắt)



| Chủ đề | Quy tắc |

|--------|---------|

| Vị trí | `location_id` nguồn thuộc `warehouse_id` của phiếu; `type = bin`; **bắt buộc** trên mỗi dòng |

| Variant | Chưa xóa mềm; conflict policy: **409** |

| UoM | Chỉ `products.default_uom_id`; không đổi UoM trên dòng outbound MVP |

| Tồn | Chỉ qua bước complete; ledger + balance cùng transaction; thiếu tồn: **409** ([basic](./basic-design.md)) |



## API



Base path gợi ý: `/outbound` (prefix `/api/v1` nếu có versioning). JSON **camelCase**; lỗi `code` + `message` đồng bộ [products detail](../products/detail-design.md).



### `POST /outbound`



- **Mục đích**: Tạo phiếu `draft`.

- **Body (gợi ý)**: `warehouseId`, `documentNo?` (nếu hệ thống không auto-gen), `documentDate?` (mặc định today), `reason?`, `notes?`.

- **Response**: `201` + object phiếu (kèm `id`, `status`, …).



### `GET /outbound`



- **Mục đích**: Danh sách có phân trang / lọc.

- **Query (gợi ý)**: `page`, `pageSize`, `warehouseId`, `status`, `from`, `to` (theo `documentDate` hoặc `createdAt`), `q` (số phiếu).



### `GET /outbound/:id`



- **Mục đích**: Chi tiết phiếu + embed lines (hoặc lines qua sub-resource tùy payload size).

- **404**: không tồn tại hoặc không thuộc phạm vi quyền (thống nhất với dự án).



### `PATCH /outbound/:id`



- **Mục đích**: Sửa header khi `draft` (và `confirmed` nếu policy cho phép).

- **409/422**: đã `completed` hoặc trạng thái không cho sửa.



### `PUT /outbound/:id/lines` hoặc `PATCH` từng phần



- **Mục đích**: Thay thế toàn bộ dòng hoặc CRUD dòng khi `draft`.

- **Body line (gợi ý)**: `lineNo`, `variantId`, `quantity`, `locationId` (nguồn, bắt buộc).

- **422**: tổng hợp lỗi validation (sai kho–location, quantity ≤ 0, thiếu ô).



### `POST /outbound/:id/validate`



- **Mục đích**: Dry-run kiểm tồn — không ghi sổ ([basic](./basic-design.md)).

- **200** nếu đủ hàng; **409** nếu thiếu (chi tiết theo dòng).



### `POST /outbound/:id/submit` / `POST /outbound/:id/confirm`



- **Mục đích**: Chuyển workflow nếu có bước `confirmed` — có thể **bỏ** trong MVP một bước.



### `POST /outbound/:id/complete`



- **Mục đích**: Validate + trừ tồn + ledger + set `completed`.

- **200**: thành công; **409**: trùng số phiếu / trạng thái / **thiếu tồn** / idempotent conflict; **422**: validation.



### `DELETE /outbound/:id` (tùy chọn)



- **Mục đích**: Xóa mềm chỉ khi `draft` — **404/409** nếu không được phép.



## Mã lỗi & HTTP (gợi ý)



| Tình huống | HTTP |

|------------|------|

| Tạo / đọc / cập nhật thành công | 201 / 200 |

| Validation body/query (sai warehouse–location, quantity không hợp lệ) | 422 |

| Trùng `document_no`, trạng thái không cho phép thao tác, variant conflict | 409 |

| **Không đủ tồn** khi complete hoặc validate | **409** (`INSUFFICIENT_STOCK` hoặc tương đương) |

| Warehouse / location / variant không tồn tại hoặc vi phạm xóa mềm / active | 404 hoặc 409 (thống nhất dự án) |

| Không đủ quyền | 403 |



Payload lỗi: `code` + `message`; mã `code` nên map vào error-code constant khi triển khai (đồng bộ [inbound detail](../inbound/detail-design.md)).



## Ghi chú triển khai



- **Service layer**: `OutboundService` gọi module/repository **inventory** (shared) cho bước apply balance + movement — không nhân đôi SQL ledger ở controller.

- **TypeORM**: quan hệ `OutboundDocument` 1-N `OutboundLine`; transaction qua `EntityManager` / `QueryRunner`.

- **Số phiếu**: sequence per warehouse hoặc global — document trong basic; implement một generator có transaction để tránh trùng khi concurrent `POST`.



## Mở rộng sau MVP



- **Reservation** khi `draft`; available = quantity − reserved ([inventory detail](../inventory/detail-design.md)).

- Phiếu điều chỉnh / phiếu ngược; batch/serial; `customer_id` / `sales_order_id`; allocation FEFO/FIFO ([basic](./basic-design.md)).

- Workflow duyệt đa cấp; in phiếu PDF.


