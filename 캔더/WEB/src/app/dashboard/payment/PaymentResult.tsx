"use client";

import { Prism } from "@/components/Prism";

// 결제창 복귀 화면(성공 대기·실패)의 공용 표시부. 두 화면이 같은 레이아웃이라 스타일을 한 곳에 둔다.
// ⚠️ styled-jsx 는 클라이언트 컴포넌트에서만 동작한다 — 서버 컴포넌트인 각 page.tsx 는 이걸 렌더만 한다.
// 상단바를 다른 화면과 같은 모양으로 두는 건 취향이 아니라 신뢰 문제다 — 결제사에서 막 돌아온
// 사용자가 브랜드 없는 흰 화면을 보면 결제가 엉뚱한 곳으로 샌 것처럼 읽힌다.
export function PaymentResult({
  title,
  body,
  spinner,
  back,
}: {
  title: string;
  body: string;
  spinner?: boolean;
  back?: boolean;
}) {
  return (
    <main className="payscr">
      <div className="topbar">
        {/* 로고=홈. 네이티브 <a> — <Link> 의 <a> 에는 스코프 해시가 안 붙어 .logo 가 죽는다(front/CLAUDE.md). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="logo" href="/">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </a>
      </div>
      <div className="pay">
        {spinner && <div className="spin" />}
      <h1>{title}</h1>
      <p>{body}</p>
      {/* 네이티브 <a> — styled-jsx 스코프 해시가 <Link> 의 <a> 에는 안 붙어 스타일이 죽는다(front/CLAUDE.md).
          결제 복귀 화면이라 전체 새로고침이 오히려 맞다(잔액을 서버에서 다시 읽는다). */}
        {back && <a className="back" href="/dashboard?tab=wallet">크레딧 화면으로</a>}
      </div>
      <style jsx>{`
        .payscr {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg2);
          color: var(--ink);
        }
        .topbar {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          flex: 0 0 auto;
        }
        .logo {
          font-weight: 800;
          font-size: 17px;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .logo .mark {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: var(--ink);
          color: #fff;
          display: grid;
          place-items: center;
        }
        .logo .mark svg {
          width: 18px;
          height: 18px;
        }
        .logo:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 3px;
          border-radius: 6px;
        }
        .pay {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          text-align: center;
        }
        h1 {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 4px 0 0;
        }
        p {
          font-size: 14px;
          color: var(--muted);
          margin: 0;
          line-height: 1.6;
          max-width: 30rem;
        }
        .back {
          margin-top: 14px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
          text-decoration: none;
        }
        .back:hover {
          background: #f6f8fb;
        }
        .spin {
          width: 26px;
          height: 26px;
          border: 3px solid var(--line);
          border-top-color: var(--ink);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .spin {
            animation-duration: 2.4s;
          }
        }
      `}</style>
    </main>
  );
}
