import Link from "next/link";
import HeaderSearch from "./HeaderSearch";
import HeaderMobileSearch from "./HeaderMobileSearch";
import HeaderUserActions from "./HeaderUserActions";
import HeaderGnb from "./HeaderGnb";

export default function SiteHeader() {
  return (
    <header className="site">
      <div className="wrap">
        <div className="head-row">
          <Link href="/" className="logo" aria-label="덴탈인 홈">
            <div className="mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3c-3 0-5 1.5-7 1.5C3 4.5 3 8 4 11c1 3 1 4 1.5 6S6.5 21 8 21s2-3 2.5-5 1-2.5 1.5-2.5 1 .5 1.5 2.5S15 21 16.5 21s2-2 2.5-4 .5-3 1.5-6 1-6.5-1-6.5C17.5 4.5 15 3 12 3z" />
              </svg>
            </div>
            <div className="name">
              덴<em>탈인</em>
            </div>
          </Link>

          <div className="head-right">
            <HeaderSearch variant="desktop" />

            {/* 모바일 순서(좌→우): [검색 돋보기][알림][프로필]. H4 햄버거 제거. */}
            <div className="head-actions">
              <HeaderMobileSearch />
              <HeaderUserActions />
            </div>
          </div>
        </div>

        <HeaderGnb />
      </div>
    </header>
  );
}
