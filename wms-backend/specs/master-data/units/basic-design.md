# Đơn vị tính (units) — Basic design

## Tài liệu tham chiếu

- [Master data — tổng quan](../basic-design.md)
- [Sản phẩm — basic design](../../products/basic-design.md)

## Mục đích

Chuẩn hóa **đơn vị đo lường (UoM)** dùng trên sản phẩm và trên chứng từ kho (nhập/xuất/chuyển): cái, thùng, kg, pallet, …

## MVP

| Khía cạnh | Nội dung |
|-----------|----------|
| **Trường gợi ý** | `code`, `name`, `symbol` (tùy chọn — hiển thị ngắn: `kg`, `cái`), `active` |
| **Audit / xóa mềm** | `created_at`, `updated_at`, `deleted_at` (nullable) — cùng hướng với các master-data khác (attributes, categories, …) |
| **Quy đổi** | Quan hệ giữa hai đơn vị (thùng ↔ cái, hộp ↔ viên) — **ngoài MVP**; sau có thể bảng `uom_conversions` hoặc tương đương |

## Quy tắc

- **`code`**: unique trong phạm vi bản ghi **chưa xóa mềm** (VD: `PCS`, `BOX`, `KG`, `PALLET`). Chuẩn hóa chữ hoa/thường theo quy ước dự án (thường uppercase cho mã nghiệp vụ).
- **`active = false`**: ẩn khỏi dropdown gán mới; bản ghi đã tham chiếu vẫn hiển thị trong lịch sử chứng từ tùy policy.
- **Xóa**: **xóa mềm** là mặc định; **chặn** (409) nếu còn `products.default_uom_id` hoặc dòng chứng từ/định mức tham chiếu đơn vị này — thống nhất với [master data — tổng quan](../basic-design.md).
- **Product**: `default_uom_id` → `units.id` (sản phẩm bán/theo tồn theo một UoM mặc định).

## Liên kết module

- **Products**: UoM mặc định trên product; dòng inventory/chứng từ có thể lưu `uom_id` + số lượng theo đơn vị đó (chi tiết module kho ngoài phạm vi file này).

## API gợi ý

Base path: `/master-data/units` (prefix global `/api/v1` nếu dự án dùng versioning).

- `GET /master-data/units` — danh sách phân trang + lọc (`q`, `active`, `includeDeleted` nếu cần admin).
- `GET /master-data/units/:id`
- `POST /master-data/units`
- `PATCH /master-data/units/:id`
- `DELETE /master-data/units/:id` — xóa mềm hoặc chặn khi còn tham chiếu.

## Ngoài MVP (gợi ý)

- Bảng quy đổi đa cấp (theo product hoặc global).
- Nhóm đơn vị (dimensionless / mass / length / volume) để validate quy đổi.
