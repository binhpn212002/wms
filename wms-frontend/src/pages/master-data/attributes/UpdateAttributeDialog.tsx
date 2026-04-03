import { Button, Form, Input, Modal, Space, Switch, message } from 'antd'
import { useEffect, useState } from 'react'
import type { Attribute } from '../../../types'
import { attributesService } from '../../../services'

type ValueRow = {
  id?: string
  code: string
  name: string
  active: boolean
}

type FormValues = {
  code: string
  name: string
  active: boolean
  values?: ValueRow[]
}

export type UpdateAttributeDialogProps = {
  open: boolean
  attribute: Attribute | null
  onClose: () => void
  onSuccess: () => void
}

const CODE_RULE = {
  pattern: /^[a-zA-Z0-9_-]+$/,
  message: 'Chỉ chữ, số, gạch dưới và gạch ngang',
}

export function UpdateAttributeDialog({
  open,
  attribute,
  onClose,
  onSuccess,
}: UpdateAttributeDialogProps) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !attribute) return
    form.setFieldsValue({
      code: attribute.code,
      name: attribute.name,
      active: attribute.active,
      values:
        attribute.values?.map((v) => ({
          id: v.id,
          code: v.code,
          name: v.name,
          active: v.active,
        })) ?? [],
    })
  }, [open, attribute, form])

  const handleOk = async () => {
    if (!attribute) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const rawRows = values.values ?? []
      const valuePayload = rawRows
        .map((r) => ({
          id: r.id?.trim() || undefined,
          code: (r.code ?? '').trim(),
          name: (r.name ?? '').trim(),
          active: r.active ?? true,
        }))
        .filter((r) => r.code !== '' || r.name !== '')

      for (const r of valuePayload) {
        if (!r.code || !r.name) {
          message.warning(
            'Mỗi giá trị phải có đủ mã và tên (hoặc xóa dòng trống)',
          )
          setSubmitting(false)
          return
        }
      }

      await attributesService.update(attribute.id, {
        code: values.code.trim(),
        name: values.name.trim(),
        active: values.active,
        values: valuePayload,
      })
      message.success('Đã cập nhật thuộc tính và giá trị')
      onSuccess()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('Không cập nhật được thuộc tính')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Sửa thuộc tính"
      open={open}
      onOk={() => void handleOk()}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="code"
          label="Mã"
          rules={[
            { required: true, message: 'Nhập mã' },
            { max: 64, message: 'Tối đa 64 ký tự' },
            CODE_RULE,
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[
            { required: true, message: 'Nhập tên' },
            { max: 255, message: 'Tối đa 255 ký tự' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="active" label="Đang hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Giá trị">
          <Form.List name="values">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Space
                    key={field.key}
                    align="start"
                    style={{ display: 'flex', marginBottom: 8, width: '100%' }}
                  >
                    <Form.Item name={[field.name, 'id']} hidden>
                      <Input type="hidden" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'code']}
                      rules={[
                        { max: 64, message: 'Tối đa 64 ký tự' },
                        {
                          validator: (_, value) => {
                            const v =
                              typeof value === 'string' ? value.trim() : ''
                            if (v === '') return Promise.resolve()
                            if (!/^[a-zA-Z0-9_-]+$/.test(v)) {
                              return Promise.reject(
                                new Error(CODE_RULE.message),
                              )
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder="Mã giá trị (VD: S)" autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'name']}
                      rules={[{ max: 255, message: 'Tối đa 255 ký tự' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder="Tên hiển thị" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'active']}
                      valuePropName="checked"
                      initialValue
                      style={{ marginBottom: 0 }}
                    >
                      <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(field.name)}>
                      Xóa
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ active: true })} block>
                  + Thêm giá trị
                </Button>
              </div>
            )}
          </Form.List>
        </Form.Item>
      </Form>
    </Modal>
  )
}
