"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- 스타일된 로고 링크는 네이티브 <a>.
   <Link> 의 <a> 에는 styled-jsx 스코프 해시가 안 붙어 .logo 스타일이 통째로 빠진다(front/CLAUDE.md). */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginBackdrop } from "@/components/LoginBackdrop";
import { Prism } from "@/components/Prism";
import { GoogleMark, KakaoMark, NaverMark } from "@/components/icons";
import { ApiError, getMe, oauthAuthorizeUrl, socialLogin, type StubLoginMode } from "@/lib/api";

// 개발 스텁 UI 는 **로컬 dev 서버(npm run dev) + NEXT_PUBLIC_AUTH_DEV_STUB=true** 둘 다일 때만 노출한다.
// NODE_ENV 가드가 핵심 — next build 로 굽는 순간 false 로 치환돼 이 블록이 번들에서 통째로 사라진다.
// 그래서 **개발서버 배포에도 스텁 로그인은 나오지 않는다**(env 를 실수로 넣어도, .env.local 이 이미지에 딸려 들어가도).
// ⚠️ 로컬에서 켤 땐 서버 AUTH_DEV_STUB 과 **함께**. 하나만 켜면 버튼은 보이는데 501 이 난다.
const STUB_ENABLED =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_AUTH_DEV_STUB === "true";

// 개발 스텁 계정 선택(사이클9 — 다중 계정 전환 테스트). 전부 AUTH_DEV_STUB 게이팅(운영 501).
const MODES: { id: StubLoginMode; label: string; hint: string }[] = [
  { id: "demo", label: "데모 계정", hint: "데모 구직자(김지원) 계정으로 로그인합니다." },
  { id: "dev1", label: "테스트 1", hint: "고정 테스트 계정 1 — 재로그인해도 같은 계정입니다." },
  { id: "dev2", label: "테스트 2", hint: "고정 테스트 계정 2 — 재로그인해도 같은 계정입니다." },
  { id: "dev3", label: "테스트 3", hint: "고정 테스트 계정 3 — 재로그인해도 같은 계정입니다." },
  { id: "new", label: "새 계정 생성", hint: "매번 새 빈 계정을 만들어 로그인합니다(테스트용)." },
];

// 소셜 콜백이 실패·취소되면 서버가 /login?authError=… 로 되돌린다.
// 🔒 **허용 코드만** 문구로 매핑한다 — 쿼리 문자열을 그대로 렌더하면 임의 문구 주입이 된다.
// 서버 콜백은 어느 provider 였는지를 넘기지 않으므로 문구도 provider 중립으로 둔다.
const AUTH_ERRORS: Record<string, string> = {
  failed: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  cancelled: "로그인을 취소했습니다.",
};

