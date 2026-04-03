import { Form, Input, Modal, Select, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { inboundService, suppliersService, warehousesService } from '../../../services'
import type { Supplier, Warehouse } from '../../../types'

type FormValues = {
  documentNo: string
  documentDate: string
  supplierId: string
  warehouseId: string
  notes: string
}

export type CreateInboundDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateInboundDialog({ open, onClose, onSuccess }: CreateInboundDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)

  const loadSuppliers = useCallback(async () => {
    setLoadingSuppliers(true)
    try {
      const res = await suppliersService.list({ page: 1, limit: 200, active: true })
      setSuppliers(res.data)
    } catch {
      setSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }, [])

  const loadWarehouses = useCallback(async () => {
    setLoadingWarehouses(true)
    try {
      const res = await warehousesService.list({ page: 1, limit: 200, active: true })
      setWarehouses(res.data)
    } catch {
      setWarehouses([])
    } finally {
      setLoadingWarehouses(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({ documentNo: '', documentDate: '', notes: '' })
    void loadSuppliers()
    void loadWarehouses()
  }, [open, form, loadSuppliers, loadWarehouses])

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` })),
    [suppliers],
  )

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` })),
    [warehouses],
  )

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await inboundService.create({
        supplierId: values.supplierId,
        warehouseId: values.warehouseId,
        documentNo: values.documentNo?.trim() || undefined,
        documentDate: values.documentDate?.trim() || undefined,
        notes: values.notes?.trim() || null,
      })
      message.success('Đã tạo phiếu nhập')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không tạo được phiếu nhập')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Tạo phiếu nhập"
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
          <Input placeholder="(để trống nếu hệ thống tự sinh)" autoComplete="off" />
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
            loading={loadingSuppliers}
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
            loading={loadingWarehouses}
            placeholder="Chọn kho…"
            filterOption={(input, opt) =>
              (opt?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="(tùy chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

