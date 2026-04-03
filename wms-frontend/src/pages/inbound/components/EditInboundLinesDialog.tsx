import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InboundDocument, InboundLineInput, Location, Product, Warehouse } from '../../../types'
import { inboundService, productsService, warehousesService } from '../../../services'
import { useDebouncedValue } from '../../../hooks'

type Row = InboundLineInput & { key: string }

export type EditInboundLinesDialogProps = {
  open: boolean
  inbound: InboundDocument | null
  onClose: () => void
  onSuccess: () => void
}

function normalizeLines(lines: unknown): InboundLineInput[] {
  if (!Array.isArray(lines)) return []
  return lines
    .map((l: any, idx: number) => ({
      lineNo: Number(l?.lineNo ?? idx + 1),
      variantId: String(l?.variantId ?? ''),
      quantity: String(l?.quantity ?? ''),
      unitPrice: l?.unitPrice == null ? null : String(l.unitPrice),
      locationId: String(l?.locationId ?? ''),
    }))
    .filter((l) => l.variantId && l.quantity)
}

function toRows(lines: InboundLineInput[]): Row[] {
  return lines
    .slice()
    .sort((a, b) => a.lineNo - b.lineNo)
    .map((l) => ({ ...l, key: `${l.lineNo}-${l.variantId}-${l.locationId}` }))
}

