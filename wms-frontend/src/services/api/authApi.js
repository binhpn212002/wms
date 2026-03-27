import { axiosClient } from '@/services/api/axiosClient'

export async function login(payload) {
  const res = await axiosClient.post('/auth/login', payload)
  return res.data
}

