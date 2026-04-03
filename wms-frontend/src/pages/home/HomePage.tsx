import { Typography } from 'antd'
import { config } from '../../config'

const { Title, Paragraph } = Typography

export function HomePage() {
  return (
    <div>
      <Title level={2}>{config.appName}</Title>
      <Paragraph>Trang chủ — thêm page mới trong <code>src/pages</code> và khai báo route trong <code>src/routes</code>.</Paragraph>
    </div>
  )
}
