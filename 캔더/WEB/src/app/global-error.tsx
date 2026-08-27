"use client"; // 에러 경계는 반드시 클라이언트 컴포넌트

import { useEffect } from "react";
import localFont from "next/font/local";
import { IconInfo, IconReissue } from "@/components/icons";
import { reportClientError } from "@/components/ErrorReporter";
import "./globals.css";

// ⚠️ 루트 레이아웃이 대체되면 거기서 주입하던 `--font-pretendard` 도 함께 사라진다. 그러면
//    globals.css 의 `--sans: var(--font-pretendard), …` 선언이 통째로 무효가 돼(정의되지 않은 var 는
//    선언 전체를 무효화한다) 이 화면만 시스템 폰트로 렌더된다 — 실측 확인. 여기서 다시 주입한다.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

// 루트 레이아웃까지 죽는 렌더 크래시의 마지막 방어선(카드#010 C).
// ⚠️ global-error 는 활성화되는 순간 **루트 레이아웃을 대체**하므로 자체 <html>/<body> 와 전역 스타일을
//    직접 가져와야 한다(Next 16 규약 — node_modules/next/dist/docs/.../file-conventions/error.md).
//    metadata export 는 지원되지 않아 제목은 React 의 <title> 로 단다.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportClientError("CLIENT_RENDER", error.message, error.stack);
  }, [error]);

  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <title>화면을 불러오지 못했습니다 · Candour</title>
        <main className="errpage">
          <div className="card">
            <div className="mark">
              <IconInfo width={22} height={22} />
            </div>
            <h1>화면을 불러오지 못했습니다</h1>
            <p>
              일시적인 오류일 수 있습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>
            <div className="acts">
              <button type="button" className="primary" onClick={() => unstable_retry()}>
                <IconReissue width={16} height={16} />
                다시 시도
              </button>
              <a className="ghost" href="/">
                처음 화면으로
              </a>
            </div>
            {/* digest 는 서버 로그와 이 화면을 잇는 유일한 단서다 — 문의 시 그대로 읽어 전달할 수 있게 노출. */}
            {error.digest ? <span className="digest">오류 번호 {error.digest}</span> : null}
          </div>
        </main>
        <style jsx>{`
          .errpage {
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: var(--bg2);
            color: var(--ink);
          }
          .card {
            width: min(420px, 100%);
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 32px 28px;
            text-align: center;
            box-shadow: 0 12px 30px rgba(14, 21, 36, 0.06);
          }
          .mark {
            width: 46px;
            height: 46px;
            margin: 0 auto 16px;
            border-radius: 13px;
            background: var(--blue-t);
            color: var(--blue-d);
            display: grid;
            place-items: center;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          p {
            margin: 0 0 22px;
            font-size: 13.5px;
            line-height: 1.65;
            color: var(--muted);
          }
          .acts {
            display: flex;
            gap: 8px;
            justify-content: center;
          }
          .primary,
          .ghost {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border-radius: 11px;
            padding: 11px 18px;
            font-family: inherit;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            transition: var(--t);
          }
          .primary {
            background: var(--blue);
            color: #fff;
            border: none;
          }
          .primary:hover {
            background: var(--blue-d);
          }
          .ghost {
            background: #fff;
            color: var(--ink2);
            border: 1px solid var(--line2);
          }
          .ghost:hover {
            border-color: var(--blue);
            color: var(--blue-d);
          }
          .digest {
            display: block;
            margin-top: 18px;
            font-size: 11.5px;
            color: var(--muted);
          }
        `}</style>
      </body>
    </html>
  );
}
