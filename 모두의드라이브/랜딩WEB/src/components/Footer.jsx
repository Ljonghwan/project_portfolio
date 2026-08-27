import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'

export default function Footer({ config, terms }) {
    return (
        <footer className="lp-footer">
            <div className="lp-container lp-footer-inner">
                <div className="lp-footer-top">
                    <div>
                        <div className="lp-footer-brand">
                            <img src={logo} alt="" className="lp-footer-logo" />
                            <span className="lp-footer-brand-name">모두의 드라이브</span>
                        </div>
                        <p className="lp-footer-tagline">
                            드라이브 메이트를 만나는 가장 쉬운 방법.
                        </p>
                    </div>
                    {terms.length > 0 && (
                        <nav className="lp-footer-links" aria-label="약관">
                            {terms.map((t) => (
                                <Link key={t.idx} to={`/terms/${t.idx}`} className="lp-footer-link">
                                    {t.title}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>
                {config && (
                    <div className="lp-footer-info">
                        {config.ceo && <div>대표: {config.ceo}</div>}
                        {config.businessNum && <div>사업자등록번호: {config.businessNum}</div>}
                        {config.tel && <div>고객센터: {config.tel}</div>}
                        {config.email && <div>이메일: {config.email}</div>}
                        {config.addr && <div>주소: {config.addr}</div>}
                    </div>
                )}
                <hr className="lp-footer-divider" />
                <div className="lp-footer-bottom">
                    <span className="lp-footer-copy">
                        © {new Date().getFullYear()} 모두의 드라이브. All rights reserved.
                    </span>
                </div>
            </div>
        </footer>
    )
}
