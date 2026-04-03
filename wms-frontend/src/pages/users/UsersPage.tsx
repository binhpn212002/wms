import { Typography } from 'antd'

const { Title, Paragraph } = Typography

export function UsersPage() {
  return (
    <div>
      <Title level={3}>Người dùng</Title>
      <Paragraph>Quản lý user, gán vai trò (theo spec phân quyền).</Paragraph>
    </div>
  )
}
