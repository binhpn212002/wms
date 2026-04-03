import type { PageQuery, SortOrder } from './pagination'

export type SupplierSortField = 'code' | 'name' | 'created_at'

export interface SupplierContact {
  id: string
  supplier_id: string
  name: string
  phone: string | null
  email: string | null
  title: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Supplier {
  id: string
  code: string
  name: string
  tax_id: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  contact_count?: number
  contacts?: SupplierContact[]
}

export interface ListSuppliersQuery extends PageQuery {
  sortBy?: SupplierSortField
  sort?: SortOrder
  active?: boolean
  includeDeleted?: boolean
  includeContacts?: boolean
}

export interface GetSupplierQuery {
  includeDeleted?: boolean
  includeContacts?: boolean
}

export interface CreateSupplierContactRequest {
  name: string
  phone?: string | null
  email?: string | null
  title?: string | null
  isPrimary?: boolean
}

export interface CreateSupplierRequest {
  code: string
  name: string
  taxId?: string | null
  notes?: string | null
  active?: boolean
  contacts?: CreateSupplierContactRequest[]
}

export type UpdateSupplierRequest = Partial<
  Pick<CreateSupplierRequest, 'name' | 'taxId' | 'notes' | 'active'>
>

export type UpdateSupplierContactRequest = Partial<
  Pick<
    CreateSupplierContactRequest,
    'name' | 'phone' | 'email' | 'title' | 'isPrimary'
  >
>
