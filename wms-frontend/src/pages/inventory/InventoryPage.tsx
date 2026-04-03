import { Typography } from 'antd'

const { Title, Paragraph } = Typography

export function InventoryPage() {
  return (
    <div>
      <Title level={3}>Tồn kho</Title>
      <Paragraph>Tồn theo SP / kho / vị trí.</Paragraph>
    </div>
  )
}
