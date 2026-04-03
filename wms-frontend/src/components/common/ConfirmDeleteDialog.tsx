import { Modal } from 'antd'
import type { ReactNode } from 'react'

export type ConfirmDeleteDialogProps = {
  open: boolean
  title?: string
  description?: ReactNode
  confirmLoading?: boolean
  okText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmDeleteDialog({
  open,
  title = 'Xác nhận xóa',
  description = 'Hành động này không thể hoàn tác.',
  confirmLoading,
  okText = 'Xóa',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger: true }}
      confirmLoading={confirmLoading}
      destroyOnHidden
    >
      {description}
    </Modal>
  )
}
