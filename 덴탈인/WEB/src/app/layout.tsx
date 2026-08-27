import type { Metadata, Viewport } from "next";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import AppInit from "@/components/AppInit";
import CodesProvider from "@/components/CodesProvider";
import type { CodesBundle } from "@/stores/codeStore";

export const metadata: Metadata = {
  title: "덴탈인 — 치과 구인구직 + 익명 커뮤니티",
  description: "치과 종사자를 위한 구인구직 + 익명 병원후기/수다방/급구 커뮤니티",
};

// 버그1: 모바일 핀치/더블탭 줌 방지(확대·축소 잠금). PC는 viewport meta 영향 없음(데스크탑 줌 무관).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// p2-6-fix1: 코드(enum/라벨)를 SSR 단계에서 fetch → 첫 HTML에 주입(label-pop 0).
// no-store: 서버 codes.ts 라벨 변경 → 새로고침 즉시 반영(캐시 없음).
async function fetchCodes(): Promise<CodesBundle> {
  try {
    const res = await fetch(`${API_BASE}/api/codes`, { cache: "no-store" });
    if (!res.ok) return {};
    const json = (await res.json()) as { success: boolean; data: CodesBundle };
    return json?.data && typeof json.data === "object" ? json.data : {};
  } catch {
    return {}; // 서버 미응답 시에도 렌더는 통과(클라 AppInit이 재시도)
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const codes = await fetchCodes();
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* 전역 store 부트스트랩(region 1회 fetch + auth silent sync + codes 클라 fallback). */}
        <AppInit />
        <ScrollToTop />
        <CodesProvider initialCodes={codes}>{children}</CodesProvider>
      </body>
    </html>
  );
}
