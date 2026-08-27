import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <div className="wrap foot-row">
        <div>
          <div className="foot-logo">
            덴<span style={{ color: "var(--brand-ink)" }}>탈인</span>
          </div>
          <div className="foot-info" style={{ marginTop: 14 }}>
            덴탈인(주) | 대표이사 한경운 | 사업자등록번호 215-16-50592<br />
            서울특별시 송파구 오금로 551, 209동 201호 A-5 | 이메일 dentalin2026@gmail.com
            <div className="copy">© 2026 dentalin All Rights Reserved.</div>
          </div>
        </div>
        <div className="foot-links">
          <Link href="/terms?type=service">이용약관</Link>
          <Link href="/terms?type=privacy">개인정보처리방침</Link>
          {/* 피드백 F4: 고객센터 통합 진입점 */}
          <Link href="/support/notice">고객센터</Link>
        </div>
      </div>
    </footer>
  );
}
