import {
  BarChart3,
  Boxes,
  Factory,
  FileInput,
  FileOutput,
  Home,
  Package,
  Settings,
  Shield,
  Shuffle,
  Store,
  Users,
  Warehouse,
} from 'lucide-react'

export const appMenu = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    items: [{ key: 'home', label: 'Home', path: '/', icon: Home }],
  },
  {
    key: 'ops',
    label: 'Vận hành kho',
    items: [
      { key: 'inbound', label: 'Nhập kho', path: '/inbound', icon: FileInput },
      { key: 'outbound', label: 'Xuất kho', path: '/outbound', icon: FileOutput },
      { key: 'transfers', label: 'Chuyển kho', path: '/transfers', icon: Shuffle },
      { key: 'inventory', label: 'Tồn kho', path: '/inventory/balances', icon: Boxes },
    ],
  },
  {
    key: 'catalog',
    label: 'Danh mục',
    items: [
      { key: 'products', label: 'Sản phẩm', path: '/products', icon: Package },
      { key: 'suppliers', label: 'Nhà cung cấp', path: '/suppliers', icon: Factory },
      { key: 'warehouses', label: 'Kho & vị trí', path: '/warehouses', icon: Warehouse },
    ],
  },
  {
    key: 'masterData',
    label: 'Master data',
    items: [
      { key: 'md-categories', label: 'Categories', path: '/master-data/categories', icon: Store },
      { key: 'md-units', label: 'Units', path: '/master-data/units', icon: Settings },
      { key: 'md-attributes', label: 'Attributes', path: '/master-data/attributes', icon: Settings },
      {
        key: 'md-attribute-values',
        label: 'Attribute Values',
        path: '/master-data/attribute-values',
        icon: Settings,
      },
    ],
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    items: [
      { key: 'r-stock', label: 'Stock on hand', path: '/reports/stock-on-hand', icon: BarChart3 },
      { key: 'r-movements', label: 'Movements', path: '/reports/movements', icon: BarChart3 },
      { key: 'r-top', label: 'Top products', path: '/reports/top-products', icon: BarChart3 },
    ],
  },
  {
    key: 'admin',
    label: 'Quản trị',
    items: [
      { key: 'users', label: 'Users', path: '/users', icon: Users },
      { key: 'me', label: 'My profile', path: '/me', icon: Shield },
    ],
  },
]

