import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import App from '@/App.jsx'
import '@/styles/landing.css'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ConfigProvider
            locale={koKR}
            theme={{
                token: {
                    colorPrimary: '#384FEE',
                    borderRadius: 8,
                    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
                },
            }}
        >
            <App />
        </ConfigProvider>
    </BrowserRouter>
)
