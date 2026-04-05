import { App as AntApp, ConfigProvider } from 'antd'
import { AppRoutes } from './routes'

function App() {
  return (
    <ConfigProvider>
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
