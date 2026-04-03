export const ROUTES = {
  HOME: '/',
  MASTER_DATA_CATEGORIES: '/master-data/categories',
  MASTER_DATA_UNITS: '/master-data/units',
  MASTER_DATA_ATTRIBUTES: '/master-data/attributes',
  MASTER_DATA_ATTRIBUTE_VALUES: '/master-data/attribute-values',
  PRODUCTS: '/products',
  PRODUCT_VARIANTS: '/product-variants',
  WAREHOUSES: '/warehouses',
  SUPPLIERS: '/suppliers',
  INBOUND: '/inbound',
  OUTBOUND: '/outbound',
  TRANSFERS: '/transfers',
  INVENTORY: '/inventory',
  INVENTORY_CHECK: '/inventory/check',
  REPORTS: '/reports',
  USERS: '/users',
} as const

/** Backend `main.ts` uses global prefix `api/v1`. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

/** Key used with localStorage when persisting the access token (e.g. after login). */
export const AUTH_TOKEN_STORAGE_KEY = 'wms_access_token'
