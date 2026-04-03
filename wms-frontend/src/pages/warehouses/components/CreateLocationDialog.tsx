import { Form, Input, Modal, Select, TreeSelect, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { warehousesService } from '../../../services'
import type { Location, Warehouse } from '../../../types'

type FormValues = {
  parentId: string | null
  type: string
  code: string
  name: string
}

export type CreateLocationDialogProps = {
  open: boolean
  warehouse: Warehouse | null
  existingTree?: Location[]
  onClose: () => void
  onSuccess: () => void
}

function toTreeSelectData(nodes: Location[]): any[] {
  return nodes.map((n) => ({
    title: `${n.code}${n.name ? ` — ${n.name}` : ''} (${n.type})`,
    value: n.id,
    children: n.children?.length ? toTreeSelectData(n.children) : undefined,
  }))
}

export function CreateLocationDialog({
  open,
  warehouse,
  existingTree,
  onClose,
  onSuccess,
}: CreateLocationDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({ parentId: null, type: 'bin', name: '' })
  }, [open, form])

  const parentTreeData = useMemo(
    () => (existingTree?.length ? toTreeSelectData(existingTree) : []),
    [existingTree],
  )

  const handleOk = async () => {
    if (!warehouse) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await warehousesService.createLocation(warehouse.id, {
        parentId: values.parentId || undefined,
        type: values.type,
        code: values.code.trim(),
        name: values.name?.trim() || undefined,
      })
      message.success('Đã tạo vị trí')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được vị trí')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm vị trí"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="parentId" label="Vị trí cha">
          <TreeSelect
            allowClear
            placeholder="(không có)"
            treeData={parentTreeData}
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item
          name="type"
          label="Loại"
          rules={[{ required: true, message: 'Chọn loại' }]}
        >
          <Select
            options={[
              { value: 'zone', label: 'Zone' },
              { value: 'rack', label: 'Rack' },
              { value: 'bin', label: 'Bin' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="code"
          label="Mã"
          rules={[{ required: true, message: 'Nhập mã vị trí' }]}
        >
          <Input placeholder="VD: A1-01" autoComplete="off" />
        </Form.Item>
        <Form.Item name="name" label="Tên">
          <Input placeholder="(tùy chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

