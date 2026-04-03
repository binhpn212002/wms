import {
  Button,
  Drawer,
  Input,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDeleteDialog } from '../../../components'
import { useDebouncedValue } from '../../../hooks'
import { locationsService, warehousesService } from '../../../services'
import type { Location, Warehouse } from '../../../types'
import { CreateLocationDialog } from './CreateLocationDialog'
import { UpdateLocationDialog } from './UpdateLocationDialog'

export type LocationsDrawerProps = {
  open: boolean
  warehouse: Warehouse | null
  onClose: () => void
}

type ViewMode = 'tree' | 'flat'

function flattenTree(nodes: Location[], acc: Location[] = []) {
  for (const n of nodes) {
    acc.push(n)
    if (n.children?.length) flattenTree(n.children, acc)
  }
  return acc
}

function isTreeResult(
  res: unknown,
): res is { view: 'tree'; data: Location[] } {
  return !!res && typeof res === 'object' && (res as { view?: unknown }).view === 'tree'
}

export function LocationsDrawer({ open, warehouse, onClose }: LocationsDrawerProps) {
  const { Title } = Typography

  const [view, setView] = useState<ViewMode>('tree')
  const [rowsTree, setRowsTree] = useState<Location[]>([])
  const [rowsFlat, setRowsFlat] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Location | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadLocations = useCallback(async () => {
    if (!warehouse) return
    setLoading(true)
    try {
      if (view === 'tree') {
        const res = await warehousesService.listLocations(warehouse.id, {
          view: 'tree',
          q: q || undefined,
        })
        if (!isTreeResult(res)) {
          setRowsTree([])
          setRowsFlat([])
        } else {
          setRowsTree(res.data)
          setRowsFlat(flattenTree(res.data, []))
        }
      } else {
        const res = await warehousesService.listLocations(warehouse.id, {
          view: 'flat',
          q: q || undefined,
          page: 1,
          limit: 200,
        })
        if (isTreeResult(res)) {
          setRowsFlat([])
          setRowsTree(res.data)
        } else {
          setRowsFlat(res.data)
          setRowsTree([])
        }
      }
    } catch {
      message.error('Không tải được danh sách vị trí')
    } finally {
      setLoading(false)
    }
  }, [warehouse, view, q])

  useEffect(() => {
    if (!open) return
    void loadLocations()
  }, [open, loadLocations])

  useEffect(() => {
    if (!open) return
    void loadLocations()
  }, [view, q, open, loadLocations])

  const typeTag = (t: string) => {
    if (t === 'bin') return <Tag color="blue">BIN</Tag>
    if (t === 'rack') return <Tag color="gold">RACK</Tag>
    if (t === 'zone') return <Tag color="green">ZONE</Tag>
    return <Tag>{t}</Tag>
  }

  const columns: ColumnsType<Location> = useMemo(
    () => [
      { title: 'Mã', dataIndex: 'code', width: 180 },
      { title: 'Tên', dataIndex: 'name', render: (v: string | null) => v ?? '—' },
      {
        title: 'Loại',
        dataIndex: 'type',
        width: 120,
        render: (t: string) => typeTag(t),
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
    ],
    [],
  )

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await locationsService.remove(deleteTarget.id)
      message.success('Đã xóa vị trí')
      setDeleteTarget(null)
      await loadLocations()
    } catch {
      message.error('Không xóa được vị trí')
    } finally {
      setDeleteLoading(false)
    }
  }

  const title = warehouse ? `Vị trí — ${warehouse.code} — ${warehouse.name}` : 'Vị trí'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width={900}
      destroyOnClose
    >
      <Title level={5} style={{ marginTop: 0 }}>
        Danh sách vị trí
      </Title>
      <Space wrap style={{ marginBottom: 12 }} align="start">
        <Input.Search
          allowClear
          placeholder="Tìm theo mã, tên…"
          style={{ width: 280 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <Segmented<ViewMode>
          value={view}
          onChange={(v) => setView(v)}
          options={[
            { label: 'Tree', value: 'tree' },
            { label: 'Flat', value: 'flat' },
          ]}
        />
        <Button type="primary" onClick={() => setCreateOpen(true)} disabled={!warehouse}>
          Thêm vị trí
        </Button>
      </Space>

      {view === 'tree' ? (
        <Table<Location>
          rowKey="id"
          loading={loading}
          pagination={false}
          dataSource={rowsTree}
          columns={columns}
        />
      ) : (
        <Table<Location>
          rowKey="id"
          loading={loading}
          pagination={false}
          dataSource={rowsFlat}
          columns={columns}
        />
      )}

      <CreateLocationDialog
        open={createOpen}
        warehouse={warehouse}
        existingTree={rowsTree.length ? rowsTree : undefined}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadLocations()}
      />
      <UpdateLocationDialog
        open={!!editRow}
        warehouse={warehouse}
        location={editRow}
        existingTree={rowsTree.length ? rowsTree : undefined}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadLocations()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa vị trí"
        description={
          deleteTarget ? (
            <>
              Xóa <strong>{deleteTarget.code}</strong>
              {deleteTarget.name ? ` — ${deleteTarget.name}` : ''}?
            </>
          ) : null
        }
        confirmLoading={deleteLoading}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
      />
    </Drawer>
  )
}

