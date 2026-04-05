import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../components'
import { ROUTES } from '../constants'
import { LoginPage } from '../pages/auth'
import { HomePage } from '../pages/home'
import { InboundPage } from '../pages/inbound'
import { InventoryCheckPage, InventoryPage } from '../pages/inventory'
import { OutboundPage } from '../pages/outbound'
import { ProductsPage } from '../pages/products'
import { ProductVariantsPage } from '../pages/product-variants'
import { ReportsPage } from '../pages/reports'
import { SuppliersPage } from '../pages/suppliers'
import { TransfersPage } from '../pages/transfers'
import { UsersPage } from '../pages/users'
import { WarehousesPage } from '../pages/warehouses'
import { AttributesPage } from '../pages/master-data/attributes'
import { CategoriesPage } from '../pages/master-data/categories'
import { UnitsPage } from '../pages/master-data/units'
import { RequireAuth } from './RequireAuth'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path={ROUTES.HOME} element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTES.MASTER_DATA_CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.MASTER_DATA_UNITS} element={<UnitsPage />} />
          <Route path={ROUTES.MASTER_DATA_ATTRIBUTES} element={<AttributesPage />} />
          <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
          <Route path={ROUTES.PRODUCT_VARIANTS} element={<ProductVariantsPage />} />
          <Route path={ROUTES.WAREHOUSES} element={<WarehousesPage />} />
          <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />
          <Route path={ROUTES.INBOUND} element={<InboundPage />} />
          <Route path={ROUTES.OUTBOUND} element={<OutboundPage />} />
          <Route path={ROUTES.TRANSFERS} element={<TransfersPage />} />
          <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
          <Route path={ROUTES.INVENTORY_CHECK} element={<InventoryCheckPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.USERS} element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
