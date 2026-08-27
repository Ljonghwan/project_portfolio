import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import StoreButton from '@/components/StoreButton'
import { fetchConfig } from '@/api/config'
import logo from '@/assets/logo.png'

// 앱 미설치 사용자가 딥링크(https://modudrive.co.kr/link?type=…)로 들어왔을 때 보는 화면.
// 진입 즉시 커스텀 스킴으로 보내면 미설치자에게 오류 팝업이 뜨므로 버튼 클릭 시에만 이동한다.
export default function AppLink() {
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        fetchConfig()
            .then((cfg) => mounted && setConfig(cfg || null))
            .finally(() => mounted && setLoading(false))
        return () => { mounted = false }
    }, [])

    const openApp = () => {
        window.location.href = `mode-drive://link${window.location.search}`
    }

    // 사용 기기의 스토어를 위에, PC는 둘 다 기본 순서로
    const platforms = /Android/.test(navigator.userAgent) ? ['android', 'ios'] : ['ios', 'android']
    const storeUrl = { ios: config?.iosStoreUrl, android: config?.aosStoreUrl }

    if (loading) {
        return (
            <div className="lp-loading">
                <Spin />
            </div>
        )
    }

    return (
        <div className="lp-applink">
            <div className="lp-applink-inner">
                {/* logo.png는 흰색 에셋이라 밝은 배경에서는 primary 배지 위에 얹는다 */}
                <div className="lp-applink-logo-badge">
                    <img src={logo} alt="모두의 드라이브" className="lp-applink-logo" />
                </div>
                <h1 className="lp-applink-title">모드 앱에서 열어보세요</h1>
                <p className="lp-applink-desc">
                    앱이 설치되어 있다면<br />바로 이어서 볼 수 있어요.
                </p>

                <button type="button" className="lp-applink-open-btn" onClick={openApp}>
                    앱으로 열기
                </button>

                <div className="lp-applink-stores">
                    <p className="lp-applink-store-note">앱이 없다면 먼저 설치해주세요.</p>
                    <div className="lp-applink-store-buttons">
                        {platforms.map((p) => (
                            <StoreButton key={p} platform={p} url={storeUrl[p]} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
