"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatWorkspace, SessionScreen } from "@/components/ChatWorkspace";
import { ApiError, createSession, type SessionPayload } from "@/lib/api";

type Phase =
  | { k: "loading" }
  | { k: "gate"; error?: string; submitting?: boolean }
  | { k: "error"; title: string; message: string }
  | { k: "ready"; data: SessionPayload };

// 서버 코드/상태로 화면 분기. COMPANY_REQUIRED→회사명 게이트, 410/404→상태 UI.
function errToPhase(e: unknown): Phase {
  if (e instanceof ApiError) {
    if (e.code === "COMPANY_REQUIRED") return { k: "gate" };
    if (e.status === 410)
      return { k: "error", title: "사용할 수 없는 링크", message: e.message };
    if (e.status === 404)
      return { k: "error", title: "존재하지 않는 링크", message: e.message };
    return { k: "error", title: "문제가 발생했습니다", message: e.message };
  }
  return {
    k: "error",
    title: "문제가 발생했습니다",
    message: "잠시 후 다시 시도해주세요.",
  };
}

// slug 는 서버 컴포넌트(page.tsx)가 풀어 prop 으로 넘긴다 — 그쪽이 generateMetadata 도 겸한다.
export function LinkSessionClient({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>({ k: "loading" });
  const [company, setCompany] = useState("");
  const gateInputRef = useRef<HTMLInputElement>(null);

  // 최초 진입: 회사명 없이 세션 시도 → COMPANY_REQUIRED 면 게이트로.
  useEffect(() => {
    let alive = true;
    createSession(slug)
      .then((data) => alive && setPhase({ k: "ready", data }))
      .catch((e) => alive && setPhase(errToPhase(e)));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (phase.k === "gate") gateInputRef.current?.focus();
  }, [phase.k]);

  const submitGate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = company.trim();
    if (!name) {
      setPhase({ k: "gate", error: "회사명을 입력해주세요." });
      return;
    }
    setPhase({ k: "gate", submitting: true });
    try {
      const data = await createSession(slug, name);
      setPhase({ k: "ready", data });
    } catch (err) {
      const p = errToPhase(err);
      // 게이트 재요청 오류는 게이트에 남겨 재입력 유도(만료/없음은 전체 상태 UI).
      setPhase(p.k === "gate" ? { k: "gate", error: "다시 시도해주세요." } : p);
    }
  };

  if (phase.k === "ready") return <ChatWorkspace initial={phase.data} />;

  return (
    <SessionScreen>
      {phase.k === "loading" && (
        <div className="card">
          <div className="spin" />
          <h1>대화를 불러오는 중…</h1>
          <p className="sub">지원자의 AI 대변인을 준비하고 있습니다.</p>
        </div>
      )}

      {phase.k === "gate" && (
        <div className="card">
          <div className="ic">
            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M6 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M18 21V9h1a1 1 0 0 1 1 1v11M9 8h1M9 12h1M11 8h0M11 12h0" />
            </svg>
          </div>
          <h1>회사명을 입력해주세요</h1>
          <p>맞춤 응대를 위해 소속 회사명을 남겨주세요.</p>
          <form onSubmit={submitGate}>
            <label htmlFor="co">회사명</label>
            <input
              id="co"
              ref={gateInputRef}
              className="field"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="소속 회사 이름"
              disabled={phase.submitting}
            />
            {phase.error && <div className="err">{phase.error}</div>}
            <button className="btn" type="submit" disabled={phase.submitting}>
              {phase.submitting ? "확인 중…" : "대화 시작하기"}
            </button>
          </form>
        </div>
      )}

      {phase.k === "error" && (
        <div className="card">
          <div className="ic warn">
            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <h1>{phase.title}</h1>
          <p>{phase.message}</p>
        </div>
      )}
    </SessionScreen>
  );
}
