import StoreButton from './StoreButton'
import PhoneMockup from './PhoneMockup'

export default function Hero({ iosStoreUrl, aosStoreUrl }) {
    return (
        <section id="top" className="lp-hero">
            <div className="lp-container lp-hero-inner">
                <div className="lp-hero-text">
                    <span className="lp-hero-eyebrow">
                        <span className="lp-hero-eyebrow-dot" aria-hidden="true" />
                        드라이브 메이트 매칭 · 모드
                    </span>
                    <h1 className="lp-hero-title">
                        함께 달리는<br />
                        <span className="lp-grad">드라이브 메이트</span>를<br />
                        가장 쉽게 만나는 방법
                    </h1>
                    <p className="lp-hero-sub">
                        차종·운전 스타일·관심 지역이 맞는 친구를 만나
                        새로운 코스로 함께 떠나보세요.
                    </p>
                    <div className="lp-hero-buttons">
                        <StoreButton platform="ios" url={iosStoreUrl} />
                        <StoreButton platform="android" url={aosStoreUrl} />
                    </div>
                    <p className="lp-hero-buttons-note">무료 · iOS · Android</p>
                </div>
                <div className="lp-hero-visual">
                    <PhoneMockup />
                </div>
            </div>
        </section>
    )
}
