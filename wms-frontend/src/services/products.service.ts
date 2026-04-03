import type {
  CreateProductRequest,
  CreateProductVariantRequest,
  GetProductQuery,
  ListProductsQuery,
  ListResponse,
  Product,
  ProductVariant,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

export const productsService = {
  list(params?: ListProductsQuery) {
    return getJson<ListResponse<Product>>('/products', { params })
  },

  create(body: CreateProductRequest) {
    return postJson<Product, CreateProductRequest>('/products', body)
  },

  findOne(id: string, params?: GetProductQuery) {
    return getJson<Product>(`/products/${id}`, { params })
  },

  update(id: string, body: UpdateProductRequest) {
    return patchJson<Product, UpdateProductRequest>(`/products/${id}`, body)
  },

  remove(id: string) {
    return deleteJson(`/products/${id}`)
  },

  createVariant(productId: string, body: CreateProductVariantRequest) {
    return postJson<ProductVariant, CreateProductVariantRequest>(
      `/products/${productId}/variants`,
      body,
    )
  },

  updateVariant(
    productId: string,
    variantId: string,
    body: UpdateProductVariantRequest,
  ) {
    return patchJson<ProductVariant, UpdateProductVariantRequest>(
      `/products/${productId}/variants/${variantId}`,
      body,
    )
  },

  removeVariant(productId: string, variantId: string) {
    return deleteJson(`/products/${productId}/variants/${variantId}`)
  },
}
