"use client";

// Sprint p2-6-fix1 — admin 코드(enum/라벨) 소비. front와 **동일한 서버 /api/codes**(정적 마스터, no-store).
// admin 페이지는 client이므로 모듈 캐시 + useCodes() hook으로 1회 로드 후 codeLabel/codeOptions 사용.
// 하드코딩 라벨맵 제거 → 서버 codes.ts 변경 시 admin도 새로고침 즉시 반영(캐시 없음).
import { useEffect, useState } from "react";

// 17300 배포 BUG-1 fix: 클라(브라우저)는 상대경로(/api/*) → Next rewrites→API. NEXT_PUBLIC_API_BASE_URL은 SSR 전용.
const BASE = (
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
    : ""
).replace(/\/$/, "");

type Code = { key: string; label: string };
let cache: Record<string, Code[]> | null = null;
let inflight: Promise<void> | null = null;

export async function loadCodes(): Promise<void> {
  if (cache) return;
  if (!inflight) {
    inflight = fetch(`${BASE}/api/codes`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        cache = j?.data && typeof j.data === "object" ? j.data : {};
      })
      .catch(() => {
        cache = {};
      });
  }
  await inflight;
}

// 도메인+키 → 라벨. 미로드/미존재 시 key 그대로(또는 "-").
export function codeLabel(domain: string, key: string | null | undefined): string {
  if (!key) return "-";
  const c = cache?.[domain]?.find((x) => x.key === key);
  return c?.label ?? String(key);
}

// antd Select용 옵션.
export function codeOptions(domain: string): { value: string; label: string }[] {
  return (cache?.[domain] ?? []).map((c) => ({ value: c.key, label: c.label }));
}

// 페이지 진입 시 1회 로드 + 로드 완료 시 리렌더(ready). 라벨 표시 컴포넌트에서 호출.
export function useCodes(): boolean {
  const [ready, setReady] = useState<boolean>(!!cache);
  useEffect(() => {
    let alive = true;
    void loadCodes().then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
