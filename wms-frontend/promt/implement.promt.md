# Prompt triển khai Frontend WMS (dùng lại cho AI / dev)

Khi implement hoặc bổ sung **page CRUD** trên `wms-frontend`, bám theo các quy ước dưới đây.

## Stack & kiến trúc

- **React + TypeScript + Vite**, **Ant Design**, **react-router-dom**, **axios** (`src/services/api.ts`, `src/services/request.ts`).
- **Không gọi axios trực tiếp trong page**; mọi HTTP qua **service** tương ứng trong `src/services/*.service.ts` (đã có sẵn theo module).
- **Types** API dùng từ `src/types/` (export qua `src/types/index.ts` nếu cần).

## Cấu trúc file page (CRUD)

Mỗi feature có thể là một thư mục, ví dụ:

```
src/pages/<module>/<entity>/
  <Entity>Page.tsx           # Điều phối: bảng, phân trang, search, mở dialog
  Create<Entity>Dialog.tsx   # Modal + Form, gọi service.create
  Update<Entity>Dialog.tsx   # Modal + Form, gọi service.update
  index.ts                   # export page (nếu thư mục dùng barrel)
```

- **Page**: chỉ nên **orchestrate** (state list, pagination, `q` search, boolean mở dialog, record đang sửa/xóa).
- **Create / Update**: tách **component riêng** (Modal bọc Form), không nhét toàn bộ form vào một file page quá dài.

## Dialog xóa (bắt buộc dùng chung)

- Dùng **`ConfirmDeleteDialog`** từ `src/components/common/ConfirmDeleteDialog.tsx` (export qua `src/components/index.ts`).
- Props: `open`, `title`, `description` (có thể nhúng tên bản ghi), `confirmLoading`, `onConfirm` (async OK), `onCancel`.
- Trong `onConfirm`: gọi `*Service.remove(id)`, `message.success` / `message.error` (Ant Design), đóng dialog, refetch list.

## Hành vi UI / UX

- Bảng: **Table** + **pagination** (`current`, `pageSize`, `total`, `showSizeChanger`), **`rowKey`** ổn định (thường `id`).
- Tìm kiếm: **Input.Search** hoặc tương đương; nên **debounce** query (`src/hooks/useDebouncedValue.ts`) rồi truyền `q` vào `service.list`.
- Sau **create / update / delete** thành công: gọi lại **load list** (và nếu có tree/parent map — load lại luôn).
- Thông báo: **`message`** từ `antd`; validate form dùng `Form` rules.
- Modal: `destroyOnHidden` (Ant Design 6), `confirmLoading` khi submit.
- Nhãn giao diện: **tiếng Việt** thống nhất với các page mẫu (Danh mục, Đơn vị).

## Pattern tham chiếu (code mẫu)

- **Danh mục**: `src/pages/master-data/categories/` — có tree parent (`TreeSelect`), refetch tree sau mutate.
- **Đơn vị**: `src/pages/master-data/units/` — CRUD phẳng, đơn giản.

## Routing

- Thêm route trong `src/routes/AppRoutes.tsx` nếu là page mới.
- Path constants trong `src/constants/index.ts` (`ROUTES`).

## Checklist trước khi xong

1. `npm run build` pass (`tsc` + `vite build`).
2. Không import API thô; chỉ `*Service`.
3. Xóa luôn qua `ConfirmDeleteDialog`.
4. types khớp backend / `src/types`.

## Gợi ý câu lệnh cho lần sau (copy)

> Implement page CRUD cho [ENTITY] trên wms-frontend: dùng `[entity]Service` trong `src/services`, tách `Create[Entity]Dialog` và `Update[Entity]Dialog`, xóa bằng `ConfirmDeleteDialog`, Table + phân trang + search debounce, nhãn tiếng Việt, mẫu giống `CategoriesPage` / `UnitsPage`.
