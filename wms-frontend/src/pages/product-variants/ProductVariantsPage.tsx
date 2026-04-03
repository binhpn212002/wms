import { Button, Input, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDeleteDialog } from '../../components'
import { useDebouncedValue } from '../../hooks'
import type { Product, ProductVariant } from '../../types'
import { productsService } from '../../services'
import { CreateProductVariantDialog } from './CreateProductVariantDialog'
import { UpdateProductVariantDialog } from './UpdateProductVariantDialog'

const { Title } = Typography

export function ProductVariantsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)

  const [rows, setRows] = useState<ProductVariant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<ProductVariant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const res = await productsService.list({ page: 1, limit: 500 })
      setProducts(res.data)
    } catch {
      message.error('Không tải được danh sách sản phẩm')
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await productsService.lookupVariants({
        page,
        limit,
        q: q || undefined,
        productId: productId ?? undefined,
      })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách biến thể')
    } finally {
      setListLoading(false)
    }
  }, [productId, page, limit, q])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    setPage(1)
  }, [q, productId])

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
    const pid = deleteTarget.product?.id ?? deleteTarget.product_id
    if (!pid) return
    setDeleteLoading(true)
    try {
      await productsService.removeVariant(pid, deleteTarget.id)
      message.success('Đã xóa biến thể')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được biến thể')
    } finally {
      setDeleteLoading(false)
    }
  }

  const editProductId = editRow?.product?.id ?? productId ?? null
  const formatNumber = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '—'
    return new Intl.NumberFormat('vi-VN').format(n)
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Biến thể / SKU
      </Title>
      <Space wrap style={{ marginBottom: 16 }} align="start">
        <Select
          allowClear
          showSearch
          loading={productsLoading}
          style={{ width: 320 }}
          placeholder="Lọc theo sản phẩm…"
          optionFilterProp="label"
          value={productId ?? undefined}
          onChange={(v) => setProductId(v ?? null)}
          options={products.map((p) => ({
            value: p.id,
            label: `${p.code} — ${p.name}`,
          }))}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo SKU, barcode…"
          style={{ width: 320 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Thêm biến thể
        </Button>
      </Space>

      <Table<ProductVariant>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        scroll={{ x: 1680 }}
        columns={[
          {
            title: 'Sản phẩm',
            key: 'product',
            render: (_, r) =>
              r.product ? `${r.product.code} — ${r.product.name}` : r.product_id,
          },
          { title: 'SKU', dataIndex: 'sku', width: 200 },
          {
            title: 'Barcode',
            dataIndex: 'barcode',
            width: 160,
            render: (b: string | null) => b ?? '—',
          },
          {
            title: 'Biến thể (thuộc tính)',
            key: 'attribute_label',
            width: 170,
            ellipsis: true,
            render: (_, r) =>
              r.attribute ? `${r.attribute.code} — ${r.attribute.name}` : '—',
          },
          {
            title: 'Giá trị biến thể',
            key: 'attribute_value_label',
            width: 170,
            ellipsis: true,
            render: (_, r) =>
              r.attribute_value
                ? `${r.attribute_value.code} — ${r.attribute_value.name}`
                : '—',
          },
          { title: 'Tiền tệ', dataIndex: 'currency_code', width: 90, render: (c: string | null) => c ?? '—' },
          {
            title: 'Giá niêm yết',
            dataIndex: 'list_price',
            width: 120,
            align: 'right',
            render: (v: number | null) => formatNumber(v),
          },
          {
            title: 'Giá vốn',
            dataIndex: 'cost_price',
            width: 110,
            align: 'right',
            render: (v: number | null) => formatNumber(v),
          },
          {
            title: 'Min',
            dataIndex: 'min_stock',
            width: 90,
            align: 'right',
            render: (v: number | null) => formatNumber(v),
          },
          {
            title: 'Max',
            dataIndex: 'max_stock',
            width: 90,
            align: 'right',
            render: (v: number | null) => formatNumber(v),
          },
          {
            title: 'Ảnh',
            dataIndex: 'image_urls',
            width: 80,
            align: 'right',
            render: (urls: string[] | null | undefined) =>
              Array.isArray(urls) && urls.length > 0 ? urls.length : '—',
          },
          {
            title: 'Hoạt động',
            dataIndex: 'active',
            width: 110,
            render: (active: boolean) =>
              active ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>,
          },
          {
            title: '',
            key: 'actions',
            width: 160,
            render: (_, record) => {
              const pid = record.product?.id ?? record.product_id
              return (
                <Space>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setEditRow(record)}
                    disabled={!pid}
                  >
                    Sửa
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setDeleteTarget(record)}
                    disabled={!pid}
                  >
                    Xóa
                  </Button>
                </Space>
              )
            },
          },
        ]}
      />

      <CreateProductVariantDialog
        open={createOpen}
        defaultProductId={productId}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateProductVariantDialog
        open={!!editRow}
        productId={editProductId}
        variant={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa biến thể"
        description={
          deleteTarget ? (
            <>
              Xóa <strong>{deleteTarget.sku}</strong>?
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
