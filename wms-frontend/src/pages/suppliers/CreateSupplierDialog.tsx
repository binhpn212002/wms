import { Form, Input, Modal, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import { suppliersService } from '../../services'

type FormValues = {
  code: string
  name: string
  taxId: string
  notes: string
  active: boolean
}

export type CreateSupplierDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSupplierDialog({
  open,
  onClose,
  onSuccess,
}: CreateSupplierDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      active: true,
      taxId: '',
      notes: '',
    })
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await suppliersService.create({
        code: values.code.trim(),
        name: values.name.trim(),
        taxId: values.taxId?.trim() || null,
        notes: values.notes?.trim() || null,
        active: values.active,
      })
      message.success('Đã tạo nhà cung cấp')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được nhà cung cấp')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm nhà cung cấp"
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
          name="code"
          label="Mã"
          rules={[{ required: true, message: 'Nhập mã' }]}
        >
          <Input placeholder="VD: NCC-001" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input placeholder="Công ty ABC" />
        </Form.Item>
        <Form.Item name="taxId" label="MST">
          <Input placeholder="VD: 0123456789" />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea placeholder="Ghi chú nội bộ…" rows={3} />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

