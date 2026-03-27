import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/services/api/authApi'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const clientErrors = useMemo(() => {
    const next = {}
    const emailTrimmed = email.trim()
    const passwordTrimmed = password.trim()

    if (!emailTrimmed) next.email = 'Vui lòng nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      next.email = 'Email không hợp lệ.'
    }

    if (!passwordTrimmed) next.password = 'Vui lòng nhập mật khẩu.'
    else if (passwordTrimmed.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự.'

    return next
  }, [email, password])

  const isValid = Object.keys(clientErrors).length === 0

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    if (!isValid) {
      setFieldErrors(clientErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.code === 'ECONNABORTED'
          ? 'Kết nối bị timeout. Vui lòng thử lại.'
          : 'Không thể đăng nhập. Vui lòng thử lại.')

      const fields = err?.response?.data?.fields
      if (fields && typeof fields === 'object') setFieldErrors(fields)
      setFormError(message)
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4 w-full max-w-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Đăng nhập</h2>
        <p className="text-muted-foreground text-sm">
          Đăng nhập bằng backend API. Base URL lấy từ <code>VITE_API_BASE_URL</code>.
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        {formError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.email ? (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.password ? (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          ) : null}
        </div>

        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </section>
  )
}
