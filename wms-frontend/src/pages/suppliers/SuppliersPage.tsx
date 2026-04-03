import { Button, Input, Space, Table, Tag, Typography, message } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDeleteDialog } from '../../components'
import { useDebouncedValue } from '../../hooks'
import { suppliersService } from '../../services'
import type { Supplier } from '../../types'
import { CreateSupplierDialog } from './CreateSupplierDialog.tsx'
import { UpdateSupplierDialog } from './UpdateSupplierDialog.tsx'

const { Title } = Typography

export function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await suppliersService.list({
        page,
        limit,
        q: q || undefined,
      })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách nhà cung cấp')
    } finally {
      setListLoading(false)
    }
  }, [page, limit, q])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    setPage(1)
  }, [q])

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize: limit,
    total,
    showSizeChanger: true,
    onChange: (p, ps) => {
      setPage(p)
      if (ps !== limit) setLimit(ps ?? 10)
    },
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await suppliersService.remove(deleteTarget.id)
      message.success('Đã xóa nhà cung cấp')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được nhà cung cấp')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Nhà cung cấp
      </Title>

      <Space wrap style={{ marginBottom: 16 }} align="start">
        <Input.Search
          allowClear
          placeholder="Tìm theo mã, tên…"
          style={{ width: 320 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Thêm nhà cung cấp
        </Button>
      </Space>

      <Table<Supplier>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 140 },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'MST',
            dataIndex: 'tax_id',
            width: 160,
            render: (v: string | null) => v ?? '—',
          },
          {
            title: 'Liên hệ',
            dataIndex: 'contact_count',
            width: 90,
            align: 'right',
            render: (v?: number) => v ?? '—',
          },
          {
            title: 'Hoạt động',
            dataIndex: 'active',
            width: 120,
            render: (active: boolean) =>
              active ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>,
          },
          {
            title: '',
            key: 'actions',
            width: 180,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" onClick={() => setEditId(record.id)}>
                  Sửa
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => setDeleteTarget(record)}
                >
                  Xóa
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <CreateSupplierDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateSupplierDialog
        open={!!editId}
        supplierId={editId}
        onClose={() => setEditId(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa nhà cung cấp"
        description={
          deleteTarget ? (
            <>
              Xóa <strong>{deleteTarget.code}</strong> — {deleteTarget.name}?
            </>
          ) : null
        }
        confirmLoading={deleteLoading}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
      />
    </div>
  )
}
