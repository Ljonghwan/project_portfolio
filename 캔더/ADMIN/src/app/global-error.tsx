"use client"; // 에러 경계는 반드시 클라이언트 컴포넌트

import { useEffect } from "react";
import { Button, ConfigProvider, Result } from "antd";
import koKR from "antd/locale/ko_KR";
import { reportClientError } from "@/components/ErrorReporter";

// 루트 레이아웃까지 죽는 렌더 크래시의 마지막 방어선(카드#010 C).
// ⚠️ global-error 는 활성화되면 **루트 레이아웃을 대체**하므로 자체 <html>/<body> 가 필요하고,
//    거기 있던 AntdConfig(ConfigProvider)·body 폰트도 함께 사라진다. 다시 주지 않으면 이 화면만
//    antd 기본 파랑(#1677ff)과 시스템 폰트로 렌더돼 브랜드가 어긋난다(실측 확인).
//    AntdRegistry(SSR 스타일)는 생략 — 오류 화면이라 런타임 주입으로 충분하고 의존을 하나 줄인다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError("CLIENT_RENDER", error.message, error.stack);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          background: "#f7f9fc",
          fontFamily:
            '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif',
        }}
      >
        <ConfigProvider
          locale={koKR}
          theme={{ token: { colorPrimary: "#2F6BFF" } }}
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              minHeight: "100vh",
            }}
          >
            <Result
              status="warning"
              title="화면을 불러오지 못했습니다"
              subTitle={
                <>
                  일시적인 오류일 수 있습니다.
                  <br />
                  잠시 후 다시 시도해주세요.
                  {/* digest 는 서버 로그와 이 화면을 잇는 유일한 단서 — 문의 시 그대로 읽어 전달할 수 있게. */}
                  {error.digest ? (
                    <>
                      <br />
                      <span style={{ fontSize: 12 }}>
                        오류 번호 {error.digest}
                      </span>
                    </>
                  ) : null}
                </>
              }
              extra={
                <Button type="primary" onClick={() => reset()}>
                  다시 시도
                </Button>
              }
            />
          </div>
        </ConfigProvider>
      </body>
    </html>
  );
}
