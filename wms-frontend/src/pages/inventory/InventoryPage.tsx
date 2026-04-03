import {
  Card,
  Input,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../hooks'
import { inventoryService, warehousesService } from '../../services'
import type { StockBalanceItem, Warehouse } from '../../types'

const { Title, Text } = Typography

function formatQty(q: string): string {
  const n = parseFloat(q)
  if (!Number.isFinite(n)) return q
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(n)
}

export function InventoryPage() {
  const [rows, setRows] = useState<StockBalanceItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)

  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [warehouseId, setWarehouseId] = useState<string | undefined>()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingWh, setLoadingWh] = useState(false)

  const loadWarehouses = useCallback(async () => {
    setLoadingWh(true)
    try {
      const res = await warehousesService.list({ page: 1, limit: 500, active: true })
      setWarehouses(res.data)
    } catch {
      message.error('Không tải được danh sách kho')
    } finally {
      setLoadingWh(false)
    }
  }, [])

  const loadBalances = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inventoryService.listBalances({
        page,
        limit,
        q: q.trim() || undefined,
        warehouseId,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách tồn kho')
    } finally {
      setLoading(false)
    }
  }, [page, limit, q, warehouseId])

  useEffect(() => {
    void loadWarehouses()
  }, [loadWarehouses])

  useEffect(() => {
    void loadBalances()
  }, [loadBalances])

  useEffect(() => {
    setPage(1)
  }, [q, warehouseId])

  const pagination: TablePaginationConfig = useMemo(
    () => ({
      current: page,
      pageSize: limit,
      total,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (t) => `${t} dòng tồn`,
      onChange: (p, ps) => {
        setPage(p)
        if (ps !== limit) setLimit(ps ?? 20)
      },
    }),
    [page, limit, total],
  )

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Tổng quan tồn kho
      </Title>
      <Text type="secondary">
        Danh sách tồn theo kho, vị trí và SKU. Sau khi hoàn tất nhập kho, dòng tồn sẽ
        xuất hiện tại đây (có thể tìm theo mã SP, tên SP hoặc SKU).
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Tìm SKU / mã SP / tên SP…"
            style={{ width: 300 }}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <Select
            style={{ width: 280 }}
            placeholder="Lọc theo kho"
            allowClear
            loading={loadingWh}
            value={warehouseId}
            options={warehouses.map((w) => ({
              value: w.id,
              label: `${w.code} — ${w.name}`,
            }))}
            onChange={(v) => setWarehouseId(v ?? undefined)}
          />
        </Space>

        <Table<StockBalanceItem>
          rowKey="id"
          loading={loading}
          pagination={pagination}
          dataSource={rows}
          scroll={{ x: 1100 }}
          columns={[
            {
              title: 'Kho',
              key: 'wh',
              width: 180,
              ellipsis: true,
              render: (_, r) =>
                r.warehouseCode
                  ? `${r.warehouseCode}${r.warehouseName ? ` — ${r.warehouseName}` : ''}`
                  : r.warehouseId,
            },
            {
              title: 'Vị trí',
              dataIndex: 'locationCode',
              width: 120,
              render: (code: string | undefined) => code ?? '—',
            },
            { title: 'SKU', dataIndex: 'sku', width: 140 },
            { title: 'Mã SP', dataIndex: 'productCode', width: 120 },
            {
              title: 'Tên SP',
              dataIndex: 'productName',
              ellipsis: true,
            },
            {
              title: 'SL',
              dataIndex: 'quantity',
              width: 120,
              align: 'right',
              render: (v: string) => <Text strong>{formatQty(v)}</Text>,
            },
            {
              title: 'Cập nhật',
              dataIndex: 'updatedAt',
              width: 170,
              render: (iso: string) =>
                new Date(iso).toLocaleString('vi-VN', { hour12: false }),
            },
          ]}
        />
      </Card>
    </div>
  )
}
