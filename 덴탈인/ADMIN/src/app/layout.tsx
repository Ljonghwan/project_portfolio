import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdConfig from "@/components/AntdConfig";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: "덴탈인 관리자",
  description: "덴탈인 운영 관리자 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif' }}>
        <AntdRegistry>
          <AntdConfig>
            <ScrollToTop />
            {children}
          </AntdConfig>
        </AntdRegistry>
      </body>
    </html>
  );
}
