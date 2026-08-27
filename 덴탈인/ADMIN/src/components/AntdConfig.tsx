"use client";

// A-1 E: antd 전역 한국어 locale + dayjs ko. ConfigProvider/AntApp을 client 경계로 묶어
// koKR(객체) import·dayjs.locale을 클라이언트에서 처리(RSC 직렬화 경계 회피).
import { App as AntApp, ConfigProvider } from "antd";
import koKR from "antd/locale/ko_KR";
import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

const FONT = '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif';

export default function AntdConfig({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: "#0FB5A6",
          borderRadius: 8,
          fontFamily: FONT,
        },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
