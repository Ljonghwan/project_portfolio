import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import dayjs from 'dayjs';

import '@/assets/css/index.css';
import 'react-medium-image-zoom/dist/styles.css';
import 'dayjs/locale/ko';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.locale('ko');

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import App from '@/App.jsx';

/* 빌드시 주석해제 */
// console = {};
console.log = function(){};
console.warn = function(){};
console.error = function(){}; 

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
