import { Button, Input, Space, Table, Tag, Typography, message } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDeleteDialog } from '../../components'
import { useDebouncedValue } from '../../hooks'
import type { Product } from '../../types'
import { productsService } from '../../services'
import { CreateProductDialog } from './CreateProductDialog'
import { UpdateProductDialog } from './UpdateProductDialog'

const { Title } = Typography

export function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await productsService.list({
        page,
        limit,
        q: q || undefined,
      })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách sản phẩm')
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
      await productsService.remove(deleteTarget.id)
      message.success('Đã xóa sản phẩm')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được sản phẩm')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Sản phẩm
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
          Thêm sản phẩm
        </Button>
      </Space>

      <Table<Product>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 160 },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            render: (_, r) => `${r.category.code} — ${r.category.name}`,
          },
          {
            title: 'ĐVT',
            dataIndex: ['default_uom', 'code'],
            width: 120,
            render: (_, r) => r.default_uom.symbol ? `${r.default_uom.code} (${r.default_uom.symbol})` : r.default_uom.code,
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

      <CreateProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateProductDialog
        open={!!editRow}
        product={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa sản phẩm"
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
