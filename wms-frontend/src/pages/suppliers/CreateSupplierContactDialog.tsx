import { Form, Input, Modal, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import { suppliersService } from '../../services'

type FormValues = {
  name: string
  phone: string
  email: string
  title: string
  isPrimary: boolean
}

export type CreateSupplierContactDialogProps = {
  open: boolean
  supplierId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateSupplierContactDialog({
  open,
  supplierId,
  onClose,
  onSuccess,
}: CreateSupplierContactDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      phone: '',
      email: '',
      title: '',
      isPrimary: false,
    })
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await suppliersService.createContact(supplierId, {
        name: values.name.trim(),
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
        title: values.title?.trim() || null,
        isPrimary: values.isPrimary,
      })
      message.success('Đã thêm liên hệ')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không thêm được liên hệ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm liên hệ"
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
          <Input placeholder="Nguyễn Văn A" autoComplete="off" />
        </Form.Item>
        <Form.Item name="phone" label="SĐT">
          <Input placeholder="090…" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
          <Input placeholder="a@company.com" />
        </Form.Item>
        <Form.Item name="title" label="Chức danh">
          <Input placeholder="Kế toán / Giao nhận…" />
        </Form.Item>
        <Form.Item name="isPrimary" label="Liên hệ chính" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

