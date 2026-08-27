import badgeAppStore from '@/assets/badge-appstore.svg'
import badgeGooglePlay from '@/assets/badge-googleplay.png'

const SAFE_PREFIXES = ['https://apps.apple.com/', 'https://play.google.com/store/']

function isSafeStoreUrl(url) {
    return typeof url === 'string' && SAFE_PREFIXES.some((p) => url.startsWith(p))
}

export default function StoreButton({ platform, url }) {
    const isIos = platform === 'ios'
    const badge = isIos ? badgeAppStore : badgeGooglePlay
    const label = isIos ? 'App Store에서 다운로드' : 'Google Play에서 받기'
    const disabled = !isSafeStoreUrl(url)

    const handleClick = () => {
        if (!disabled) window.open(url, '_blank', 'noopener,noreferrer')
    }

    return (
        <button
            type="button"
            className={`lp-store-btn lp-store-btn-${platform}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={label}
        >
            <img src={badge} alt={label} className="lp-store-badge" />
        </button>
    )
}
