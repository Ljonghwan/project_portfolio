import { useEffect, useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'

export default function Header({ onDownloadClick }) {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header className={`lp-header${scrolled ? ' is-scrolled' : ''}`}>
            <div className="lp-container lp-header-inner">
                <a href="#top" className="lp-logo" aria-label="모두의 드라이브 홈">
                    <span className="lp-logo-text">모두의 드라이브</span>
                </a>
                <button type="button" className="lp-header-btn" onClick={onDownloadClick}>
                    앱 다운로드 <ArrowRightOutlined style={{ fontSize: 11 }} />
                </button>
            </div>
        </header>
    )
}
