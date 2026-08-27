"use client";

import { useEffect } from "react";

// 관리자 화면에서 터진 브라우저 오류를 서버 원장(error_logs)으로 보낸다. 화면 출력은 없다.
// admin 의 /api/* 는 next.config.js rewrites 로 프록시되므로 **항상 같은 오리진**이다(상대경로 호출).
// 🚫 폭주 방지 — 같은 message 는 이 페이지 로드에서 1회만, 총 5건까지. 무한 렌더 루프가 초당 수백 건을
//    쏘는 사고를 여기서 끊는다(서버의 IP당 1분 20건 제한은 2차 방어).
const sentMessages = new Set<string>();
let sentCount = 0;
const MAX_PER_LOAD = 5;

type ClientErrorCode = "CLIENT_RUNTIME" | "CLIENT_UNHANDLED_REJECTION" | "CLIENT_RENDER";

export function reportClientError(
  code: ClientErrorCode,
  message: string,
  stack?: string | null,
): void {
  if (typeof window === "undefined") return;
  const msg = (message || "").slice(0, 2000);
  if (!msg || sentMessages.has(msg) || sentCount >= MAX_PER_LOAD) return;
  sentMessages.add(msg);
  sentCount += 1;

  const payload = JSON.stringify({
    source: "client_admin",
    code,
    message: msg,
    stack: stack ? stack.slice(0, 8000) : undefined,
    url: window.location.href,
    occurredAt: new Date().toISOString(),
    client: {
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: "web",
    },
  });
  const url = "/api/client-errors";

  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
    credentials: "include",
  }).catch(() => {
    // 수집 실패는 사용자 동작에 영향을 주지 않는다 — 조용히 포기.
    // 여기서 다시 던지면 unhandledrejection 리스너가 잡아 자기 자신을 재귀 호출한다.
  });
}

export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      reportClientError(
        "CLIENT_RUNTIME",
        e.message,
        e.error instanceof Error ? e.error.stack : null,
      );
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: unknown = e.reason;
      reportClientError(
        "CLIENT_UNHANDLED_REJECTION",
        r instanceof Error ? r.message : String(r),
        r instanceof Error ? r.stack : null,
      );
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
