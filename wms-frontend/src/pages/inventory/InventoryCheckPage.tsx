import {
  Card,
  Col,
  Input,
  message,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { inventoryService } from '../../services/inventory.service'
import { warehousesService } from '../../services/warehouses.service'
import type {
  InventoryCheckItem,
  InventoryCheckLookupResponse,
  InventoryCheckMode,
} from '../../types'
import type { Location, Warehouse } from '../../types'

const { Title, Text } = Typography

function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(n)
}

export function InventoryCheckPage() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 400)
  const [mode, setMode] = useState<InventoryCheckMode>('summary')
  const [warehouseId, setWarehouseId] = useState<string | undefined>()
  const [locationId, setLocationId] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading_WH, setLoadingWH] = useState(false)
  const [loadingLoc, setLoadingLoc] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InventoryCheckLookupResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingWH(true)
    warehousesService
      .list({ limit: 500, active: true })
      .then((res) => {
        if (!cancelled) setWarehouses(res.data)
      })
      .catch(() => {
        if (!cancelled) message.error('Không tải được danh sách kho')
      })
      .finally(() => {
        if (!cancelled) setLoadingWH(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!warehouseId) {
      setLocations([])
      setLocationId(undefined)
      return
    }
    let cancelled = false
    setLoadingLoc(true)
    warehousesService
      .listLocations(warehouseId, { view: 'flat', limit: 500 })
      .then((res) => {
        if (cancelled) return
        if ('data' in res && Array.isArray(res.data)) {
          setLocations(res.data)
        } else {
          setLocations([])
        }
      })
      .catch(() => {
        if (!cancelled) message.error('Không tải được vị trí trong kho')
      })
      .finally(() => {
        if (!cancelled) setLoadingLoc(false)
      })
    return () => {
      cancelled = true
    }
  }, [warehouseId])

  const fetchLookup = useCallback(async () => {
    const term = debouncedQ.trim()
    if (!term) {
      setResult(null)
      return
    }
    setLoading(true)
    try {
      const data = await inventoryService.inventoryCheckLookup({
        q: term,
        warehouseId,
        locationId,
        mode,
        page,
        pageSize,
      })
      setResult(data)
    } catch {
      message.error('Tra cứu tồn thất bại')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, warehouseId, locationId, mode, page, pageSize])

  useEffect(() => {
    void fetchLookup()
  }, [fetchLookup])

  const onWarehouseChange = (value: string | null) => {
    setWarehouseId(value ?? undefined)
    setLocationId(undefined)
    setPage(1)
  }

  const summaryColumns: ColumnsType<InventoryCheckItem> = useMemo(
    () => [
      { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 160 },
      {
        title: 'Barcode',
        dataIndex: 'barcode',
        key: 'barcode',
        width: 140,
        render: (v: string | null) => v ?? '—',
      },
      {
        title: 'Mã SP',
        key: 'pcode',
        width: 120,
        render: (_, r) => r.product.code,
      },
      {
        title: 'Tên SP',
        key: 'pname',
        ellipsis: true,
        render: (_, r) => r.product.name,
      },
      {
        title: 'Tổng tồn',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 120,
        align: 'right',
        render: (n: number) => <Text strong>{formatQty(n)}</Text>,
      },
    ],
    [],
  )

  const detailsColumns: ColumnsType<InventoryCheckItem> = useMemo(
    () => [
      { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 160 },
      {
        title: 'Barcode',
        dataIndex: 'barcode',
        key: 'barcode',
        width: 140,
        render: (v: string | null) => v ?? '—',
      },
      {
        title: 'Mã SP',
        key: 'pcode',
        width: 120,
        render: (_, r) => r.product.code,
      },
      {
        title: 'Tên SP',
        key: 'pname',
        ellipsis: true,
        render: (_, r) => r.product.name,
      },
      {
        title: 'Tổng (theo dòng)',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 120,
        align: 'right',
        render: (n: number) => <Text strong>{formatQty(n)}</Text>,
      },
    ],
    [],
  )

  const expandedRowRender = (record: InventoryCheckItem) => {
    if (mode === 'summary') {
      const rows = record.breakdownByWarehouse ?? []
      if (rows.length === 0) {
        return (
          <Text type="secondary" style={{ paddingLeft: 24 }}>
            Không có dòng tồn trong phạm vi lọc (tổng có thể bằng 0).
          </Text>
        )
      }
      return (
        <Table
          size="small"
          pagination={false}
          rowKey="warehouseId"
          dataSource={rows}
          columns={[
            { title: 'Mã kho', dataIndex: 'code', key: 'code', width: 100 },
            { title: 'Tên kho', dataIndex: 'name', key: 'name' },
            {
              title: 'Số lượng',
              dataIndex: 'quantity',
              key: 'quantity',
              align: 'right',
              width: 120,
              render: (n: number) => formatQty(n),
            },
          ]}
        />
      )
    }

    const lines = record.lines ?? []
    if (lines.length === 0) {
      return (
        <Text type="secondary" style={{ paddingLeft: 24 }}>
          Không có dòng tồn &gt; 0 trong phạm vi lọc.
        </Text>
      )
    }
    return (
      <Table
        size="small"
        pagination={false}
        rowKey={(row) => `${row.warehouseId}-${row.locationId}`}
        dataSource={lines}
        columns={[
          { title: 'Kho', key: 'wh', render: (_, l) => `${l.warehouse.code}` },
          {
            title: 'Vị trí',
            key: 'loc',
            render: (_, l) =>
              `${l.location.code}${l.location.name ? ` — ${l.location.name}` : ''}`,
          },
          {
            title: 'SL',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            width: 100,
            render: (n: number) => formatQty(n),
          },
          {
            title: 'Cập nhật',
            dataIndex: 'balanceUpdatedAt',
            key: 'balanceUpdatedAt',
            width: 180,
            render: (iso: string) =>
              new Date(iso).toLocaleString('vi-VN', { hour12: false }),
          },
        ]}
      />
    )
  }

  return (
    <div>
      <Title level={3}>Check hàng tồn</Title>
      <Text type="secondary">
        Nhập SKU hoặc barcode (khớp chính xác, không phân biệt hoa thường). Xem
        tổng theo kho hoặc chi tiết theo vị trí. Để xem danh sách tồn (tìm theo
        mã/tên SP hoặc SKU), dùng mục Tổng quan trong menu Tồn kho.
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12} lg={10}>
              <Input.Search
                placeholder="SKU hoặc barcode"
                allowClear
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                onSearch={(v) => {
                  setQ(v)
                  setPage(1)
                }}
                enterButton="Tra cứu"
                loading={loading}
              />
            </Col>
            <Col xs={24} md={12} lg={7}>
              <Select
                style={{ width: '100%' }}
                placeholder="Kho (tùy chọn)"
                allowClear
                loading={loading_WH}
                options={warehouses.map((w) => ({
                  value: w.id,
                  label: `${w.code} — ${w.name}`,
                }))}
                value={warehouseId}
                onChange={onWarehouseChange}
              />
            </Col>
            <Col xs={24} md={12} lg={7}>
              <Select
                style={{ width: '100%' }}
                placeholder="Vị trí (tùy chọn)"
                allowClear
                disabled={!warehouseId}
                loading={loadingLoc}
                options={locations.map((loc) => ({
                  value: loc.id,
                  label: `${loc.code}${loc.name ? ` — ${loc.name}` : ''}`,
                }))}
                value={locationId}
                onChange={(v) => {
                  setLocationId(v ?? undefined)
                  setPage(1)
                }}
              />
            </Col>
          </Row>

          <div>
            <Text type="secondary">Chế độ hiển thị: </Text>
            <Radio.Group
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as InventoryCheckMode)
                setPage(1)
              }}
              options={[
                { label: 'Tổng hợp (theo kho)', value: 'summary' },
                { label: 'Chi tiết (kho + vị trí)', value: 'details' },
              ]}
            />
          </div>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table<InventoryCheckItem>
          rowKey="variantId"
          loading={loading}
          columns={mode === 'summary' ? summaryColumns : detailsColumns}
          dataSource={result?.items ?? []}
          pagination={{
            current: page,
            pageSize,
            total: result?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t) => `${t} biến thể`,
          }}
          onChange={(pg) => {
            setPage(pg.current ?? 1)
            setPageSize(pg.pageSize ?? 20)
          }}
          expandable={{ expandedRowRender }}
          locale={{
            emptyText: debouncedQ.trim()
              ? 'Không tìm thấy biến thể khớp SKU/barcode'
              : 'Nhập SKU hoặc barcode để tra cứu',
          }}
        />
      </Card>
    </div>
  )
}
