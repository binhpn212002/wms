import { Layout, Menu, theme } from 'antd'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants'

const { Content, Sider } = Layout

const MENU_ITEMS: MenuProps['items'] = [
  { key: ROUTES.HOME, label: 'Trang chủ' },
  {
    key: 'master-data',
    label: 'Master data',
    children: [
      { key: ROUTES.MASTER_DATA_CATEGORIES, label: 'Danh mục' },
      { key: ROUTES.MASTER_DATA_UNITS, label: 'Đơn vị tính' },
      { key: ROUTES.MASTER_DATA_ATTRIBUTES, label: 'Thuộc tính' },
      { key: ROUTES.MASTER_DATA_ATTRIBUTE_VALUES, label: 'Giá trị thuộc tính' },
    ],
  },
  {
    key: 'products',
    label: 'Sản phẩm',
    children: [
      { key: ROUTES.PRODUCTS, label: 'Sản phẩm' },
      { key: ROUTES.PRODUCT_VARIANTS, label: 'Biến thể / SKU' },
    ],
  },
  { key: ROUTES.WAREHOUSES, label: 'Kho & vị trí' },
  { key: ROUTES.SUPPLIERS, label: 'Nhà cung cấp' },
  { key: ROUTES.INBOUND, label: 'Nhập kho' },
  { key: ROUTES.OUTBOUND, label: 'Xuất kho' },
  { key: ROUTES.TRANSFERS, label: 'Chuyển kho' },
  {
    key: 'inventory-group',
    label: 'Tồn kho',
    children: [
      { key: ROUTES.INVENTORY, label: 'Tổng quan' },
      { key: ROUTES.INVENTORY_CHECK, label: 'Check hàng tồn' },
    ],
  },
  { key: ROUTES.REPORTS, label: 'Báo cáo' },
  { key: ROUTES.USERS, label: 'Người dùng' },
]

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="light" style={{ borderInlineEnd: `1px solid ${token.colorBorderSecondary}` }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname === '/' ? ROUTES.HOME : location.pathname]}
          defaultOpenKeys={['master-data', 'products', 'inventory-group']}
          items={MENU_ITEMS}
          onClick={onMenuClick}
          style={{ borderInlineEnd: 0, height: '100%' }}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
