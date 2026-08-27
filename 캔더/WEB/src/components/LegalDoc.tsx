"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- 스타일된 로고 링크는 네이티브 <a>.
   <Link> 의 <a> 에는 styled-jsx 스코프 해시가 안 붙어 .logo 스타일이 통째로 빠진다(front/CLAUDE.md). */

import { useEffect, useState } from "react";
import { Prism } from "@/components/Prism";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ApiError,
  getLegalDocument,
  type ApiLegalDocument,
  type LegalKind,
} from "@/lib/api";

// 'YYYY-MM-DD' → '2026년 8월 3일'. new Date() 로 파싱하면 UTC 로 읽혀 하루 밀리므로 문자열로 자른다.
const koDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
};

// 이용약관·개인정보처리방침 본문(카드#016 3-3). 관리자가 admin 에서 저장한 HTML 을 그대로 렌더한다.
export function LegalDoc({ kind, title }: { kind: LegalKind; title: string }) {
  const [doc, setDoc] = useState<ApiLegalDocument | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );

  useEffect(() => {
    let alive = true;
    getLegalDocument(kind)
      .then((d) => {
        if (!alive) return;
        setDoc(d);
        setPhase("ready");
      })
      .catch((e) => {
        if (!alive) return;
        // 미등록·빈 본문은 404 — 오류가 아니라 "아직 안 올린 상태"다.
        setPhase(e instanceof ApiError && e.status === 404 ? "empty" : "error");
      });
    return () => {
      alive = false;
    };
  }, [kind]);

  return (
    <div className="lgpage">
      <div className="topbar">
        <a className="logo" href="/">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </a>
      </div>

      <div className="body">
        <div className="doc">
          <h1>{title}</h1>
          {phase === "ready" && doc && (
            <>
              <p className="rev">개정일 {koDate(doc.revisedAt)}</p>
              {/* 🔒 정제(sanitizeRichHtml)는 **저장 시점의 서버가 유일 책임**이다.
                  여기서 다시 걸러내지 않으므로 서버 정제를 우회하는 경로를 만들지 말 것. */}
              <div
                className="rich"
                dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
              />
            </>
          )}
          {phase === "loading" && (
            <div className="state">
              <div className="spin" />
              <p>불러오는 중…</p>
            </div>
          )}
          {phase === "empty" && (
            <div className="state">
              <p>준비 중입니다. 곧 등록될 예정입니다.</p>
            </div>
          )}
          {phase === "error" && (
            <div className="state">
              <p>문서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
            </div>
          )}
        </div>
      </div>

      <SiteFooter maxWidth={860} />

      <style jsx>{`
        .lgpage {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg2);
          color: var(--ink);
        }
        .topbar {
          flex: 0 0 auto;
          height: 56px;
          background: #fff;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          padding: 0 24px;
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
        .logo:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 3px;
          border-radius: 6px;
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
        .body {
          flex: 1;
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
          padding: 34px 24px 56px;
        }
        .doc {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 40px 44px;
        }
        h1 {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .rev {
          color: var(--muted);
          font-size: 13px;
          margin: 8px 0 0;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--line);
        }
        .state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 60px 0;
          color: var(--muted);
          font-size: 14px;
        }
        .spin {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid var(--line);
          border-top-color: var(--blue);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .spin {
            animation-duration: 1.6s;
          }
        }
        /* 관리자 에디터(tiptap) 가 만드는 태그 집합 = 서버 허용 목록과 동일 범위 */
        .rich {
          font-size: 15px;
          line-height: 1.8;
          color: var(--ink2);
        }
        .rich :global(h1),
        .rich :global(h2),
        .rich :global(h3) {
          color: var(--ink);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 30px 0 10px;
        }
        .rich :global(h1) {
          font-size: 20px;
        }
        .rich :global(h2) {
          font-size: 17.5px;
        }
        .rich :global(h3) {
          font-size: 15.5px;
        }
        .rich :global(p) {
          margin: 0 0 14px;
        }
        .rich :global(ul),
        .rich :global(ol) {
          margin: 0 0 14px;
          padding-left: 22px;
        }
        .rich :global(li) {
          margin: 4px 0;
        }
        /* 관리자 에디터(tiptap)는 목록 항목의 내용을 <p> 로 감싼 HTML 을 저장한다(실측).
           그대로 두면 항목마다 문단 하단 여백 14px 이 들어가 목록이 벌어지므로 여기서 지운다.
           원고 등록본(<li><p>…</p></li>)과 관리자 저장본이 같은 간격으로 보이게 하는 규칙이다. */
        .rich :global(li) :global(p) {
          margin: 0;
        }
        .rich :global(a) {
          color: var(--blue-d);
          font-weight: 600;
        }
        .rich :global(blockquote) {
          margin: 0 0 14px;
          padding: 2px 0 2px 16px;
          border-left: 3px solid var(--line2);
          color: var(--muted);
        }
        .rich :global(hr) {
          border: none;
          border-top: 1px solid var(--line);
          margin: 26px 0;
        }
        .rich :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
        }
        .rich :global(pre) {
          background: var(--bg2);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 14px 16px;
          overflow-x: auto;
          font-size: 13px;
        }
        .rich :global(code) {
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .doc {
            padding: 28px 22px;
            border-radius: 14px;
          }
          h1 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
