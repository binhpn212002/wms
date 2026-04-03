import { ConfigProvider } from 'antd'
import { AppRoutes } from './routes'

function App() {
  return (
    <ConfigProvider>
      <AppRoutes />
    </ConfigProvider>
  )
}

export default App
