import { PropsWithChildren, useEffect } from 'react'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    // 登录在首次 API 请求时按需完成，避免阻塞首屏。
  }, [])

  return children
}

export default App
