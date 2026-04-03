import { Form, Input, Modal, Switch, TreeSelect, message } from 'antd'
import { useEffect, useState } from 'react'
import type { Category, CategoryTreeNode } from '../../../types'
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

function filterSelfFromTree(nodes: CategoryTreeNode[], selfId: string): CategoryTreeNode[] {
  return nodes
    .filter((n) => n.id !== selfId)
    .map((n) => ({
      ...n,
      children: n.children?.length ? filterSelfFromTree(n.children, selfId) : [],
    }))
}

export type UpdateCategoryDialogProps = {
  open: boolean
  category: Category | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateCategoryDialog({
  open,
  category,
  onClose,
  onSuccess,
}: UpdateCategoryDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [treeData, setTreeData] = useState<TreeOption[]>([])
  const [loadingTree, setLoadingTree] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !category) return
    form.setFieldsValue({
      code: category.code,
      name: category.name,
      parent_id: category.parent_id ?? undefined,
      active: category.active,
    })
    let cancelled = false
    setLoadingTree(true)
    categoriesService
      .tree()
      .then((tree) => {
        if (!cancelled)
          setTreeData(mapTree(filterSelfFromTree(tree, category.id)))
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
  }, [open, category, form])

  const handleOk = async () => {
    if (!category) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await categoriesService.update(category.id, {
        code: values.code.trim(),
        name: values.name.trim(),
        parent_id: values.parent_id ?? null,
        active: values.active,
      })
      message.success('Đã cập nhật danh mục')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa danh mục"
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
          <Input placeholder="Mã" autoComplete="off" />
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
