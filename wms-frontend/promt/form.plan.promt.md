## Prompt: Lập kế hoạch tạo Form (Frontend)

Dùng prompt này khi bạn chuẩn bị triển khai **một form UI** cho FE (Create/Update/Login/Search filter...). Mục tiêu: thống nhất cấu trúc file, cách validate, cách gọi API, và cách hiển thị error/loading theo chuẩn hiện có trong `wms-frontend`.

---

## Bối cảnh codebase (hiện tại)

- React + Vite (`src/main.jsx`)
- React Router DOM v6 (`src/router/index.jsx`)
- Redux Toolkit (nếu cần state global)
- Axios client dùng chung: `src/services/api/axiosClient.js`
- UI style: tailwind + shadcn-style components (`src/components/ui/*`)

---

## Danh sách Menu / Page FE (chuẩn MVP)

Mục tiêu: thống nhất **tên page**, **route**, và **API module** tương ứng để triển khai UI theo backend specs `/api/v1/*`.

Quy ước route gợi ý:
- Public: `/login`
- Private (trong `MainLayout`): các route còn lại
- Nhóm master-data: `/master-data/<resource>`

### 1) Dashboard
- **Home**: `/` → `src/pages/HomePage.jsx`

### 2) Auth
- **Login**: `/login` → `src/pages/LoginPage.jsx` → API: `POST /api/v1/auth/firebase`

### 3) Master data
- **Categories**: `/master-data/categories` → `src/pages/master-data/CategoriesPage.jsx` → API: `/api/v1/master-data/categories`
- **Units**: `/master-data/units` → `src/pages/master-data/UnitsPage.jsx` → API: `/api/v1/master-data/units`
- **Attributes**: `/master-data/attributes` → `src/pages/master-data/AttributesPage.jsx` → API: `/api/v1/master-data/attributes`
- **Attribute Values**: `/master-data/attribute-values` (hoặc nested theo attribute) → `src/pages/master-data/AttributeValuesPage.jsx` → API: theo spec `attribute-values`

### 4) Products
- **Products list**: `/products` → `src/pages/products/ProductsPage.jsx` → API: `/api/v1/products`
- **Product detail** (tuỳ chọn MVP): `/products/:id` → `src/pages/products/ProductDetailPage.jsx` → API: `GET /api/v1/products/:id`
- **Variants** (tuỳ chọn MVP): nested UI trong Product detail → API: `/api/v1/products/:id/variants`

### 5) Warehouses & Locations
- **Warehouses**: `/warehouses` → `src/pages/warehouses/WarehousesPage.jsx` → API: `/api/v1/warehouses`
- **Locations** (tuỳ chọn MVP): `/warehouses/:id/locations` → `src/pages/warehouses/WarehouseLocationsPage.jsx` → API: theo spec warehouses/locations

### 6) Suppliers
- **Suppliers**: `/suppliers` → `src/pages/suppliers/SuppliersPage.jsx` → API: `/api/v1/suppliers`
- **Supplier detail / contacts** (tuỳ chọn MVP): `/suppliers/:id` → `src/pages/suppliers/SupplierDetailPage.jsx` → API: `/api/v1/suppliers/:id` + `/api/v1/suppliers/:id/contacts`

### 7) Inbound (Nhập kho)
- **Inbound documents**: `/inbound` → `src/pages/inbound/InboundPage.jsx` → API: `/api/v1/inbound`
- **Create/Edit inbound**: `/inbound/new`, `/inbound/:id` → `src/pages/inbound/InboundFormPage.jsx` → API: `POST/PATCH /api/v1/inbound/*`
- **Complete inbound**: action button trong detail → API: `POST /api/v1/inbound/:id/complete` (theo detail-design)

### 8) Outbound (Xuất kho)
- **Outbound documents**: `/outbound` → `src/pages/outbound/OutboundPage.jsx` → API: `/api/v1/outbound`
- **Create/Edit outbound**: `/outbound/new`, `/outbound/:id` → `src/pages/outbound/OutboundFormPage.jsx`
- **Validate** (tuỳ chọn MVP): button validate → API: `POST /api/v1/outbound/:id/validate`
- **Complete**: button complete → API: `POST /api/v1/outbound/:id/complete`

### 9) Transfers (Chuyển kho)
- **Transfers documents**: `/transfers` → `src/pages/transfers/TransfersPage.jsx` → API: `/api/v1/transfers`
- **Create/Edit transfer**: `/transfers/new`, `/transfers/:id` → `src/pages/transfers/TransferFormPage.jsx`
- **Validate/Complete**: buttons → API: `POST /api/v1/transfers/:id/validate`, `POST /api/v1/transfers/:id/complete`

