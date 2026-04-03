import { Button, Input, Space, Table, Tag, Typography, message } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDeleteDialog } from '../../../components'
import { useDebouncedValue } from '../../../hooks'
import type { Attribute } from '../../../types'
import { attributesService } from '../../../services'
import { CreateAttributeDialog } from './CreateAttributeDialog'
import { UpdateAttributeDialog } from './UpdateAttributeDialog'

const { Title } = Typography

export function AttributesPage() {
  const [rows, setRows] = useState<Attribute[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Attribute | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await attributesService.list({
        page,
        limit,
        q: q || undefined,
        includeValues: true,
      })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách thuộc tính')
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
      await attributesService.remove(deleteTarget.id)
      message.success('Đã xóa thuộc tính')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error(
        'Không xóa được thuộc tính (có thể còn giá trị con hoặc đang được dùng)',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Thuộc tính
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
          Thêm thuộc tính
        </Button>
      </Space>

      <Table<Attribute>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Mã', dataIndex: 'code', width: 140 },
          { title: 'Tên', dataIndex: 'name' },
          {
            title: 'Giá trị',
            key: 'values',
            render: (_, record) => {
              const values = record.values ?? []
              if (values.length === 0) return '—'
              // show up to 6 tags to keep table compact
              const shown = values.slice(0, 6)
              const remain = values.length - shown.length
              return (
                <Space size={[4, 4]} wrap>
                  {shown.map((v) => (
                    <Tag key={v.id} style={{ marginInlineEnd: 0 }}>
                      {v.name}
                    </Tag>
                  ))}
                  {remain > 0 ? <Tag>+{remain}</Tag> : null}
                </Space>
              )
            },
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

      <CreateAttributeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateAttributeDialog
        open={!!editRow}
        attribute={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa thuộc tính"
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
