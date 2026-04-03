import { Form, Input, InputNumber, Modal, Select, Space, Switch, Typography, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { Attribute, ProductVariant } from '../../types'
import { attributesService, productsService } from '../../services'

type FormValues = {
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

export type UpdateProductVariantDialogProps = {
  open: boolean
  productId: string | null
  variant: ProductVariant | null
  onClose: () => void
  onSuccess: () => void
}

const { Text } = Typography

export function UpdateProductVariantDialog({
  open,
  productId,
  variant,
  onClose,
  onSuccess,
}: UpdateProductVariantDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attributes, setAttributes] = useState<Attribute[]>([])

  const attributeId = Form.useWatch('attributeId', form)

  useEffect(() => {
    if (!open || !variant) return
    form.setFieldsValue({
      sku: variant.sku,
      barcode: variant.barcode ?? '',
      active: variant.active,
      attributeId: variant.attribute_id ?? undefined,
      valueId: variant.value_id ?? undefined,
      currencyCode: variant.currency_code ?? '',
      listPrice: variant.list_price ?? undefined,
      costPrice: variant.cost_price ?? undefined,
      minStock: variant.min_stock ?? undefined,
      maxStock: variant.max_stock ?? undefined,
    })
  }, [open, variant, form])

  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoading(true)
      try {
        const attrsRes = await attributesService.list({
          page: 1,
          limit: 200,
          includeValues: true,
          active: true,
        })
        setAttributes(attrsRes.data)
      } catch {
        message.error('Không tải được dữ liệu thuộc tính')
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
    if (!productId || !variant) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const hasPair = Boolean(values.attributeId && values.valueId)
      const ccRaw = values.currencyCode?.trim().toUpperCase()
      const currencyCode = ccRaw && ccRaw.length === 3 ? ccRaw : null

      await productsService.updateVariant(productId, variant.id, {
        sku: values.sku.trim().toUpperCase(),
        barcode: values.barcode?.trim() ? values.barcode.trim() : null,
        active: values.active,
        attributeId: hasPair ? values.attributeId! : null,
        valueId: hasPair ? values.valueId! : null,
        currencyCode,
        listPrice: values.listPrice ?? null,
        costPrice: values.costPrice ?? null,
        minStock: values.minStock ?? null,
        maxStock: values.maxStock ?? null,
      })
      message.success('Đã cập nhật biến thể')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được biến thể')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa biến thể (SKU)"
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
        <Space align="start" style={{ width: '100%' }} size={16} wrap>
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Nhập SKU' }]}
            style={{ minWidth: 280, flex: 1 }}
          >
            <Input autoComplete="off" />
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
