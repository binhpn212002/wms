import { Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { usersService } from '../../../services'

type FormValues = {
  username: string
  phone: string
  email: string
  fullName: string
}

export type CreateUserDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateUserDialog({ open, onClose, onSuccess }: CreateUserDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({ email: '', fullName: '' })
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await usersService.create({
        username: values.username.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() || undefined,
        fullName: values.fullName?.trim() || undefined,
      })
      message.success('Đã tạo người dùng')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được người dùng')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm người dùng"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Nhập username' }]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
        <Form.Item name="fullName" label="Họ tên">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

