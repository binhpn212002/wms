# Master data — Mục lục

Dữ liệu nền dùng chung; tránh hard-code. **Quy tắc chung**: mã (`code`) duy nhất trong phạm vi từng loại; chặn/xóa mềm khi đang được **Products** tham chiếu.

| Submodule | Mô tả | Tài liệu |
|-----------|--------|----------|
| Loại sản phẩm | Nhóm / phân loại SP | [categories](./categories/basic-design.md) |
| Đơn vị tính | UoM (cái, thùng, kg, …) | [units](./units/basic-design.md) |
| Thuộc tính | Nhóm biến thể (Size, Color, …) | [attributes](./attributes/basic-design.md) |
| Giá trị thuộc tính | Giá trị cụ thể (S, M, Đỏ, …) | [attribute-values](./attribute-values/basic-design.md) |

## Liên kết ngoài

- **Products**: `category_id`, `default_uom_id`, biến thể ↔ giá trị thuộc tính.
