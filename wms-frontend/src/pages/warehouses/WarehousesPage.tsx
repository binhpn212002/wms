import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDeleteDialog } from '../../components'
import { useDebouncedValue } from '../../hooks'
import { warehousesService } from '../../services'
import type { Warehouse } from '../../types'
import { CreateWarehouseDialog } from './components/CreateWarehouseDialog'
import { LocationsDrawer } from './components/LocationsDrawer'
import { UpdateWarehouseDialog } from './components/UpdateWarehouseDialog'

export function WarehousesPage() {
  const { Title } = Typography

  const [rows, setRows] = useState<Warehouse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Warehouse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [locationsWarehouse, setLocationsWarehouse] = useState<Warehouse | null>(
    null,
  )

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await warehousesService.list({
        page,
        limit,
        q: q || undefined,
      })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách kho')
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

  const pagination: TablePaginationConfig = useMemo(
    () => ({
      current: page,
      pageSize: limit,
      total,
      showSizeChanger: true,
      onChange: (p, ps) => {
        setPage(p)
        if (ps !== limit) setLimit(ps ?? 10)
      },
    }),
    [page, limit, total],
  )

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await warehousesService.remove(deleteTarget.id)
      message.success('Đã xóa kho')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được kho')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Kho & vị trí
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
          Thêm kho
        </Button>
      </Space>

      <Table<Warehouse>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 140 },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'Địa chỉ',
            dataIndex: 'address',
            render: (v: string | null) => v ?? '—',
          },
          {
            title: 'Hoạt động',
            dataIndex: 'active',
            width: 120,
            render: (active: boolean) =>
              active ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>,
          },
          {
            title: 'Ô mặc định',
            dataIndex: 'defaultLocationId',
            width: 180,
            render: (v: string | null) => v ?? '—',
          },
          {
            title: '',
            key: 'actions',
            width: 260,
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setLocationsWarehouse(record)}
                >
                  Vị trí
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setEditRow(record)}
                >
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

      <CreateWarehouseDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateWarehouseDialog
        open={!!editRow}
        warehouse={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa kho"
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

      <LocationsDrawer
        open={!!locationsWarehouse}
        warehouse={locationsWarehouse}
        onClose={() => setLocationsWarehouse(null)}
      />
    </div>
  )
}
