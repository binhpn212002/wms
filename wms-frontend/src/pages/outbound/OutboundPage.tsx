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
import { outboundService, warehousesService } from '../../services'
import type { OutboundDocument, Warehouse } from '../../types'
import { CreateOutboundDialog } from './components/CreateOutboundDialog.tsx'
import { EditOutboundLinesDialog } from './components/EditOutboundLinesDialog.tsx'
import { UpdateOutboundDialog } from './components/UpdateOutboundDialog.tsx'

export function OutboundPage() {
  const { Title } = Typography

  const [rows, setRows] = useState<OutboundDocument[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [warehouseMap, setWarehouseMap] = useState<Record<string, Warehouse>>({})

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<OutboundDocument | null>(null)
  const [linesRow, setLinesRow] = useState<OutboundDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OutboundDocument | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadLookups = useCallback(async () => {
    try {
      const wh = await warehousesService.list({ page: 1, limit: 200 })
      const whAcc: Record<string, Warehouse> = {}
      for (const w of wh.data) whAcc[w.id] = w
      setWarehouseMap(whAcc)
    } catch {
      // ignore
    }
  }, [])

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await outboundService.list({ page, limit, q: q || undefined })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách phiếu xuất')
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

  const statusTag = (s: OutboundDocument['status']) => {
    if (s === 'completed') return <Tag color="green">COMPLETED</Tag>
    if (s === 'confirmed') return <Tag color="gold">CONFIRMED</Tag>
    return <Tag>DRAFT</Tag>
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await outboundService.remove(deleteTarget.id)
      message.success('Đã xóa phiếu xuất')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được phiếu xuất')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleValidate = async (doc: OutboundDocument) => {
    try {
      await outboundService.validate(doc.id)
      message.success('Đủ tồn để hoàn tất')
    } catch {
      message.error('Không đủ tồn hoặc không validate được')
    }
  }

  const handleConfirm = async (doc: OutboundDocument) => {
    try {
      await outboundService.confirm(doc.id)
      message.success('Đã xác nhận phiếu xuất')
      await loadList()
    } catch {
      message.error('Không xác nhận được phiếu xuất')
    }
  }

  const handleComplete = async (doc: OutboundDocument) => {
    try {
      await outboundService.complete(doc.id)
      message.success('Đã hoàn tất phiếu xuất')
      await loadList()
    } catch {
      message.error('Không hoàn tất được phiếu xuất')
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Xuất kho
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
          Tạo phiếu xuất
        </Button>
      </Space>

      <Table<OutboundDocument>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Số phiếu', dataIndex: 'documentNo', width: 180 },
          { title: 'Ngày', dataIndex: 'documentDate', width: 120 },
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
            render: (s: OutboundDocument['status']) => statusTag(s),
          },
          {
            title: '',
            key: 'actions',
            width: 420,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" onClick={() => setLinesRow(record)}>
                  Dòng
                </Button>
                <Button type="link" size="small" onClick={() => setEditRow(record)}>
                  Sửa
                </Button>
                <Button type="link" size="small" onClick={() => void handleValidate(record)}>
                  Kiểm tồn
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

      <CreateOutboundDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateOutboundDialog
        open={!!editRow}
        outbound={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <EditOutboundLinesDialog
        open={!!linesRow}
        outbound={linesRow}
        onClose={() => setLinesRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa phiếu xuất"
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
