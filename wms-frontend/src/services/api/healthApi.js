import { axiosClient } from '@/services/api/axiosClient'

export async function checkBackendHealth() {
  const { data } = await axiosClient.get('/health')
  return data
}
