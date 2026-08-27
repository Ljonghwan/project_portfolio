import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'animate.css';

dayjs.locale('ko');
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import App from '@/App.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#6c00fe',
          borderRadius: 6,
          fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </BrowserRouter>
)