### 10) Inventory (Tồn kho)
- **Stock balances**: `/inventory/balances` → `src/pages/inventory/InventoryBalancesPage.jsx` → API: `/api/v1/inventory/balances`
- **Inventory movements** (tuỳ chọn MVP): `/inventory/movements` → `src/pages/inventory/InventoryMovementsPage.jsx` → API: `/api/v1/inventory/movements`

### 11) Reports
- **Stock on hand report**: `/reports/stock-on-hand` → `src/pages/reports/StockOnHandReportPage.jsx` → API: `/api/v1/reports/stock-on-hand`
- **Movements report**: `/reports/movements` → `src/pages/reports/MovementsReportPage.jsx` → API: `/api/v1/reports/movements`
- **Top products**: `/reports/top-products` → `src/pages/reports/TopProductsReportPage.jsx` → API: `/api/v1/reports/top-products`

### 12) Users (Admin)
- **Users list**: `/users` → `src/pages/users/UsersPage.jsx` → API: `/api/v1/users`
- **My profile** (tuỳ chọn MVP): `/me` → `src/pages/users/MyProfilePage.jsx` → API: `/api/v1/users/me`

Gợi ý file API service tương ứng (đặt trong `src/services/api/`):
- `authApi.js`, `categoriesApi.js`, `unitsApi.js`, `attributesApi.js`, `attributeValuesApi.js`
- `productsApi.js`, `warehousesApi.js`, `suppliersApi.js`
- `inboundApi.js`, `outboundApi.js`, `transfersApi.js`
- `inventoryApi.js`, `reportsApi.js`, `usersApi.js`

---

## Đầu vào cần có

- Mô tả form: mục đích, fields, rules validate, UI states (loading/success/error)
- API spec (khuyến nghị): từ backend theo chuẩn `/api/v1/<module>/<resources>`
  - Request body / query params
  - Response success shape
  - Error/validation fields (nếu có)

---

## Quy ước tổ chức file (khuyến nghị)

Với một form thuộc một page:

.
├── src/
│   ├── pages/
│   │   └── <PageName>.jsx                # page wrapper + layout
│   ├── features/ (tuỳ chọn)
│   │   └── <feature>/                    # redux slice / thunks nếu cần
│   ├── services/
│   │   └── api/
│   │       ├── axiosClient.js
│   │       └── <resource>Api.js          # hàm gọi API cho form
│   └── components/
│       ├── ui/
│       │   ├── input.jsx                 # primitive UI
│       │   ├── label.jsx
│       │   └── button.jsx
│       └── forms/
│           └── <FormName>Form.jsx        # component form tái sử dụng (nếu hợp lý)

Nguyên tắc:
- **Page** lo routing/layout.
- **Form component** lo state cục bộ: field state, submit, errors, disable.
- **API service** tách riêng: không gọi axios trực tiếp trong JSX (trừ demo cực nhỏ).

---

## Chuẩn validate + hiển thị lỗi

- Validate tối thiểu ở client: required, format (email), min length...
- Error hiển thị:
  - **Field error**: dưới input (ưu tiên)
  - **Form error**: block trên submit (API error chung)
- Khi submit:
  - disable nút + show trạng thái "Đang xử lý..."
  - không allow double submit

---

## Chuẩn gọi API

- Tạo file `src/services/api/<resource>Api.js`:
  - `export async function <action>(payload) { return (await axiosClient.post(...)).data }`
- BaseURL lấy từ `env.apiBaseUrl` (`src/config/env.js`)
- Timeout mặc định 10s theo `axiosClient`

---

## Checklist trước khi coi là xong

- [ ] Có form state đầy đủ: initial, loading, success, error
- [ ] Validate client-side tối thiểu + hiển thị field errors rõ ràng
- [ ] API call tách riêng trong `src/services/api/*`
- [ ] UI components dùng chung (`src/components/ui/*`)
- [ ] `npm run lint` pass

---

## Cách gọi prompt ngắn (copy-paste)

> Lập kế hoạch tạo form `<FormName>` cho page `<PageName>` trong `wms-frontend`. Đề xuất cấu trúc file theo chuẩn hiện có, rules validate, UI states (loading/error), và mapping API theo chuẩn `/api/v1`. Tách API call vào `src/services/api/*` và ưu tiên dùng UI primitives trong `src/components/ui/*`.

