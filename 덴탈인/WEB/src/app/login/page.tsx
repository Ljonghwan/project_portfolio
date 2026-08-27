"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailErr(null);
    setPwErr(null);
    let invalid = false;
    if (!email.trim()) {
      setEmailErr("이메일을 입력해 주세요.");
      invalid = true;
    }
    if (!password) {
      setPwErr("비밀번호를 입력해 주세요.");
      invalid = true;
    }
    if (invalid) return;
    setLoading(true);
    const res = await api.post<{ accessToken: string; user: { id: number; userType: string } }>(
      "/api/auth/login",
      { email, password, remember }
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message || "아이디 또는 비밀번호가 일치하지 않습니다.");
      return;
    }
    setAccessToken(res.data.accessToken);
    // p2-2 작업3: 로그인 성공 즉시 authStore 동기화 → 헤더가 API 대기 없이 로그인 상태 반영.
    await useAuthStore.getState().syncFromServer();
    router.push("/mypage");
  }

  // SNS OAuth 실연동: 서버 인가 시작으로 리다이렉트(키 있으면 실 authorize, 로컬 mock도 동일 진입).
  //   콜백이 기존 User면 /sns/callback(로그인), 미가입이면 /signup?provider=&link=(가입 플로우)로 보냄.
  function snsClick(provider: "naver" | "google" | "kakao") {
    window.location.href = `/api/auth/${provider}/start`;
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h1 className="auth-title tight">로그인</h1>
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label>아이디 (이메일)</label>
            <div className={`input-box ${emailErr ? "error" : ""}`}>
              <input type="email" placeholder="이메일 입력" value={email} onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(null); }} autoComplete="email" />
              {email && (
                <div className="input-icons">
                  <button type="button" aria-label="입력 텍스트 삭제" onClick={() => setEmail("")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {emailErr && <div className="help">{emailErr}</div>}
          </div>

          <div className="field">
            <label>비밀번호</label>
            <div className={`input-box ${pwErr || error ? "error" : ""}`}>
              <input type={showPw ? "text" : "password"} placeholder="비밀번호" value={password} onChange={(e) => { setPassword(e.target.value); if (pwErr) setPwErr(null); }} autoComplete="current-password" />
              <div className="input-icons">
                <button type="button" aria-label="비밀번호 보이기/숨기기" onClick={() => setShowPw((v) => !v)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
            {pwErr && <div className="help">{pwErr}</div>}
            {!pwErr && error && <div className="help">{error}</div>}
          </div>

          <div className="row-inline">
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>로그인 상태 유지</span>
            </label>
          </div>

          <button type="submit" className="auth-cta" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>

          <div className="auth-links">
            <Link href="/find-id">아이디 찾기</Link>
            <span className="sep" />
            <Link href="/reset-password">비밀번호 재설정</Link>
          </div>

          <div className="divider">SNS 계정으로 로그인</div>

          <div className="sns-list">
            <button type="button" className="sns-btn kakao" onClick={() => snsClick("kakao")}>{/* OAuth */}
              <span className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C6.48 4 2 7.58 2 12c0 2.86 1.86 5.36 4.66 6.78l-1.18 4.32c-.1.36.3.66.62.46l5.18-3.42c.24.02.48.04.72.04 5.52 0 10-3.58 10-8S17.52 4 12 4z" /></svg>
              </span>
              카카오 로그인 · 회원가입
            </button>
            <button type="button" className="sns-btn naver" onClick={() => snsClick("naver")}>{/* OAuth */}
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z" /></svg>
              </span>
              네이버 로그인 · 회원가입
            </button>
            <button type="button" className="sns-btn google" onClick={() => snsClick("google")}>{/* OAuth */}
              <span className="ic">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              </span>
              구글 로그인 · 회원가입
            </button>
          </div>

          <div className="signup-row">
            계정이 없으세요?
            <Link href="/signup">회원가입</Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
