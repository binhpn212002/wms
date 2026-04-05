import { useState } from 'react'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import axios from 'axios'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import { AppLogo } from '../../components/AppLogo'
import {
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  ROUTES,
} from '../../constants'
import { authService } from '../../services'

const { Text } = Typography

type LoginFormValues = {
  username: string
  password: string
}

function loginErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    const m = data?.message
    if (Array.isArray(m)) return m.join(', ')
    if (typeof m === 'string') return m
  }
  return 'Đăng nhập thất bại. Kiểm tra tài khoản và mật khẩu.'
}

export function LoginPage() {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    ROUTES.HOME

  if (localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) {
    return <Navigate to={fromPath === ROUTES.LOGIN ? ROUTES.HOME : fromPath} replace />
  }

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true)
    try {
      const res = await authService.login({
        username: values.username.trim(),
        password: values.password,
      })
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, res.accessToken)
      if (res.refreshToken) {
        localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, res.refreshToken)
      }
      message.success('Đăng nhập thành công')
      navigate(fromPath, { replace: true })
    } catch (e) {
      message.error(loginErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(160deg, #f0f5ff 0%, #fafafa 45%, #fff 100%)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }} bordered={false}>
        <div style={{ marginBottom: 24 }}>
          <AppLogo layout="vertical" size={48} />
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
            Đăng nhập WMS
          </Text>
        </div>
        <Form<LoginFormValues> layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item
            name="username"
            label="Tên đăng nhập hoặc email"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@example.com" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
