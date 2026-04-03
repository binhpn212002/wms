import type { AxiosRequestConfig } from 'axios'
import { api } from './api'

export async function getJson<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.get<T>(url, config)
  return data
}

export async function postJson<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.post<T>(url, body, config)
  return data
}

export async function putJson<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.put<T>(url, body, config)
  return data
}

export async function patchJson<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.patch<T>(url, body, config)
  return data
}

export async function deleteJson(
  url: string,
  config?: AxiosRequestConfig,
): Promise<void> {
  await api.delete(url, config)
}
