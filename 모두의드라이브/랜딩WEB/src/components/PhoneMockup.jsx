import appPreview from '@/assets/app-preview2.png'

export default function PhoneMockup() {
    return (
        <div className="lp-phone-wrap" aria-hidden="true">
            <div className="lp-phone">
                <div className="lp-phone-notch" />
                <div className="lp-phone-screen">
                    <img src={appPreview} alt="" className="lp-phone-image" />
                </div>
            </div>
            <div className="lp-float-card lp-float-card-1">
                <div className="lp-float-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                </div>
                <div className="lp-float-card-body">
                    <span className="lp-float-card-title">새로운 매칭</span>
                    <span className="lp-float-card-sub">근처 메이트 3명</span>
                </div>
            </div>
            <div className="lp-float-card lp-float-card-2">
                <div className="lp-float-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="m4 12 5 5 11-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="lp-float-card-body">
                    <span className="lp-float-card-title">매칭 성사</span>
                    <span className="lp-float-card-sub">함께 떠나는 길</span>
                </div>
            </div>
        </div>
    )
}
