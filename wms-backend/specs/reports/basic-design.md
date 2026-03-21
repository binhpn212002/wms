# Báo cáo cơ bản — Basic design

## Mục đích

**Tồn kho**, **lịch sử nhập xuất**, **top sản phẩm** (theo số lượng hoặc giá trị nếu có đơn giá).

## Phạm vi MVP

| Báo cáo | Nội dung |
|---------|----------|
| **Tồn kho** | Snapshot theo variant / kho / vị trí; filter theo ngày = hiện tại |
| **Lịch sử nhập xuất** | Danh sách chứng từ inbound/outbound/transfer theo khoảng thời gian, loại, kho |
| **Top sản phẩm** | Theo số lượng xuất hoặc nhập trong kỳ (aggregate từ lines) |

## Quy tắc

- Ưu tiên đọc từ **bảng chứng từ + dòng** và/hoặc **bảng audit movement** (nếu sau này tách ledger).
- Export CSV optional MVP+1.

## Liên kết module

- **Inventory**, **Inbound**, **Outbound**, **Transfers**, **Products**.

## Gợi ý API

- `GET /reports/stock-on-hand?...`
- `GET /reports/movements?from=&to=&type=`
- `GET /reports/top-products?period=&limit=`
