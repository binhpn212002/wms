import { Form, Input, Modal, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import type { SupplierContact } from '../../types'
import { suppliersService } from '../../services'

type FormValues = {
  name: string
  phone: string
  email: string
  title: string
  isPrimary: boolean
}

export type UpdateSupplierContactDialogProps = {
  open: boolean
  supplierId: string
  contact: SupplierContact | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateSupplierContactDialog({
  open,
  supplierId,
  contact,
  onClose,
  onSuccess,
}: UpdateSupplierContactDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !contact) return
    form.setFieldsValue({
      name: contact.name,
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      title: contact.title ?? '',
      isPrimary: contact.is_primary,
    })
  }, [open, contact, form])

  const handleOk = async () => {
    if (!contact) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await suppliersService.updateContact(supplierId, contact.id, {
        name: values.name.trim(),
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
        title: values.title?.trim() || null,
        isPrimary: values.isPrimary,
      })
      message.success('Đã cập nhật liên hệ')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được liên hệ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa liên hệ"
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
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên người liên hệ' }]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="phone" label="SĐT">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="title" label="Chức danh">
          <Input />
        </Form.Item>
        <Form.Item name="isPrimary" label="Liên hệ chính" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

