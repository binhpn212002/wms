import { Form, Input, Modal, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import type { Unit } from '../../../types'
import { unitsService } from '../../../services'

type FormValues = {
  code: string
  name: string
  symbol: string
  active: boolean
}

export type UpdateUnitDialogProps = {
  open: boolean
  unit: Unit | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateUnitDialog({ open, unit, onClose, onSuccess }: UpdateUnitDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !unit) return
    form.setFieldsValue({
      code: unit.code,
      name: unit.name,
      symbol: unit.symbol ?? '',
      active: unit.active,
    })
  }, [open, unit, form])

  const handleOk = async () => {
    if (!unit) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await unitsService.update(unit.id, {
        code: values.code.trim(),
        name: values.name.trim(),
        symbol: values.symbol?.trim() || null,
        active: values.active,
      })
      message.success('Đã cập nhật đơn vị')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được đơn vị')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa đơn vị tính"
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
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="symbol" label="Ký hiệu">
          <Input />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
