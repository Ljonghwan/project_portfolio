import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdConfig from "@/components/AntdConfig";
import ErrorReporter from "@/components/ErrorReporter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Candour 관리자",
  description: "Candour 운영 관리자 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif' }}>
        {/* window 전역 오류(런타임·미처리 rejection)를 서버 원장으로 보낸다. 화면 출력 없음. */}
        <ErrorReporter />
        <AntdRegistry>
          <AntdConfig>{children}</AntdConfig>
        </AntdRegistry>
      </body>
    </html>
  );
}
