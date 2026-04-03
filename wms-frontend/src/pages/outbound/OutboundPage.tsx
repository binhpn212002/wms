import { Typography } from 'antd'

const { Title, Paragraph } = Typography

export function OutboundPage() {
  return (
    <div>
      <Title level={3}>Xuất kho</Title>
      <Paragraph>Phiếu xuất, trừ tồn.</Paragraph>
    </div>
  )
}