export function EditInboundLinesDialog({
  open,
  inbound,
  onClose,
  onSuccess,
}: EditInboundLinesDialogProps) {
  const { Text } = Typography
  const [submitting, setSubmitting] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailDoc, setDetailDoc] = useState<InboundDocument | null>(null)

  const [lines, setLines] = useState<InboundLineInput[]>([])

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [binOptions, setBinOptions] = useState<Location[]>([])
  const [binQInput, setBinQInput] = useState('')
  const binQ = useDebouncedValue(binQInput, 300)
  const [binsLoading, setBinsLoading] = useState(false)

  const [variantOptions, setVariantOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [variantQInput, setVariantQInput] = useState('')
  const variantQ = useDebouncedValue(variantQInput, 300)
  const [variantsLoading, setVariantsLoading] = useState(false)

  /** Danh sách API không kèm `lines`; phải gọi findOne để có dòng chứng từ. */
  useEffect(() => {
    if (!open) {
      setDetailDoc(null)
      setLines([])
      return
    }
    if (!inbound?.id) {
      setDetailDoc(null)
      setLines([])
      return
    }
    let cancelled = false
    setDetailLoading(true)
    void inboundService
      .findOne(inbound.id)
      .then((doc) => {
        if (cancelled) return
        setDetailDoc(doc)
        setLines(normalizeLines(doc.lines))
      })
      .catch(() => {
        if (cancelled) return
        message.error('Không tải được chi tiết phiếu nhập')
        setDetailDoc(null)
        setLines([])
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, inbound?.id])

  const doc = detailDoc ?? inbound

  const loadWarehouse = useCallback(async () => {
    if (!open || !doc?.warehouseId) return
    try {
      const w = await warehousesService.findOne(doc.warehouseId)
      setWarehouse(w)
    } catch {
      setWarehouse(null)
    }
  }, [open, doc])

  const loadBins = useCallback(async () => {
    if (!open || !doc?.warehouseId) return
    setBinsLoading(true)
    try {
      const res = await warehousesService.listLocations(doc.warehouseId, {
        view: 'flat',
        type: 'bin',
        q: binQ || undefined,
        page: 1,
        limit: 200,
      })
      if (res && typeof res === 'object' && 'view' in res && (res as any).view === 'tree') {
        setBinOptions([])
      } else {
        setBinOptions((res as any).data ?? [])
      }
    } catch {
      setBinOptions([])
    } finally {
      setBinsLoading(false)
    }
  }, [open, doc, binQ])

  const loadVariants = useCallback(async () => {
    setVariantsLoading(true)
    try {
      const res = await productsService.list({
        page: 1,
        limit: 20,
        q: variantQ || undefined,
        includeVariants: true,
      })
      const opts: { value: string; label: string }[] = []
      for (const p of res.data as Product[]) {
        for (const v of p.variants ?? []) {
          opts.push({ value: v.id, label: `${v.sku} (${p.code}) — ${p.name}` })
        }
      }
      setVariantOptions(opts)
    } catch {
      setVariantOptions([])
    } finally {
      setVariantsLoading(false)
    }
  }, [variantQ])

  useEffect(() => {
    if (!open || !doc?.warehouseId || detailLoading) return
    void loadWarehouse()
  }, [open, doc?.warehouseId, detailLoading, loadWarehouse])

  useEffect(() => {
    if (!open || !doc?.warehouseId || detailLoading) return
    void loadBins()
  }, [open, doc?.warehouseId, detailLoading, loadBins])

  useEffect(() => {
    if (!open) return
    void loadVariants()
  }, [open, loadVariants])

  useEffect(() => {
    if (!open) return
    void loadVariants()
  }, [variantQ, open, loadVariants])

  const rows = useMemo(() => toRows(lines), [lines])

  const addEmptyLine = () => {
    const nextNo = (lines.reduce((m, l) => Math.max(m, l.lineNo), 0) || 0) + 1
    setLines([
      ...lines,
      {
        lineNo: nextNo,
        variantId: '',
        quantity: '',
        unitPrice: null,
        locationId: '',
      },
    ])
  }

  const updateLine = (lineNo: number, patch: Partial<InboundLineInput>) => {
    setLines((prev) =>
      prev.map((l) => (l.lineNo === lineNo ? { ...l, ...patch } : l)),
    )
  }

  const removeLine = (lineNo: number) => {
    setLines((prev) => prev.filter((l) => l.lineNo !== lineNo))
  }

  const handleSave = async () => {
    if (!doc?.id) return
    const cleaned = lines
      .map((l) => ({
        ...l,
        variantId: l.variantId.trim(),
        quantity: l.quantity.trim(),
        locationId: l.locationId?.trim(),
        unitPrice: l.unitPrice == null ? null : String(l.unitPrice).trim() || null,
      }))
      .filter((l) => l.variantId && l.quantity)
      .map((l, idx) => ({ ...l, lineNo: idx + 1 }))

    for (const l of cleaned) {
      if (!l.locationId) {
        message.error('Thiếu ô (bin) cho một hoặc nhiều dòng')
        return
      }
      if (!l.quantity || Number.isNaN(Number(l.quantity)) || Number(l.quantity) <= 0) {
        message.error('Số lượng phải > 0')
        return
      }
    }

    setSubmitting(true)
    try {
      await inboundService.replaceLines(doc.id, { lines: cleaned })
      message.success('Đã lưu dòng phiếu nhập')
      onSuccess()
      onClose()
    } catch {
      message.error('Không lưu được dòng phiếu nhập')
    } finally {
      setSubmitting(false)
    }
  }

  const binSelectOptions = useMemo(
    () =>
      binOptions.map((l) => ({
        value: l.id,
        label: `${l.code}${l.name ? ` — ${l.name}` : ''}`,
      })),
    [binOptions],
  )

  return (
    <Modal
      title={`Dòng phiếu nhập${doc ? ` — ${doc.documentNo}` : ''}`}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{ disabled: detailLoading || !detailDoc }}
      destroyOnHidden
      width={1000}
    >
      <Spin spinning={detailLoading} tip="Đang tải chi tiết phiếu…">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div>
          <Text type="secondary">
            Kho: {warehouse ? `${warehouse.code} — ${warehouse.name}` : doc?.warehouseId}
          </Text>
        </div>
        <Space wrap>
          <Button onClick={addEmptyLine} disabled={detailLoading}>
            Thêm dòng
          </Button>
        </Space>

        <Table<Row>
          rowKey="key"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: '#', dataIndex: 'lineNo', width: 60 },
            {
              title: 'SKU',
              dataIndex: 'variantId',
              width: 320,
              render: (value: string, record) => (
                <Select
                  showSearch
                  value={value || undefined}
                  placeholder="Chọn SKU…"
                  options={variantOptions}
                  loading={variantsLoading}
                  filterOption={false}
                  onSearch={setVariantQInput}
                  onChange={(v) => updateLine(record.lineNo, { variantId: v })}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: 'Số lượng',
              dataIndex: 'quantity',
              width: 140,
              render: (value: string, record) => (
                <Input
                  value={value}
                  placeholder="0"
                  onChange={(e) => updateLine(record.lineNo, { quantity: e.target.value })}
                />
              ),
            },
            {
              title: 'Đơn giá',
              dataIndex: 'unitPrice',
              width: 140,
              render: (value: string | null, record) => (
                <Input
                  value={value ?? ''}
                  placeholder="(tùy chọn)"
                  onChange={(e) =>
                    updateLine(record.lineNo, { unitPrice: e.target.value || null })
                  }
                />
              ),
            },
            {
              title: 'Ô (bin)',
              dataIndex: 'locationId',
              width: 260,
              render: (value: string, record) => (
                <Select
                  showSearch
                  allowClear
                  value={value || undefined}
                  placeholder="Chọn ô…"
                  options={binSelectOptions}
                  loading={binsLoading}
                  filterOption={false}
                  onSearch={setBinQInput}
                  onChange={(v) => updateLine(record.lineNo, { locationId: v ?? '' })}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 100,
              render: (_, record) => (
                <Button type="link" danger onClick={() => removeLine(record.lineNo)}>
                  Xóa
                </Button>
              ),
            },
          ]}
        />
        </Space>
      </Spin>
    </Modal>
  )
}

