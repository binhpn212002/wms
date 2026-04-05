import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AUTH_TOKEN_STORAGE_KEY, ROUTES } from '../constants'

export function RequireAuth() {
  const location = useLocation()
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }
  return <Outlet />
}
