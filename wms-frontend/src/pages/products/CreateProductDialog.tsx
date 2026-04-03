import { Form, Input, Modal, Select, Space, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import { categoriesService, productsService, unitsService } from '../../services'
import type { Category, Unit } from '../../types'

type FormValues = {
  code: string
  name: string
  categoryId: string
  defaultUomId: string
  active: boolean
}

export type CreateProductDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateProductDialog({ open, onClose, onSuccess }: CreateProductDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  const [loadingRefData, setLoadingRefData] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      active: true,
    })
  }, [open, form])

  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoadingRefData(true)
      try {
        const [catsRes, unitsRes] = await Promise.all([
          categoriesService.list({ page: 1, limit: 200 }),
          unitsService.list({ page: 1, limit: 200, active: true }),
        ])
        setCategories(catsRes.data)
        setUnits(unitsRes.data)
      } catch {
        message.error('Không tải được dữ liệu danh mục/đơn vị')
      } finally {
        setLoadingRefData(false)
      }
    }
    void load()
  }, [open])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await productsService.create({
        code: values.code.trim(),
        name: values.name.trim(),
        categoryId: values.categoryId,
        defaultUomId: values.defaultUomId,
        active: values.active,
      })
      message.success('Đã tạo sản phẩm')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được sản phẩm')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm sản phẩm"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Space align="start" style={{ width: '100%' }} size={16} wrap>
          <Form.Item
            name="code"
            label="Mã"
            rules={[{ required: true, message: 'Nhập mã' }]}
            style={{ minWidth: 240, flex: 1 }}
          >
            <Input placeholder="VD: PROD-001" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Nhập tên' }]}
            style={{ minWidth: 280, flex: 2 }}
          >
            <Input placeholder="Tên sản phẩm" />
          </Form.Item>
        </Space>

        <Space align="start" style={{ width: '100%' }} size={16} wrap>
          <Form.Item
            name="categoryId"
            label="Danh mục"
            rules={[{ required: true, message: 'Chọn danh mục' }]}
            style={{ minWidth: 280, flex: 2 }}
          >
            <Select
              showSearch
              allowClear
              loading={loadingRefData}
              optionFilterProp="label"
              placeholder="Chọn danh mục…"
              options={categories.map((c) => ({
                value: c.id,
                label: `${c.code} — ${c.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="defaultUomId"
            label="Đơn vị tính mặc định"
            rules={[{ required: true, message: 'Chọn đơn vị' }]}
            style={{ minWidth: 280, flex: 2 }}
          >
            <Select
              showSearch
              allowClear
              loading={loadingRefData}
              optionFilterProp="label"
              placeholder="Chọn đơn vị…"
              options={units.map((u) => ({
                value: u.id,
                label: `${u.code} — ${u.name}${u.symbol ? ` (${u.symbol})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  )
}

