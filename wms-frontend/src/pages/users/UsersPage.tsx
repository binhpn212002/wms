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
import { usersService } from '../../services'
import type { User } from '../../types'
import { AssignUserRolesDialog } from './components/AssignUserRolesDialog'
import { CreateUserDialog } from './components/CreateUserDialog'
import { UpdateUserDialog } from './components/UpdateUserDialog'

export function UsersPage() {
  const { Title } = Typography

  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [listLoading, setListLoading] = useState(false)
  const [qInput, setQInput] = useState('')
  const q = useDebouncedValue(qInput, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<User | null>(null)
  const [rolesRow, setRolesRow] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await usersService.list({ page, limit, q: q || undefined })
      setRows(res.data)
      setTotal(res.total)
    } catch {
      message.error('Không tải được danh sách người dùng')
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
      await usersService.remove(deleteTarget.id)
      message.success('Đã xóa người dùng')
      setDeleteTarget(null)
      await loadList()
    } catch {
      message.error('Không xóa được người dùng')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Người dùng
      </Title>

      <Space wrap style={{ marginBottom: 16 }} align="start">
        <Input.Search
          allowClear
          placeholder="Tìm theo username, phone…"
          style={{ width: 280 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Thêm người dùng
        </Button>
      </Space>

      <Table<User>
        rowKey="id"
        loading={listLoading}
        pagination={pagination}
        dataSource={rows}
        columns={[
          { title: 'Username', dataIndex: 'username', width: 180 },
          { title: 'SĐT', dataIndex: 'phone', width: 140 },
          { title: 'Họ tên', dataIndex: 'fullName', render: (v: string | null) => v ?? '—' },
          { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 120,
            render: (s: User['status']) =>
              s === 'active' ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>,
          },
          {
            title: 'Roles',
            dataIndex: 'roles',
            render: (roles: string[]) =>
              roles?.length ? (
                <Space wrap>
                  {roles.slice(0, 4).map((r) => (
                    <Tag key={r}>{r}</Tag>
                  ))}
                  {roles.length > 4 ? <Tag>+{roles.length - 4}</Tag> : null}
                </Space>
              ) : (
                '—'
              ),
          },
          {
            title: '',
            key: 'actions',
            width: 220,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" onClick={() => setEditRow(record)}>
                  Sửa
                </Button>
                <Button type="link" size="small" onClick={() => setRolesRow(record)}>
                  Vai trò
                </Button>
                <Button type="link" size="small" danger onClick={() => setDeleteTarget(record)}>
                  Xóa
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadList()}
      />
      <UpdateUserDialog
        open={!!editRow}
        user={editRow}
        onClose={() => setEditRow(null)}
        onSuccess={() => void loadList()}
      />
      <AssignUserRolesDialog
        open={!!rolesRow}
        user={rolesRow}
        onClose={() => setRolesRow(null)}
        onSuccess={() => void loadList()}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xóa người dùng"
        description={
          deleteTarget ? (
            <>
              Xóa <strong>{deleteTarget.username}</strong> ({deleteTarget.phone})?
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
