# Xuất kho — Basic design



## Tài liệu tham chiếu

- [Detail design](./detail-design.md)
- [Kế hoạch triển khai](./plan.md)
- [Tồn kho — detail design](../inventory/detail-design.md) (ghi `stock_balances` + `inventory_movements`, khóa, transaction, `OUTBOUND_ISSUE`)

- [Kho & vị trí — detail design](../warehouses/detail-design.md) (`warehouse_id`, `location_id` nguồn, chỉ `type = bin` cho tồn)

- [Sản phẩm — detail design](../products/detail-design.md) (`variant_id` → `product_variants.id`, UoM mặc định, xóa mềm variant)

- [Tồn kho — basic design](../inventory/basic-design.md) (tổng quan balance / variant / location)

- [Nhập kho — basic design](../inbound/basic-design.md) (đối chiếu luồng chứng từ + complete; **phiếu xuất không** dùng `supplier_id` — tham chiếu NCC thuộc nhập kho, xem [nhà cung cấp — detail design](../suppliers/detail-design.md))



## Mục đích



Tạo **phiếu xuất**, khai báo **kho** và **dòng** (`variant_id` + số lượng + **vị trí nguồn**); trước khi hoàn tất **kiểm tra đủ tồn** tại từng `(warehouse_id, location_id, variant_id)`; khi **hoàn tất**, **trừ tồn** trong một transaction cùng **nhật ký ledger** — không ghi tồn “trần” ngoài luồng nghiệp vụ ([inventory detail](../inventory/detail-design.md)).



## Phạm vi MVP



### Phiếu (header)



| Khái niệm | Mô tả |

|-----------|--------|

| **Outbound document** | Số phiếu (`document_no` hoặc tương đương), ngày chứng từ, `warehouse_id` → `warehouses.id`, lý do xuất (optional), trạng thái, audit người tạo / cập nhật |

| **Trạng thái** | `draft` → có thể `confirmed` (tùy workflow) → `completed` (đã trừ tồn). MVP có thể gộp: `draft` → `completed` nếu không cần bước duyệt — **một** quy ước cho toàn dự án |



### Dòng phiếu (lines)



| Khái niệm | Mô tả |

|-----------|--------|

| **Outbound line** | `variant_id` → `product_variants.id`, `quantity` > 0 (theo UoM mặc định của sản phẩm chứa variant — [products detail](../products/detail-design.md)), `location_id` **nguồn** → `locations.id` (ô lấy hàng) |



## Quy tắc nghiệp vụ



### Trừ tồn khi `completed`



- Trong **một transaction**: với mỗi dòng — đọc / khóa `stock_balances` theo `(warehouse_id, location_id, variant_id)`, kiểm tra `quantity >= requested_qty`, sau đó **cập nhật** balance (trừ) và **insert** `inventory_movements` với `quantity_delta` < 0, `movement_type` = `OUTBOUND_ISSUE`, `reference_type` = `outbound`, `reference_id` = id phiếu, `reference_line_id` = id dòng ([inventory detail](../inventory/detail-design.md)).

- **Khóa** dòng balance theo thứ tự cố định trên nhiều dòng (vd. sort `(warehouse_id, location_id, variant_id)`) để tránh deadlock.

- **Immutable**: sau `completed`, không sửa số lượng đã ghi; sửa sai = phiếu điều chỉnh / phiếu ngược (sau MVP) — MVP có thể **cấm** sửa/xóa phiếu đã `completed`.



### Kiểm tra tồn (trước `complete` hoặc dry-run)



- Với mỗi dòng: `available` ≥ `requested` — MVP `available` = `quantity` trên `stock_balances` (chưa trừ reserve; xem mở rộng).

- Không cho `complete` nếu thiếu hàng: **409** (hoặc **422** thống nhất dự án) với chi tiết theo dòng hoặc gom lỗi trong payload.

- Endpoint **`POST /outbound/:id/validate`** (dry-run): chỉ đọc + cùng logic kiểm tra, **không** ghi tồn.



### Vị trí nguồn



