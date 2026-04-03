import type {
  CreateSupplierContactRequest,
  CreateSupplierRequest,
  GetSupplierQuery,
  ListResponse,
  ListSuppliersQuery,
  Supplier,
  SupplierContact,
  UpdateSupplierContactRequest,
  UpdateSupplierRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

export const suppliersService = {
  list(params?: ListSuppliersQuery) {
    return getJson<ListResponse<Supplier>>('/suppliers', { params })
  },

  create(body: CreateSupplierRequest) {
    return postJson<Supplier, CreateSupplierRequest>('/suppliers', body)
  },

  findOne(id: string, params?: GetSupplierQuery) {
    return getJson<Supplier>(`/suppliers/${id}`, { params })
  },

  update(id: string, body: UpdateSupplierRequest) {
    return patchJson<Supplier, UpdateSupplierRequest>(`/suppliers/${id}`, body)
  },

  remove(id: string) {
    return deleteJson(`/suppliers/${id}`)
  },

  createContact(supplierId: string, body: CreateSupplierContactRequest) {
    return postJson<SupplierContact, CreateSupplierContactRequest>(
      `/suppliers/${supplierId}/contacts`,
      body,
    )
  },

  updateContact(
    supplierId: string,
    contactId: string,
    body: UpdateSupplierContactRequest,
  ) {
    return patchJson<SupplierContact, UpdateSupplierContactRequest>(
      `/suppliers/${supplierId}/contacts/${contactId}`,
      body,
    )
  },

  removeContact(supplierId: string, contactId: string) {
    return deleteJson(`/suppliers/${supplierId}/contacts/${contactId}`)
  },
}