// 재방문자에게 지난번 쓴 소셜을 알려주는 말풍선(카드#020 A-3).
// 실연동(카카오·네이버)은 서버 콜백으로 돌아와 클라이언트가 성공을 못 잡으므로 **클릭 시점**에 저장한다.
// ⚠️ localStorage 는 시크릿 모드·차단 설정에서 SecurityError 를 던진다 → 읽기·쓰기 모두 try/catch.
//    말풍선은 편의 기능이라 실패하면 조용히 없는 것처럼 동작해야 한다(로그인은 계속돼야 한다).
const LAST_PROVIDER_KEY = "candour:lastLoginProvider";
const rememberProvider = (provider: "kakao" | "naver" | "google") => {
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // 저장 불가 환경 — 다음 방문에 말풍선이 안 뜰 뿐이다.
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<StubLoginMode>("demo");
  // 어느 버튼을 눌렀는지까지 담는다 — boolean 이면 네이버를 눌러도 카카오 라벨까지 "이동 중…"이 된다.
  const [pending, setPending] = useState<"kakao" | "naver" | "google" | "stub" | null>(null);
  const busy = pending !== null;
  const [error, setError] = useState<string | null>(null);
  // 세션 확인이 끝나기 전에는 로그인 카드를 그리지 않는다 — 로그인 상태로 들어온 사용자에게
  // 카드가 한 번 번쩍이고 대시보드로 넘어가는 걸 막는다(카드#019 6).
  const [checking, setChecking] = useState(true);
  // 마지막으로 쓴 소셜(없으면 첫 방문). SSR 에는 없는 값이라 effect 에서만 읽는다.
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  // useSearchParams 대신 location 을 직접 읽는다 — 이 화면은 전부 클라이언트 렌더라
  // Suspense 경계를 새로 두지 않아도 된다.
  useEffect(() => {
    let alive = true;
    const code = new URLSearchParams(window.location.search).get("authError");
    // 마운트 1회 URL→문구 이동이라 연쇄 렌더가 1회뿐 — 규칙이 겨냥하는 비용이 없다.
    // useSearchParams 로 바꾸면 이 화면 전체를 Suspense 로 감싸야 해서 초기 HTML 에 로그인 카드가 안 실린다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code && AUTH_ERRORS[code]) setError(AUTH_ERRORS[code]);

    try {
      // 마운트 1회 localStorage→state. 렌더 중에 읽으면 서버 HTML(항상 null)과 어긋나 hydration 이 깨진다.
      // (try 안이라 set-state-in-effect 규칙이 잡지 않는다 — disable 주석은 불필요.)
      setLastProvider(localStorage.getItem(LAST_PROVIDER_KEY));
    } catch {
      // 접근 차단 환경 — 말풍선 없이 그대로 진행한다.
    }

    // 이미 로그인한 사용자가 랜딩 "무료 시작"으로 들어오면 대시보드로 보낸다(카드#019 6).
    // 🔒 401 은 "비로그인"이라는 **정상 응답**이다 — 오류 문구도, 오류 원장 기록도 하지 않는다.
    getMe()
      .then(() => router.replace("/dashboard"))
      .catch(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [router]);

  // 3사 모두 실연동 — 서버 authorize 로 브라우저를 통째로 보낸다(돌아올 땐 콜백이 세션 쿠키를 심어준다).
  const oauthLogin = (provider: "kakao" | "naver" | "google") => {
    if (busy) return;
    setPending(provider);
    rememberProvider(provider);
    window.location.href = oauthAuthorizeUrl(provider);
  };

  // 개발 스텁 — provider 는 kakao 로 고정(dev1~3 은 서버가 어차피 kakao 로 묶고, demo 는 시드 유저와 연결된다).
  const stubLogin = async () => {
    if (busy) return;
    setPending("stub");
    setError(null);
    try {
      await socialLogin("kakao", mode);
      rememberProvider("kakao");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "로그인에 실패했습니다.");
      setPending(null);
    }
  };

  return (
    <div className="scr">
      {/* 세션 확인 중에도 배경은 그려진다 — checking 분기 밖(.scr 직속)에 둘 것 */}
      <LoginBackdrop />
      <div className="topbar">
        {/* 로고=홈(카드#019 7). 네이티브 <a> — <Link> 의 <a> 에는 스코프 해시가 안 붙어 .logo 가 죽는다. */}
        <a className="logo" href="/">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </a>
      </div>

      <div className="body">
        {checking ? (
          <div className="spin" role="status" aria-label="로그인 상태를 확인하는 중" />
        ) : (
          <div className="card">
            <h1>구직자 로그인</h1>
            <p className="lead">
              소셜 계정으로 로그인하고 내 이력서 링크를 관리하세요.
            </p>

            <div className="socials">
              <button
                type="button"
                className="soc kakao"
                onClick={() => oauthLogin("kakao")}
                disabled={busy}
              >
                {/* 버튼 안 텍스트라 스크린리더가 "최근 로그인 카카오로 시작하기"로 함께 읽는다(aria 별도 불필요). */}
                {lastProvider === "kakao" && <span className="last">최근 로그인</span>}
                <KakaoMark />
                {pending === "kakao" ? "이동 중…" : "카카오로 시작하기"}
              </button>

              <button
                type="button"
                className="soc naver"
                onClick={() => oauthLogin("naver")}
                disabled={busy}
              >
                {lastProvider === "naver" && <span className="last">최근 로그인</span>}
                <NaverMark />
                {pending === "naver" ? "이동 중…" : "네이버로 시작하기"}
              </button>
              <button
                type="button"
                className="soc google"
                onClick={() => oauthLogin("google")}
                disabled={busy}
              >
                {lastProvider === "google" && <span className="last">최근 로그인</span>}
                <GoogleMark />
                {pending === "google" ? "이동 중…" : "구글로 시작하기"}
              </button>
            </div>

            {/* ⚠️ 이 문단을 변수·헬퍼로 빼면 styled-jsx 스코프 해시가 안 붙어 스타일이 통째로 죽는다(실측). 인라인 유지. */}
            <p className="terms">
              계정 생성 시 서비스 이용을 위한 필수 항목인{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                서비스 이용약관
              </a>
              과{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                개인정보 처리방침
              </a>
              에 동의합니다.
            </p>

            {error && <div className="err">{error}</div>}

            {STUB_ENABLED && (
              <div className="stub">
                <div className="rule">
                  <span>개발용 스텁 로그인</span>
                </div>
                <div className="seg" role="radiogroup" aria-label="스텁 로그인 계정 선택">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={mode === m.id}
                      className={mode === m.id ? "on" : ""}
                      onClick={() => setMode(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="seg-hint">{MODES.find((m) => m.id === mode)?.hint}</p>
                <button type="button" className="stubbtn" onClick={stubLogin} disabled={busy}>
                  선택한 계정으로 로그인
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .scr {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg2);
          color: var(--ink);
        }
        /* 배경 캔버스 위에 얹히므로 불투명 흰색 대신 글래스 — 상단바가 배경을 잘라내지 않는다.
           캔버스가 z-index:0 이라 상단바·본문은 position+z-index 로 그 위에 세운다. */
        .topbar {
          position: relative;
          z-index: 1;
          height: 56px;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          /* 24px — 푸터·대시보드 상단바와 같은 좌측 여백(로고 x 좌표 일치) */
          padding: 0 24px;
          flex: 0 0 auto;
        }
        .logo {
          font-weight: 800;
          font-size: 17px;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .logo .mark {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: var(--ink);
          color: #fff;
          display: grid;
          place-items: center;
        }
        .logo .mark :global(svg) {
          width: 18px;
          height: 18px;
        }
        .body {
          position: relative;
          z-index: 1;
          flex: 1;
          min-height: 0;
          display: grid;
          place-items: center;
          padding: 24px;
          /* 낮은 화면에서 카드가 잘리지 않게 세로 스크롤은 허용하되, 가로는 잘라낸다.
             overflow:auto 로 두면 이 요소가 **자체 가로 스크롤 컨테이너**가 돼
             html,body 의 overflow-x:clip 이 막지 못하는 좌우 스크롤이 생긴다(카드#020 A-2). */
          overflow-y: auto;
          overflow-x: clip;
        }
        /* 세션 확인 중 표시 — 대시보드 .spin 과 같은 규격 */
        .spin {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid var(--line);
          border-top-color: var(--blue);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .spin {
            animation-duration: 1.6s;
          }
          .last {
            animation: none;
          }
        }
        /* 배경 캔버스가 카드 뒤로 비치는 글래스 — 불투명 흰 카드는 배경을 사각으로 잘라낸다.
           blur 는 뒤가 비치되 본문 대비를 해치지 않는 선. saturate 로 비쳐드는 파랑을 살린다. */
        .card {
          /* 94vw 는 부모 padding(24px) 과 합쳐져 뷰포트를 넘긴다 → 100%(=패딩 제외 폭) */
          width: min(420px, 100%);
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(14, 21, 36, 0.08);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          padding: 34px 30px;
        }
        h1 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }
        .lead {
          font-size: 13.5px;
          color: var(--ink2);
          line-height: 1.6;
          /* 30px 고정 — 배지가 버튼 안으로 들어간 뒤로도 카드 높이(631px)를 그대로 두려고 유지한다. */
          margin: 0 0 30px;
          /* 좁은 화면에서 "관리하세/요"처럼 어절 중간이 끊기지 않게 */
          word-break: keep-all;
        }
        .socials {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .soc {
          position: relative; /* .last(최근 로그인) 배지의 기준 */
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 11px;
          padding: 13px;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: var(--t);
        }
        .soc:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .soc:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(14, 21, 36, 0.1);
        }
        .soc.kakao {
          background: #fee500;
          color: #191600;
        }
        .soc.naver {
          background: #03c75a;
          color: #fff;
        }
        .soc.google {
          background: #fff;
          color: #1f1f1f;
          border-color: var(--line2);
        }
        /* 최근 로그인 배지 — 버튼 안쪽 오른쪽 끝 고정(absolute 라 라벨 중앙정렬은 그대로).
           ⚠️ 버튼 위로 띄우지 말 것: 배지가 차지하는 세로 29.59px > .socials gap 10px 이라
           바로 윗버튼을 18.59px 덮는다(카드#037 실측). 첫 버튼일 때만 .lead 여백에 가려 안 보였을 뿐이다.
           absolute 라 버튼 라벨 중앙정렬은 그대로다. */
        .last {
          position: absolute;
          right: 12px;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: -0.01em;
          padding: 3px 8px;
          border-radius: 999px;
          background: var(--ink);
          color: #fff;
          animation: pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes pop {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        .terms {
          margin: 16px 0 0;
          font-size: 12px;
          line-height: 1.7;
          color: var(--muted);
          text-align: center;
          /* 한국어는 단어 중간에서 끊기면 읽기 흐름이 깨진다 */
          word-break: keep-all;
          /* 마지막 줄에 한 단어만 남는 것을 줄인다 */
          text-wrap: pretty;
        }
        .terms a {
          color: var(--ink2);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          /* 문서 이름은 통째로 한 줄에 — "개인정보 / 처리방침"으로 갈라지면 링크가 두 개처럼 읽힌다 */
          white-space: nowrap;
        }
        .terms a:hover {
          color: var(--blue-d);
        }
        .err {
          margin-top: 14px;
          color: var(--danger);
          font-size: 12.5px;
          font-weight: 600;
        }
        /* ── 개발용 스텁 블록(운영 빌드에선 통째로 없음) ── */
        .stub {
          margin-top: 22px;
          padding-top: 4px;
        }
        .rule {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
        }
        .rule::before,
        .rule::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--line);
        }
        .seg {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          background: var(--bg2);
          border: 1px solid var(--line);
          border-radius: 11px;
          padding: 4px;
        }
        .seg button {
          flex: 1 1 30%;
          white-space: nowrap;
          border: none;
          background: transparent;
          border-radius: 8px;
          padding: 9px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          transition: var(--t);
        }
        .seg button.on {
          background: #fff;
          color: var(--blue-d);
          box-shadow: 0 1px 4px rgba(14, 21, 36, 0.08);
        }
        .seg-hint {
          font-size: 12px;
          color: var(--muted);
          margin: 8px 2px 12px;
        }
        .stubbtn {
          width: 100%;
          border: 1px solid var(--line2);
          background: #fff;
          border-radius: 11px;
          padding: 12px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
          cursor: pointer;
          transition: var(--t);
        }
        .stubbtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .stubbtn:not(:disabled):hover {
          border-color: var(--blue);
          color: var(--blue-d);
        }
        .soc:focus-visible,
        .seg button:focus-visible,
        .stubbtn:focus-visible,
        .terms a:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 2px;
        }
        .logo:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 3px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
