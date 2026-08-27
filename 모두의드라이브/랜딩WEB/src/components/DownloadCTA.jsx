import StoreButton from './StoreButton'

export default function DownloadCTA({ iosStoreUrl, aosStoreUrl }) {
    return (
        <section className="lp-cta-wrap">
            <div className="lp-container">
                <div className="lp-cta">
                    <div className="lp-cta-inner">
                        <h2 className="lp-cta-title">
                            오늘 첫 번째 드라이브 메이트를<br />만나보세요
                        </h2>
                        <p className="lp-cta-sub">
                            지금 모드를 다운로드하고 무료로 시작하세요.
                        </p>
                        <div className="lp-cta-buttons">
                            <StoreButton platform="ios" url={iosStoreUrl} />
                            <StoreButton platform="android" url={aosStoreUrl} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
