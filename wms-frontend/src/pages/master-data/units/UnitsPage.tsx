import { Button, Input, Space, Table, Tag, Typography, message } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDeleteDialog } from '../../../components'
import { useDebouncedValue } from '../../../hooks'
import type { Unit } from '../../../types'
import { unitsService } from '../../../services'
import { CreateUnitDialog } from './CreateUnitDialog'
import { UpdateUnitDialog } from './UpdateUnitDialog'

const { Title } = Typography

export function UnitsPage() {
  const [rows, setRows] = useState<Unit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Unit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await unitsService.list({ page, limit, q: q || undefined })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách đơn vị')
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
      await unitsService.remove(deleteTarget.id)
      message.success('Đã xóa đơn vị')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được đơn vị')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Đơn vị tính
      </Title>
      <Space wrap style={{ marginBottom: 16 }} align="start">
        <Input.Search
          allowClear
          placeholder="Tìm theo mã, tên…"
          style={{ width: 280 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Thêm đơn vị
        </Button>
      </Space>

      <Table<Unit>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 120 },
          { title: 'Tên', dataIndex: 'name' },
          { title: 'Ký hiệu', dataIndex: 'symbol', width: 100, render: (s) => s ?? '—' },
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
            width: 160,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" onClick={() => setEditRow(record)}>
                  Sửa
                </Button>
                <Button type="link" size="small" danger onClick={() => setDeleteTarget(record)}>
                  Xóa
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <CreateUnitDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateUnitDialog
        open={!!editRow}
        unit={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa đơn vị"
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
