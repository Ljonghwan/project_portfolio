// 공용 푸터 — 랜딩·로그인·대시보드 공통(카드#016 3-3. B안 + "랜딩도 공용으로 통일" 컨펌).
// HR 화면(/l/[slug]·/r/[token])에는 넣지 않는다 — 3분할 풀높이 레이아웃이 눌린다.
// 스타일은 인라인 <style jsx> — 외부 상수로 빼면 :global() 이 죽고, 한 컴포넌트에 외부상수 태그가
// 둘이 되면 두 번째가 미주입된다(front/CLAUDE.md).
import { Prism } from "@/components/Prism";

// 페이지마다 본문 컨테이너 폭이 달라(랜딩 1180 · 대시보드 920 · 로그인 전체폭) 푸터 좌우 경계를
// 그 페이지 콘텐츠에 맞춘다 — 안 맞추면 탭 이동처럼 경계가 튄다(카드#016 2와 같은 문제).
export function SiteFooter({ maxWidth = 1180 }: { maxWidth?: number | string }) {
  return (
    <footer className="sfoot">
      <div className="sfw" style={{ maxWidth }}>
        <div className="logo">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </div>
        <div className="right">
          <div className="links">
            {/* 네이티브 <a> — <Link> 의 <a> 에는 styled-jsx 스코프 해시가 안 붙어 스타일이 깨진다 */}
            <a href="/terms">이용약관</a>
            <a href="/privacy">개인정보처리방침</a>
          </div>
          {/* 전자상거래법상 사이버몰 초기화면 표시 의무(카드#027 B) — 상호·대표자·사업자등록번호·
              주소·연락처. 통신판매업 신고를 하지 않아 신고번호는 적지 않는다. */}
          <div className="biz">
            주식회사 밍글 · 대표 김대호 · 사업자등록번호 201-86-48538 ·
            전남광주통합특별시 북구 첨단과기로208번길 43-22 와이어스파크 B동
            905호 · info@minglecorp.co.kr
          </div>
          <div className="copy">
            © 2026 Candour · 솔직한 AI 대변인 · 정보의 정확성은 구직자 입력에
            따릅니다
          </div>
        </div>
      </div>

      <style jsx>{`
        .sfoot {
          flex: 0 0 auto; /* flex column 부모(로그인 .scr)에서 압축되지 않게 */
          background: #fff;
          border-top: 1px solid var(--line);
        }
        .sfw {
          margin: 0 auto;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .logo {
          font-weight: 800;
          font-size: 15px;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        /* Prism 은 width/height 18 을 속성으로 갖고 있다 — 배지를 26px 로 잡아 CSS 크기규칙 없이 맞춘다 */
        .logo .mark {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: var(--ink);
          color: #fff;
          display: grid;
          place-items: center;
        }
        .right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }
        .links {
          display: flex;
          gap: 14px;
        }
        .links a {
          color: var(--ink2);
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          transition: var(--t);
        }
        .links a:hover {
          color: var(--blue-d);
        }
        .links a:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 3px;
          border-radius: 4px;
        }
        /* 사업자 정보는 저작권 줄과 같은 타이포 토큰. 오른쪽 정렬(.right)에서 길게 흘러
           왼쪽 로고를 침범하지 않도록 폭만 제한하고 줄바꿈 시 오른쪽 정렬을 유지한다. */
        .biz,
        .copy {
          color: var(--muted);
          font-size: 12.5px;
        }
        .biz {
          max-width: 100%;
          text-align: right;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .sfw {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .right {
            align-items: flex-start;
          }
          .biz {
            text-align: left;
          }
        }
      `}</style>
    </footer>
  );
}
