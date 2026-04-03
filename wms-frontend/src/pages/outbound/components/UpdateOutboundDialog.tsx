import { Form, Input, Modal, Select, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { OutboundDocument, Warehouse } from '../../../types'
import { outboundService, warehousesService } from '../../../services'

type FormValues = {
  documentNo: string
  documentDate: string
  warehouseId: string
  reason: string
  notes: string
}

export type UpdateOutboundDialogProps = {
  open: boolean
  outbound: OutboundDocument | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateOutboundDialog({
  open,
  outbound,
  onClose,
  onSuccess,
}: UpdateOutboundDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await warehousesService.list({ page: 1, limit: 200 })
      setWarehouses(res.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!open || !outbound) return
    void loadWarehouses()
    form.setFieldsValue({
      documentNo: outbound.documentNo ?? '',
      documentDate: outbound.documentDate ?? '',
      warehouseId: outbound.warehouseId,
      reason: (outbound.reason as string | null) ?? '',
      notes: (outbound.notes as string | null) ?? '',
    })
  }, [open, outbound, form, loadWarehouses])

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` })),
    [warehouses],
  )

  const handleOk = async () => {
    if (!outbound) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await outboundService.update(outbound.id, {
        warehouseId: values.warehouseId,
        documentNo: values.documentNo?.trim() || undefined,
        documentDate: values.documentDate?.trim() || undefined,
        reason: values.reason?.trim() || null,
        notes: values.notes?.trim() || null,
      })
      message.success('Đã cập nhật phiếu xuất')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được phiếu xuất')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa phiếu xuất"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="documentNo" label="Số phiếu">
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="documentDate"
          label="Ngày chứng từ"
          rules={[
            {
              validator: async (_, value: string) => {
                const v = (value ?? '').trim()
                if (!v) return
                if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                  throw new Error('Nhập theo định dạng YYYY-MM-DD')
                }
              },
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
        <Form.Item
          name="warehouseId"
          label="Kho"
          rules={[{ required: true, message: 'Chọn kho' }]}
        >
          <Select
            showSearch
            options={warehouseOptions}
            placeholder="Chọn kho…"
            filterOption={(input, opt) =>
              (opt?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="reason" label="Lý do xuất">
          <Input />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

