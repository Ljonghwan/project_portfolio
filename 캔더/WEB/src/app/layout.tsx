import type { Metadata } from "next";
import localFont from "next/font/local";
import ErrorReporter from "@/components/ErrorReporter";
import StyledJsxRegistry from "./registry";
import "./globals.css";

// Pretendard는 Google Fonts에 없어 next/font/local로 self-host (외부 CDN 요청 제거 — Next.js 폰트 최적화 컨벤션 준수)
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

const SITE_NAME = "Candour";
const TITLE = "Candour · 당신의 이력서가 스스로 답합니다";
const DESCRIPTION =
  "지원자의 자료로만 답하는 채용 특화 AI. 사실만, 중립적으로 답하는 AI 대변인.";

export const metadata: Metadata = {
  // OG 이미지·og:url 을 **절대 URL** 로 만드는 기준. 상대경로로 나가면 카카오·슬랙이 미리보기를 못 읽는다.
  // ⚠️ 폴백은 `??` 가 아니라 `||` — Docker ARG 를 빠뜨리면 undefined 가 아니라 빈 문자열이 들어온다.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:1000"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    url: "/",
  },
  // 이미지는 app/opengraph-image.png(Next 파일 컨벤션)를 Next 가 자동으로 og:image 에 붙인다.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" className={pretendard.variable}>
      <body>
        {/* window 전역 오류(런타임·미처리 rejection)를 서버 원장으로 보낸다. 화면 출력 없음. */}
        <ErrorReporter />
        {/* styled-jsx 규칙을 초기 HTML 에 싣는다 — 없으면 배포 빌드에서 <style> 이 통째로 빠져
            JS 도착 전까지 스타일 없는 마크업이 보인다(카드#019 5, 개발서버 실측). */}
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
