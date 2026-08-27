const ICON = {
    match: (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="16" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.6" opacity="0.45" />
            <path d="M3 19c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M11 19c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
        </svg>
    ),
    map: (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24" fill="none">
            <path d="M9 4 4 5.6v14L9 18l6 1.6 5-1.6v-14L15 6 9 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 4v14M15 6v13.6" stroke="currentColor" strokeWidth="1.6" opacity="0.45" />
        </svg>
    ),
    shield: (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 4 6v6c0 4.6 3.3 8.4 8 9 4.7-.6 8-4.4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="m8.5 12 2.5 2.5L16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        </svg>
    ),
    gift: (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="8" width="17" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 12.5h17M12 8v12.5" stroke="currentColor" strokeWidth="1.6" opacity="0.45" />
            <path d="M12 8s-2-4-4.5-4S5 6 6 7c1 1 6 1 6 1Zm0 0s2-4 4.5-4S19 6 18 7c-1 1-6 1-6 1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
    ),
    chat: (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24" fill="none">
            <path d="M4 5.5h16v11H10l-5 4v-4H4v-11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 9.5h8M8 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        </svg>
    ),
    check: (
        <svg className="lp-feature-icon-svg" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 4 6v6c0 4.6 3.3 8.4 8 9 4.7-.6 8-4.4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" opacity="0.45" />
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10 12.2 11.4 13.6 14 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
}

const FEATURES = [
    { icon: ICON.match, title: '드라이브 메이트 매칭', desc: '지역, 차종, 운전 스타일이 맞는 친구를 빠르게 찾아드려요.' },
    { icon: ICON.map, title: '코스 후기 공유', desc: '다녀온 드라이브 코스를 사진·장소와 함께 공유하고, 새로운 길을 발견하세요.' },
    { icon: ICON.shield, title: '안전한 모임 환경', desc: '실명 인증과 매너 점수로 믿을 수 있는 만남을 보장합니다.' },
    { icon: ICON.gift, title: '제휴 매장 쿠폰', desc: '드라이브 코스 주변 카페·맛집에서 사용 가능한 혜택을 받아보세요.' },
    { icon: ICON.chat, title: '실시간 채팅', desc: '매칭된 친구와 약속 시간, 장소를 바로 조율할 수 있어요.' },
    { icon: ICON.check, title: '노쇼 방지 시스템', desc: '매너 점수와 페널티 정책으로 약속을 더 잘 지키는 커뮤니티를 만들어요.' },
]

export default function Features() {
    return (
        <section className="lp-section">
            <div className="lp-container">
                <header className="lp-section-header">
                    <span className="lp-section-eyebrow">Features</span>
                    <h2 className="lp-section-title">드라이브에 필요한 모든 것</h2>
                    <p className="lp-section-sub">
                        매칭부터 안전까지, 따로 찾을 필요 없이 한 곳에서 시작합니다.
                    </p>
                </header>
                <div className="lp-features-grid">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="lp-feature-card">
                            <div className="lp-feature-icon">{f.icon}</div>
                            <h3 className="lp-feature-title">{f.title}</h3>
                            <p className="lp-feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
