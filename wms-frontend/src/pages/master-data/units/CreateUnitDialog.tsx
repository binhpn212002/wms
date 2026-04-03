import { Form, Input, Modal, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import { unitsService } from '../../../services'

type FormValues = {
  code: string
  name: string
  symbol: string
  active: boolean
}

export type CreateUnitDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateUnitDialog({ open, onClose, onSuccess }: CreateUnitDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({ active: true, symbol: '' })
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await unitsService.create({
        code: values.code.trim(),
        name: values.name.trim(),
        symbol: values.symbol?.trim() || null,
        active: values.active,
      })
      message.success('Đã tạo đơn vị')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được đơn vị')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm đơn vị tính"
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
          <Input placeholder="VD: KG" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input placeholder="Kilogram" />
        </Form.Item>
        <Form.Item name="symbol" label="Ký hiệu">
          <Input placeholder="kg" />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