- Chỉ chấp nhận `location_id` thuộc đúng `warehouse_id` của phiếu và `locations.type = bin` ([warehouses detail](../warehouses/detail-design.md)).

- Không dùng `warehouses.default_location_id` làm nguồn mặc định cho xuất (default phục vụ **đích** nhập nhanh); mỗi dòng xuất phải chỉ định ô nguồn rõ ràng hoặc quy ước allocation sau (ngoài MVP nếu không mô tả).



### Biến thể (SKU)



- Không ghi movement cho variant đã xóa mềm / không hợp lệ; xung đột tham chiếu kho: **409** ([products detail](../products/detail-design.md)).



### Đơn vị tính



- `quantity` trên dòng và trên tồn luôn theo **`products.default_uom_id`** của sản phẩm chứa variant — không đổi UoM trên dòng outbound trong MVP ([inventory detail](../inventory/detail-design.md)).



### Đồng thời với nhập / chuyển kho



- Trừ tồn **atomic** với các luồng khác cùng chạm balance: cùng transaction + lock như trên; thứ tự khóa cố định giữa phiếu để tránh deadlock ([inventory detail](../inventory/detail-design.md)).



## Liên kết module



- **Products (variants)**: dòng `variant_id`; không FK nhà cung cấp trên phiếu xuất MVP ([suppliers detail](../suppliers/detail-design.md) — `supplier_id` thuộc nhập kho).

- **Warehouses / locations**: header `warehouse_id`; dòng `location_id` nguồn (bin).

- **Inventory**: chỉ ghi qua service outbound (hoặc shared inventory service) khi complete — không CRUD tay balance từ API inventory.



## Gợi ý API



Base path gợi ý: `/outbound` (prefix `/api/v1` nếu dự án version hóa). Field JSON **camelCase**; payload lỗi `code` + `message` đồng bộ [products detail](../products/detail-design.md).



- `POST /outbound` — tạo phiếu `draft` (body: `warehouseId`, `documentDate?`, `reason?`, …).

- `PATCH /outbound/:id` — sửa header khi còn `draft` (và `confirmed` nếu policy cho phép).

- `PATCH /outbound/:id/lines` hoặc `PUT` thay thế toàn bộ dòng — khi `draft`.

- `POST /outbound/:id/validate` — dry-run kiểm tồn (không ghi sổ).

- `POST /outbound/:id/submit` / `POST /outbound/:id/confirm` — tùy workflow (bỏ qua nếu một bước).

- `POST /outbound/:id/complete` — validate + trừ tồn + ledger; idempotent theo policy (không complete hai lần).



## Mã lỗi & HTTP (gợi ý)



| Tình huống | HTTP |

|------------|------|

| Tạo / đọc / cập nhật thành công | 201 / 200 |

| Validation body/query (thiếu ô, sai warehouse–location, …) | 422 |

| Trùng số phiếu, trạng thái không cho phép thao tác | 409 |

| **Không đủ tồn** tại dòng khi complete / validate thất bại | **409** (gợi ý mã `INSUFFICIENT_STOCK` hoặc tương đương — thống nhất [inventory detail](../inventory/detail-design.md)) |

| Variant / warehouse / location không hợp lệ hoặc vi phạm policy xóa mềm / active | 404 hoặc 409 (thống nhất dự án) |

| Không đủ quyền | 403 |



## Phân quyền (tham chiếu)



- NV kho: tạo / nhập dòng / complete (hoặc chỉ draft tùy policy).

- Manager: duyệt / confirm (nếu bật workflow).

- Admin: toàn quyền.



## Mở rộng sau MVP



- **Reservation** (giữ hàng cho phiếu `draft`): `reserved_qty` hoặc bảng reserve; available = quantity − reserved ([inventory detail](../inventory/detail-design.md)).

- Xuất kèm **batch / serial**, đa UoM, khách hàng / đơn hàng ngoài (`customer_id`, `sales_order_id`).

- Allocation tự động ô nguồn (FEFO/FIFO) khi không chỉ định `locationId` từng dòng.

