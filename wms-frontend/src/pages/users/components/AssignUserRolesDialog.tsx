import { Form, Modal, Input, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '../../../types'
import { usersService } from '../../../services'

type FormValues = {
  roleIdsText: string
}

export type AssignUserRolesDialogProps = {
  open: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

function parseRoleIds(text: string): string[] {
  return text
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function AssignUserRolesDialog({
  open,
  user,
  onClose,
  onSuccess,
}: AssignUserRolesDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  const initialText = useMemo(
    () => (user?.roles?.length ? user.roles.join('\n') : ''),
    [user?.roles],
  )

  useEffect(() => {
    if (!open || !user) return
    form.setFieldsValue({ roleIdsText: initialText })
  }, [open, user, form, initialText])

  const handleOk = async () => {
    if (!user) return
    try {
      const values = await form.validateFields()
      const roleIds = parseRoleIds(values.roleIdsText || '')
      setSubmitting(true)
      await usersService.assignRoles(user.id, { roleIds })
      message.success('Đã cập nhật vai trò')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được vai trò')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={`Gán vai trò${user ? ` — ${user.username}` : ''}`}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="roleIdsText"
          label="Role IDs"
          extra="Nhập mỗi roleId một dòng (hoặc phân tách bằng dấu phẩy)."
        >
          <Input.TextArea rows={8} placeholder="roleId-1&#10;roleId-2" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

