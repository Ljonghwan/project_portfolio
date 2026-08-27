const STEPS = [
    { num: 1, title: '회원가입', desc: '간편한 SNS 로그인으로 1분 안에 가입할 수 있어요.' },
    { num: 2, title: '프로필 작성', desc: '차종·운전 스타일·관심 지역을 등록하고 사진을 올려보세요.' },
    { num: 3, title: '드라이브 메이트 찾기', desc: '나와 잘 맞는 친구를 추천받고 마음에 들면 신청하세요.' },
    { num: 4, title: '함께 떠나기', desc: '매칭이 성사되면 채팅으로 약속을 정하고 함께 드라이브!' },
]

export default function HowItWorks() {
    return (
        <section className="lp-section lp-section-dark lp-howitworks">
            <div className="lp-container">
                <header className="lp-section-header">
                    <span className="lp-section-eyebrow">How it works</span>
                    <h2 className="lp-section-title">시작은 4단계로 충분합니다</h2>
                    <p className="lp-section-sub">
                        복잡한 가입 절차 없이, 오늘 바로 드라이브 메이트를 만나보세요.
                    </p>
                </header>
                <div className="lp-steps">
                    {STEPS.map((s) => (
                        <div key={s.num} className="lp-step">
                            <div className="lp-step-num">{s.num}</div>
                            <h3 className="lp-step-title">{s.title}</h3>
                            <p className="lp-step-desc">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
