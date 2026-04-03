import { Form, Input, Modal, Select, TreeSelect, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { Location, Warehouse } from '../../../types'
import { locationsService } from '../../../services'

type FormValues = {
  parentId: string | null
  type: string
  code: string
  name: string
}

export type UpdateLocationDialogProps = {
  open: boolean
  warehouse: Warehouse | null
  location: Location | null
  existingTree?: Location[]
  onClose: () => void
  onSuccess: () => void
}

function toTreeSelectData(nodes: Location[], excludeId?: string): any[] {
  return nodes
    .filter((n) => n.id !== excludeId)
    .map((n) => ({
      title: `${n.code}${n.name ? ` — ${n.name}` : ''} (${n.type})`,
      value: n.id,
      children: n.children?.length ? toTreeSelectData(n.children, excludeId) : undefined,
    }))
}

export function UpdateLocationDialog({
  open,
  location,
  existingTree,
  onClose,
  onSuccess,
}: UpdateLocationDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !location) return
    form.setFieldsValue({
      parentId: location.parentId,
      type: location.type,
      code: location.code,
      name: location.name ?? '',
    })
  }, [open, location, form])

  const parentTreeData = useMemo(
    () =>
      existingTree?.length ? toTreeSelectData(existingTree, location?.id) : [],
    [existingTree, location?.id],
  )

  const handleOk = async () => {
    if (!location) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await locationsService.update(location.id, {
        parentId: values.parentId || undefined,
        type: values.type,
        code: values.code.trim(),
        name: values.name?.trim() || undefined,
      })
      message.success('Đã cập nhật vị trí')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được vị trí')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa vị trí"
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
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item name="name" label="Tên">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

