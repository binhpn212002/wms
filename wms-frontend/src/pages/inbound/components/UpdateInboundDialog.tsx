import { Form, Input, Modal, Select, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InboundDocument, Supplier, Warehouse } from '../../../types'
import { inboundService, suppliersService, warehousesService } from '../../../services'

type FormValues = {
  documentNo: string
  documentDate: string
  supplierId: string
  warehouseId: string
  notes: string
}

export type UpdateInboundDialogProps = {
  open: boolean
  inbound: InboundDocument | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateInboundDialog({
  open,
  inbound,
  onClose,
  onSuccess,
}: UpdateInboundDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const loadLookups = useCallback(async () => {
    try {
      const [sup, wh] = await Promise.all([
        suppliersService.list({ page: 1, limit: 200 }),
        warehousesService.list({ page: 1, limit: 200 }),
      ])
      setSuppliers(sup.data)
      setWarehouses(wh.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!open || !inbound) return
    void loadLookups()
    form.setFieldsValue({
      documentNo: inbound.documentNo ?? '',
      documentDate: inbound.documentDate ?? '',
      supplierId: inbound.supplierId,
      warehouseId: inbound.warehouseId,
      notes: (inbound.notes as string | null) ?? '',
    })
  }, [open, inbound, form, loadLookups])

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` })),
    [suppliers],
  )

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` })),
    [warehouses],
  )

  const handleOk = async () => {
    if (!inbound) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await inboundService.update(inbound.id, {
        supplierId: values.supplierId,
        warehouseId: values.warehouseId,
        documentNo: values.documentNo?.trim() || undefined,
        documentDate: values.documentDate?.trim() || undefined,
        notes: values.notes?.trim() || null,
      })
      message.success('Đã cập nhật phiếu nhập')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được phiếu nhập')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa phiếu nhập"
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
          name="supplierId"
          label="Nhà cung cấp"
          rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
        >
          <Select
            showSearch
            options={supplierOptions}
            placeholder="Chọn nhà cung cấp…"
            filterOption={(input, opt) =>
              (opt?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
          />
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
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

