import { Form, Input, Modal, Switch, TreeSelect, message } from 'antd'
import { useEffect, useState } from 'react'
import type { CategoryTreeNode } from '../../../types'
import { categoriesService } from '../../../services'

type FormValues = {
  code: string
  name: string
  parent_id?: string | null
  active: boolean
}

type TreeOption = { title: string; value: string; children?: TreeOption[] }

function mapTree(nodes: CategoryTreeNode[]): TreeOption[] {
  return nodes.map((n) => ({
    title: `${n.code} — ${n.name}`,
    value: n.id,
    children: n.children?.length ? mapTree(n.children) : undefined,
  }))
}

export type CreateCategoryDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateCategoryDialog({
  open,
  onClose,
  onSuccess,
}: CreateCategoryDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [treeData, setTreeData] = useState<TreeOption[]>([])
  const [loadingTree, setLoadingTree] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({ active: true })
    let cancelled = false
    setLoadingTree(true)
    categoriesService
      .tree()
      .then((tree) => {
        if (!cancelled) setTreeData(mapTree(tree))
      })
      .catch(() => {
        if (!cancelled) message.error('Không tải được cây danh mục')
      })
      .finally(() => {
        if (!cancelled) setLoadingTree(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await categoriesService.create({
        code: values.code.trim(),
        name: values.name.trim(),
        parent_id: values.parent_id ?? null,
        active: values.active,
      })
      message.success('Đã tạo danh mục')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm danh mục"
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
          <Input placeholder="VD: DM-VT" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input placeholder="Tên danh mục" />
        </Form.Item>
        <Form.Item name="parent_id" label="Danh mục cha">
          <TreeSelect
            allowClear
            showSearch
            treeDefaultExpandAll
            placeholder="Không chọn = danh mục gốc"
            treeData={treeData}
            loading={loadingTree}
            treeNodeFilterProp="title"
          />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
