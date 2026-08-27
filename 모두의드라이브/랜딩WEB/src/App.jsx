import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Terms from '@/pages/Terms'
import AppLink from '@/pages/AppLink'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/terms/:idx" element={<Terms />} />
            <Route path="/link" element={<AppLink />} />
        </Routes>
    )
}
