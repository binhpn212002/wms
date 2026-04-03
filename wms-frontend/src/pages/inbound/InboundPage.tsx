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
import { inboundService, suppliersService, warehousesService } from '../../services'
import type { InboundDocument, Supplier, Warehouse } from '../../types'
import { CreateInboundDialog } from './components/CreateInboundDialog.tsx'
import { EditInboundLinesDialog } from './components/EditInboundLinesDialog.tsx'
import { UpdateInboundDialog } from './components/UpdateInboundDialog.tsx'

export function InboundPage() {
  const { Title } = Typography

  const [rows, setRows] = useState<InboundDocument[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [warehouseMap, setWarehouseMap] = useState<Record<string, Warehouse>>({})
  const [supplierMap, setSupplierMap] = useState<Record<string, Supplier>>({})

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<InboundDocument | null>(null)
  const [linesRow, setLinesRow] = useState<InboundDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InboundDocument | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadLookups = useCallback(async () => {
    try {
      const [wh, sup] = await Promise.all([
        warehousesService.list({ page: 1, limit: 200 }),
        suppliersService.list({ page: 1, limit: 200 }),
      ])
      const whAcc: Record<string, Warehouse> = {}
      for (const w of wh.data) whAcc[w.id] = w
      setWarehouseMap(whAcc)

      const supAcc: Record<string, Supplier> = {}
      for (const s of sup.data) supAcc[s.id] = s
      setSupplierMap(supAcc)
    } catch {
      // ignore lookups failure; table can show IDs
    }
  }, [])

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await inboundService.list({ page, limit, q: q || undefined })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách phiếu nhập')
    } finally {
      setListLoading(false)
    }
  }, [page, limit, q])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

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

  const statusTag = (s: InboundDocument['status']) => {
    if (s === 'completed') return <Tag color="green">COMPLETED</Tag>
    if (s === 'confirmed') return <Tag color="gold">CONFIRMED</Tag>
    return <Tag>DRAFT</Tag>
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await inboundService.remove(deleteTarget.id)
      message.success('Đã xóa phiếu nhập')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được phiếu nhập')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleConfirm = async (doc: InboundDocument) => {
    try {
      await inboundService.confirm(doc.id)
      message.success('Đã xác nhận phiếu nhập')
      await loadList()
    } catch {
      message.error('Không xác nhận được phiếu nhập')
    }
  }

  const handleComplete = async (doc: InboundDocument) => {
    try {
      await inboundService.complete(doc.id)
      message.success('Đã hoàn tất phiếu nhập')
      await loadList()
    } catch {
      message.error('Không hoàn tất được phiếu nhập')
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Nhập kho
      </Title>

      <Space wrap style={{ marginBottom: 16 }} align="start">
        <Input.Search
          allowClear
          placeholder="Tìm theo số phiếu…"
          style={{ width: 280 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Tạo phiếu nhập
        </Button>
      </Space>

      <Table<InboundDocument>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        onRow={(record) => ({
          onClick: (e) => {
            const t = e.target as HTMLElement
            if (t.closest('button') || t.closest('.ant-btn')) return
            setLinesRow(record)
          },
          style: { cursor: 'pointer' },
        })}
        columns={[
          { title: 'Số phiếu', dataIndex: 'documentNo', width: 180 },
          { title: 'Ngày', dataIndex: 'documentDate', width: 120 },
          {
            title: 'Nhà cung cấp',
            dataIndex: 'supplierId',
            render: (id: string) => {
              const s = supplierMap[id]
              return s ? `${s.code} — ${s.name}` : id
            },
          },
          {
            title: 'Kho',
            dataIndex: 'warehouseId',
            render: (id: string) => {
              const w = warehouseMap[id]
              return w ? `${w.code} — ${w.name}` : id
            },
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 140,
            render: (s: InboundDocument['status']) => statusTag(s),
          },
          {
            title: '',
            key: 'actions',
            width: 360,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" onClick={() => setLinesRow(record)}>
                  Dòng
                </Button>
                <Button type="link" size="small" onClick={() => setEditRow(record)}>
                  Sửa
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => void handleConfirm(record)}
                  disabled={record.status !== 'draft'}
                >
                  Xác nhận
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => void handleComplete(record)}
                  disabled={record.status === 'completed'}
                >
                  Hoàn tất
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => setDeleteTarget(record)}
                  disabled={record.status === 'completed'}
                >
                  Xóa
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <CreateInboundDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateInboundDialog
        open={!!editRow}
        inbound={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <EditInboundLinesDialog
        open={!!linesRow}
        inbound={linesRow}
        onClose={() => setLinesRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa phiếu nhập"
        description={
          deleteTarget ? (
            <>
              Xóa <strong>{deleteTarget.documentNo}</strong>?
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
