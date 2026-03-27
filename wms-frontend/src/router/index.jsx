import { Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes (no app layout) */}
      <Route path="/login" element={<LoginPage />} />

      {/* App routes (with sidebar/header layout) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* Master data */}
        <Route
          path="/master-data/categories"
          element={<PlaceholderPage title="Categories" />}
        />
        <Route path="/master-data/units" element={<PlaceholderPage title="Units" />} />
        <Route
          path="/master-data/attributes"
          element={<PlaceholderPage title="Attributes" />}
        />
        <Route
          path="/master-data/attribute-values"
          element={<PlaceholderPage title="Attribute Values" />}
        />

        {/* Catalog */}
        <Route path="/products" element={<PlaceholderPage title="Products" />} />
        <Route path="/products/:id" element={<PlaceholderPage title="Product detail" />} />
        <Route path="/warehouses" element={<PlaceholderPage title="Warehouses" />} />
        <Route
          path="/warehouses/:id/locations"
          element={<PlaceholderPage title="Warehouse locations" />}
        />
        <Route path="/suppliers" element={<PlaceholderPage title="Suppliers" />} />
        <Route
          path="/suppliers/:id"
          element={<PlaceholderPage title="Supplier detail" />}
        />

        {/* Ops */}
        <Route path="/inbound" element={<PlaceholderPage title="Inbound" />} />
        <Route path="/inbound/new" element={<PlaceholderPage title="Create inbound" />} />
        <Route path="/inbound/:id" element={<PlaceholderPage title="Inbound detail" />} />
        <Route path="/outbound" element={<PlaceholderPage title="Outbound" />} />
        <Route path="/outbound/new" element={<PlaceholderPage title="Create outbound" />} />
        <Route
          path="/outbound/:id"
          element={<PlaceholderPage title="Outbound detail" />}
        />
        <Route path="/transfers" element={<PlaceholderPage title="Transfers" />} />
        <Route
          path="/transfers/new"
          element={<PlaceholderPage title="Create transfer" />}
        />
        <Route
          path="/transfers/:id"
          element={<PlaceholderPage title="Transfer detail" />}
        />

        {/* Inventory */}
        <Route
          path="/inventory/balances"
          element={<PlaceholderPage title="Inventory balances" />}
        />
        <Route
          path="/inventory/movements"
          element={<PlaceholderPage title="Inventory movements" />}
        />

        {/* Reports */}
        <Route
          path="/reports/stock-on-hand"
          element={<PlaceholderPage title="Stock on hand report" />}
        />
        <Route
          path="/reports/movements"
          element={<PlaceholderPage title="Movements report" />}
        />
        <Route
          path="/reports/top-products"
          element={<PlaceholderPage title="Top products report" />}
        />

        {/* Admin */}
        <Route path="/users" element={<PlaceholderPage title="Users" />} />
        <Route path="/me" element={<PlaceholderPage title="My profile" />} />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
