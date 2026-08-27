"use client";

import { useEffect, useState } from "react";
import { ChatWorkspace, SessionScreen } from "@/components/ChatWorkspace";
import { ApiError, getResume, type SessionPayload } from "@/lib/api";

type Phase =
  | { k: "loading" }
  | { k: "error"; title: string; message: string }
  | { k: "ready"; data: SessionPayload };

// 재개 링크(/r/<resumeToken>) — 로그인 없이 GET /api/resume/:token 으로 동일 대화 복원.
// token 은 서버 컴포넌트(page.tsx)가 풀어 prop 으로 넘긴다.
export function ResumeClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>({ k: "loading" });

  useEffect(() => {
    let alive = true;
    getResume(token)
      .then((data) => alive && setPhase({ k: "ready", data }))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError) {
          if (e.status === 410)
            setPhase({ k: "error", title: "사용할 수 없는 링크", message: e.message });
          else if (e.status === 404)
            setPhase({
              k: "error",
              title: "이력을 찾을 수 없습니다",
              message: e.message,
            });
          else
            setPhase({
              k: "error",
              title: "문제가 발생했습니다",
              message: e.message,
            });
        } else {
          setPhase({
            k: "error",
            title: "문제가 발생했습니다",
            message: "잠시 후 다시 시도해주세요.",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  if (phase.k === "ready") return <ChatWorkspace initial={phase.data} />;

  return (
    <SessionScreen>
      {phase.k === "loading" ? (
        <div className="card">
          <div className="spin" />
          <h1>대화를 복원하는 중…</h1>
          <p className="sub">저장된 대화를 불러오고 있습니다.</p>
        </div>
      ) : (
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
