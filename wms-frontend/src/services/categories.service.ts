import type {
  Category,
  CategoryTreeNode,
  CreateCategoryRequest,
  ListCategoriesQuery,
  ListResponse,
  TreeCategoriesQuery,
  UpdateCategoryRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

export const categoriesService = {
  list(params?: ListCategoriesQuery) {
    return getJson<ListResponse<Category>>('/master-data/categories', {
      params,
    })
  },

  tree(params?: TreeCategoriesQuery) {
    return getJson<CategoryTreeNode[]>('/master-data/categories/tree', {
      params,
    })
  },

  findOne(id: string, params?: { includeDeleted?: boolean }) {
    return getJson<Category>(`/master-data/categories/${id}`, { params })
  },

  create(body: CreateCategoryRequest) {
    return postJson<Category, CreateCategoryRequest>(
      '/master-data/categories',
      body,
    )
  },

  update(id: string, body: UpdateCategoryRequest) {
    return patchJson<Category, UpdateCategoryRequest>(
      `/master-data/categories/${id}`,
      body,
    )
  },

  remove(id: string) {
    return deleteJson(`/master-data/categories/${id}`)
  },
}
