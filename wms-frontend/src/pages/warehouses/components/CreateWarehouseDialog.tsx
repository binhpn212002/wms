import { Form, Input, Modal, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import { warehousesService } from '../../../services'

type FormValues = {
  code: string
  name: string
  address: string
  active: boolean
}

export type CreateWarehouseDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateWarehouseDialog({
  open,
  onClose,
  onSuccess,
}: CreateWarehouseDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({ active: true, address: '' })
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await warehousesService.create({
        code: values.code.trim(),
        name: values.name.trim(),
        address: values.address?.trim() || undefined,
        active: values.active,
      })
      message.success('Đã tạo kho')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được kho')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm kho"
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
          rules={[{ required: true, message: 'Nhập mã kho' }]}
        >
          <Input placeholder="VD: WH-HCM" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên kho' }]}
        >
          <Input placeholder="Kho HCM" />
        </Form.Item>
        <Form.Item name="address" label="Địa chỉ">
          <Input placeholder="(tùy chọn)" />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

