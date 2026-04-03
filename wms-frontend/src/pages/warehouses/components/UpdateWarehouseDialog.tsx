import { Form, Input, Modal, Select, Switch, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Location, Warehouse } from '../../../types'
import { warehousesService } from '../../../services'

type FormValues = {
  code: string
  name: string
  address: string
  active: boolean
  defaultLocationId: string | null
}

export type UpdateWarehouseDialogProps = {
  open: boolean
  warehouse: Warehouse | null
  onClose: () => void
  onSuccess: () => void
}

function asFlatLocations(res: unknown): Location[] {
  if (!res || typeof res !== 'object') return []
  if ('view' in res && (res as { view?: unknown }).view === 'tree') return []
  if ('data' in res && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: Location[] }).data
  }
  return []
}

export function UpdateWarehouseDialog({
  open,
  warehouse,
  onClose,
  onSuccess,
}: UpdateWarehouseDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  const [binOptions, setBinOptions] = useState<Location[]>([])
  const [binsLoading, setBinsLoading] = useState(false)
  const [binQ, setBinQ] = useState('')

  const loadBinLocations = useCallback(
    async (warehouseId: string) => {
      setBinsLoading(true)
      try {
        const res = await warehousesService.listLocations(warehouseId, {
          view: 'flat',
          type: 'bin',
          q: binQ || undefined,
          page: 1,
          limit: 200,
        })
        setBinOptions(asFlatLocations(res))
      } catch {
        setBinOptions([])
      } finally {
        setBinsLoading(false)
      }
    },
    [binQ],
  )

  useEffect(() => {
    if (!open || !warehouse) return
    form.setFieldsValue({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address ?? '',
      active: warehouse.active,
      defaultLocationId: warehouse.defaultLocationId,
    })
  }, [open, warehouse, form])

  useEffect(() => {
    if (!open || !warehouse) return
    void loadBinLocations(warehouse.id)
  }, [open, warehouse, loadBinLocations])

  useEffect(() => {
    if (!open || !warehouse) return
    void loadBinLocations(warehouse.id)
  }, [binQ, open, warehouse, loadBinLocations])

  const locationSelectOptions = useMemo(
    () =>
      binOptions.map((l) => ({
        value: l.id,
        label: `${l.code}${l.name ? ` — ${l.name}` : ''}`,
      })),
    [binOptions],
  )

  const handleOk = async () => {
    if (!warehouse) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await warehousesService.update(warehouse.id, {
        code: values.code.trim(),
        name: values.name.trim(),
        address: values.address?.trim() || undefined,
        active: values.active,
        defaultLocationId: values.defaultLocationId ?? null,
      })
      message.success('Đã cập nhật kho')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được kho')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa kho"
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
          rules={[{ required: true, message: 'Nhập mã kho' }]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên kho' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Địa chỉ">
          <Input />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="defaultLocationId" label="Ô mặc định (nhập nhanh)">
          <Select
            allowClear
            showSearch
            placeholder="Chọn ô (bin)…"
            loading={binsLoading}
            options={locationSelectOptions}
            filterOption={false}
            onSearch={setBinQ}
            notFoundContent={binsLoading ? 'Đang tải…' : 'Không có dữ liệu'}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

