import { Form, Input, Modal, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import type { User, UserStatus } from '../../../types'
import { usersService } from '../../../services'

type FormValues = {
  email: string
  fullName: string
  status: UserStatus
  firebaseId: string
}

export type UpdateUserDialogProps = {
  open: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateUserDialog({ open, user, onClose, onSuccess }: UpdateUserDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    form.setFieldsValue({
      email: user.email ?? '',
      fullName: user.fullName ?? '',
      status: user.status,
      firebaseId: (user as any).firebaseId ?? '',
    })
  }, [open, user, form])

  const handleOk = async () => {
    if (!user) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await usersService.update(user.id, {
        email: values.email?.trim() || null,
        fullName: values.fullName?.trim() || null,
        status: values.status,
        firebaseId: values.firebaseId?.trim() || null,
      })
      message.success('Đã cập nhật người dùng')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được người dùng')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa người dùng"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
        <Form.Item name="fullName" label="Họ tên">
          <Input />
        </Form.Item>
        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: 'Chọn trạng thái' }]}
        >
          <Select
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </Form.Item>
        <Form.Item name="firebaseId" label="Firebase ID">
          <Input placeholder="(tùy chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

