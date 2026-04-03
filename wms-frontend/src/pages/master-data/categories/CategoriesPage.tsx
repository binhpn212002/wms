import { Button, Input, Space, Table, Tag, Typography, message } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDeleteDialog } from '../../../components'
import { useDebouncedValue } from '../../../hooks'
import type { Category, CategoryTreeNode } from '../../../types'
import { categoriesService } from '../../../services'
import { CreateCategoryDialog } from './CreateCategoryDialog'
import { UpdateCategoryDialog } from './UpdateCategoryDialog'

const { Title } = Typography

function collectParentLabels(
  nodes: CategoryTreeNode[],
  acc: Record<string, string>,
) {
  for (const n of nodes) {
    acc[n.id] = `${n.code} — ${n.name}`
    if (n.children?.length) collectParentLabels(n.children, acc)
  }
}

export function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [parentLabels, setParentLabels] = useState<Record<string, string>>({})

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadParentLabels = useCallback(async () => {
    try {
      const tree = await categoriesService.tree()
      const acc: Record<string, string> = {}
      collectParentLabels(tree, acc)
      setParentLabels(acc)
    } catch {
      message.error('Không tải được nhãn danh mục cha')
    }
  }, [])

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await categoriesService.list({ page, limit, q: q || undefined })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách danh mục')
    } finally {
      setListLoading(false)
    }
  }, [page, limit, q])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    void loadParentLabels()
  }, [loadParentLabels])

  const refreshAfterMutation = useCallback(async () => {
    await Promise.all([loadList(), loadParentLabels()])
  }, [loadList, loadParentLabels])

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
      await categoriesService.remove(deleteTarget.id)
      message.success('Đã xóa danh mục')
      setDeleteTarget(null)
      await refreshAfterMutation()
    } catch {
      message.error('Không xóa được danh mục')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Danh mục
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
          Thêm danh mục
        </Button>
      </Space>

      <Table<Category>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 140 },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'Danh mục cha',
            dataIndex: 'parent_id',
            render: (id: string | null) =>
              id ? parentLabels[id] ?? id : '—',
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

      <CreateCategoryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void refreshAfterMutation()}
      />
      <UpdateCategoryDialog
        open={!!editRow}
        category={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void refreshAfterMutation()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa danh mục"
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
