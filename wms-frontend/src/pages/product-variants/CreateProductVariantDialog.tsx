import { Form, Input, InputNumber, Modal, Select, Space, Switch, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { attributesService, productsService } from '../../services'
import type { Attribute, Product } from '../../types'

type FormValues = {
  productId: string
  sku: string
  barcode?: string
  active: boolean
  attributeId?: string
  valueId?: string
  currencyCode?: string
  listPrice?: number | null
  costPrice?: number | null
  minStock?: number | null
  maxStock?: number | null
}

export type CreateProductVariantDialogProps = {
  open: boolean
  /** Khi đã lọc sản phẩm trên trang, chọn sẵn trong form. */
  defaultProductId: string | null
  onClose: () => void
  onSuccess: () => void
}

const { Text } = Typography

export function CreateProductVariantDialog({
  open,
  defaultProductId,
  onClose,
  onSuccess,
}: CreateProductVariantDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])

  const attributeId = Form.useWatch('attributeId', form)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      active: true,
      productId: defaultProductId ?? undefined,
      currencyCode: 'VND',
    })
  }, [open, defaultProductId, form])

  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoading(true)
      try {
        const [prodsRes, attrsRes] = await Promise.all([
          productsService.list({ page: 1, limit: 500 }),
          attributesService.list({ page: 1, limit: 200, includeValues: true, active: true }),
        ])
        setProducts(prodsRes.data)
        setAttributes(attrsRes.data)
      } catch {
        message.error('Không tải được dữ liệu sản phẩm / thuộc tính')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [open])

  const valueOptions = useMemo(() => {
    if (!attributeId) return []
    const a = attributes.find((x) => x.id === attributeId)
    return (a?.values ?? [])
      .filter((v) => v.deleted_at == null)
      .map((v) => ({ value: v.id, label: `${v.code} — ${v.name}` }))
  }, [attributeId, attributes])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const body = {
        sku: values.sku.trim().toUpperCase(),
        barcode: values.barcode?.trim() || undefined,
        active: values.active,
        ...(values.attributeId && values.valueId
          ? { attributeId: values.attributeId, valueId: values.valueId }
          : {}),
      }
      const cc = values.currencyCode?.trim().toUpperCase()
      if (cc) Object.assign(body, { currencyCode: cc })
      if (values.listPrice != null) Object.assign(body, { listPrice: values.listPrice })
      if (values.costPrice != null) Object.assign(body, { costPrice: values.costPrice })
      if (values.minStock != null) Object.assign(body, { minStock: values.minStock })
      if (values.maxStock != null) Object.assign(body, { maxStock: values.maxStock })

      await productsService.createVariant(values.productId, body)
      message.success('Đã tạo biến thể')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được biến thể')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Thêm biến thể (SKU)"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      width={820}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="productId"
          label="Sản phẩm"
          rules={[{ required: true, message: 'Chọn sản phẩm' }]}
        >
          <Select
            showSearch
            allowClear
            loading={loading}
            optionFilterProp="label"
            placeholder="Chọn sản phẩm…"
            options={products.map((p) => ({
              value: p.id,
              label: `${p.code} — ${p.name}`,
            }))}
          />
        </Form.Item>
        <Space align="start" style={{ width: '100%' }} size={16} wrap>
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Nhập SKU' }]}
            style={{ minWidth: 280, flex: 1 }}
          >
            <Input placeholder="VD: PROD-001-RED-M" autoComplete="off" />
          </Form.Item>
          <Form.Item name="barcode" label="Barcode" style={{ minWidth: 260, flex: 1 }}>
            <Input placeholder="(tuỳ chọn)" autoComplete="off" />
          </Form.Item>
        </Space>

        <Space align="start" style={{ width: '100%' }} size={16} wrap>
          <Form.Item name="attributeId" label="Thuộc tính (tuỳ chọn)" style={{ minWidth: 260 }}>
            <Select
              allowClear
              showSearch
              loading={loading}
              optionFilterProp="label"
              placeholder="VD: Màu, Size…"
              options={attributes.map((a) => ({
                value: a.id,
                label: `${a.code} — ${a.name}`,
              }))}
              onChange={() => form.setFieldValue('valueId', undefined)}
            />
          </Form.Item>
          <Form.Item
            name="valueId"
            label="Giá trị biến thể"
            dependencies={['attributeId']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, v) {
                  const aid = getFieldValue('attributeId') as string | undefined
                  if (!aid) return Promise.resolve()
                  if (!v) return Promise.reject(new Error('Chọn giá trị'))
                  return Promise.resolve()
                },
              }),
            ]}
            style={{ minWidth: 280, flex: 1 }}
          >
            <Select
              allowClear
              showSearch
              disabled={!attributeId}
              loading={loading}
              optionFilterProp="label"
              placeholder={attributeId ? 'Chọn giá trị…' : 'Chọn thuộc tính trước'}
              options={valueOptions}
            />
          </Form.Item>
        </Space>

        <Text type="secondary">Giá & ngưỡng tồn</Text>
        <Space align="start" style={{ width: '100%', marginTop: 8 }} size={16} wrap>
          <Form.Item
            name="currencyCode"
            label="Tiền tệ (ISO-4217)"
            rules={[
              {
                validator(_, v) {
                  const s = typeof v === 'string' ? v.trim().toUpperCase() : ''
                  if (!s) return Promise.resolve()
                  if (!/^[A-Z]{3}$/.test(s)) {
                    return Promise.reject(new Error('Nhập đúng 3 ký tự, VD: VND'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
            style={{ minWidth: 140 }}
          >
            <Input placeholder="VND" maxLength={3} autoComplete="off" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="listPrice" label="Giá niêm yết" style={{ minWidth: 160 }}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="—" />
          </Form.Item>
          <Form.Item name="costPrice" label="Giá vốn" style={{ minWidth: 160 }}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="—" />
          </Form.Item>
        </Space>
        <Space align="start" style={{ width: '100%' }} size={16} wrap>
          <Form.Item name="minStock" label="Min (ngưỡng)" style={{ minWidth: 160 }}>
            <InputNumber min={0} precision={3} style={{ width: '100%' }} placeholder="—" />
          </Form.Item>
          <Form.Item
            name="maxStock"
            label="Max (ngưỡng)"
            dependencies={['minStock']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, maxV) {
                  const minV = getFieldValue('minStock') as number | null | undefined
                  if (
                    minV != null &&
                    maxV != null &&
                    typeof maxV === 'number' &&
                    maxV < minV
                  ) {
                    return Promise.reject(new Error('Max phải ≥ Min'))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
            style={{ minWidth: 160 }}
          >
            <InputNumber min={0} precision={3} style={{ width: '100%' }} placeholder="—" />
          </Form.Item>
        </Space>

        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
