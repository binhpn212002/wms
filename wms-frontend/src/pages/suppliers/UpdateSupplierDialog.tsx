import { Button, Form, Input, Modal, Space, Switch, Table, Tag, Typography, message } from 'antd'
import type { TableProps } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Supplier, SupplierContact } from '../../types'
import { ConfirmDeleteDialog } from '../../components'
import { suppliersService } from '../../services'
import { CreateSupplierContactDialog } from './CreateSupplierContactDialog'
import { UpdateSupplierContactDialog } from './UpdateSupplierContactDialog'

const { Text } = Typography

type FormValues = {
  name: string
  taxId: string
  notes: string
  active: boolean
}

export type UpdateSupplierDialogProps = {
  open: boolean
  supplierId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateSupplierDialog({
  open,
  supplierId,
  onClose,
  onSuccess,
}: UpdateSupplierDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supplier, setSupplier] = useState<Supplier | null>(null)

  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [editContact, setEditContact] = useState<SupplierContact | null>(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState<SupplierContact | null>(null)
  const [deleteContactLoading, setDeleteContactLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!supplierId) return
    setLoading(true)
    try {
      const res = await suppliersService.findOne(supplierId, { includeContacts: true })
      setSupplier(res)
      form.setFieldsValue({
        name: res.name,
        taxId: res.tax_id ?? '',
        notes: res.notes ?? '',
        active: res.active,
      })
    } catch {
      message.error('Không tải được chi tiết nhà cung cấp')
    } finally {
      setLoading(false)
    }
  }, [supplierId, form])

  useEffect(() => {
    if (!open) return
    void loadDetail()
  }, [open, loadDetail])

  useEffect(() => {
    if (!open) {
      setSupplier(null)
      setCreateContactOpen(false)
      setEditContact(null)
      setDeleteContactTarget(null)
    }
  }, [open])

  const handleOk = async () => {
    if (!supplierId) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await suppliersService.update(supplierId, {
        name: values.name.trim(),
        taxId: values.taxId?.trim() || null,
        notes: values.notes?.trim() || null,
        active: values.active,
      })
      message.success('Đã cập nhật nhà cung cấp')
      onSuccess()
      await loadDetail()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được nhà cung cấp')
    } finally {
      setSubmitting(false)
    }
  }

  const contacts = useMemo(() => {
    const list = supplier?.contacts ?? []
    return [...list].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
  }, [supplier])

  const contactColumns: TableProps<SupplierContact>['columns'] = [
    {
      title: 'Tên',
      dataIndex: 'name',
      render: (name: string, c) => (
        <Space size={8}>
          <span>{name}</span>
          {c.is_primary ? <Tag color="blue">Chính</Tag> : null}
        </Space>
      ),
    },
    { title: 'SĐT', dataIndex: 'phone', width: 140, render: (v: string | null) => v ?? '—' },
    { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
    { title: 'Chức danh', dataIndex: 'title', width: 180, render: (v: string | null) => v ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setEditContact(record)}>
            Sửa
          </Button>
          <Button type="link" size="small" danger onClick={() => setDeleteContactTarget(record)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ]

  const handleDeleteContactConfirm = async () => {
    if (!supplierId || !deleteContactTarget) return
    setDeleteContactLoading(true)
    try {
      await suppliersService.removeContact(supplierId, deleteContactTarget.id)
      message.success('Đã xóa liên hệ')
      setDeleteContactTarget(null)
      await loadDetail()
    } catch {
      message.error('Không xóa được liên hệ')
    } finally {
      setDeleteContactLoading(false)
    }
  }

  return (
    <Modal
      title="Sửa nhà cung cấp"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      width={900}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Space wrap style={{ marginBottom: 8 }}>
          <Text type="secondary">Mã:</Text>{' '}
          <Text strong>{supplier?.code ?? '—'}</Text>
        </Space>

        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input placeholder="Công ty ABC" disabled={loading} />
        </Form.Item>
        <Form.Item name="taxId" label="MST">
          <Input placeholder="VD: 0123456789" disabled={loading} />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Ghi chú nội bộ…" disabled={loading} />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch disabled={loading} />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 8 }}>
          <Text strong>Liên hệ</Text>
          <Button onClick={() => setCreateContactOpen(true)} disabled={!supplierId}>
            Thêm liên hệ
          </Button>
        </Space>
        <Table<SupplierContact>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={contacts}
          columns={contactColumns}
        />
      </div>

      {supplierId ? (
        <>
          <CreateSupplierContactDialog
            open={createContactOpen}
            supplierId={supplierId}
            onClose={() => setCreateContactOpen(false)}
            onSuccess={() => void loadDetail()}
          />
          <UpdateSupplierContactDialog
            open={!!editContact}
            supplierId={supplierId}
            contact={editContact}
            onClose={() => setEditContact(null)}
            onSuccess={() => void loadDetail()}
          />
          <ConfirmDeleteDialog
            open={!!deleteContactTarget}
            title="Xóa liên hệ"
            description={
              deleteContactTarget ? (
                <>
                  Xóa liên hệ <strong>{deleteContactTarget.name}</strong>?
                </>
              ) : null
            }
            confirmLoading={deleteContactLoading}
            onConfirm={() => void handleDeleteContactConfirm()}
            onCancel={() => !deleteContactLoading && setDeleteContactTarget(null)}
          />
        </>
      ) : null}
    </Modal>
  )
}

