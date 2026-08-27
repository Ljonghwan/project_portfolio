"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import PhoneVerifyField from "@/components/PhoneVerifyField";
import PasswordInput from "@/components/PasswordInput";
import { api } from "@/lib/api";

const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSns, setIsSns] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function step1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !name || !phoneVerified) { setError("입력 정보와 휴대폰 인증을 확인해 주세요."); return; }
    const res = await api.post<{ canReset?: boolean; isSns?: boolean; snsProvider?: string; email?: string; resetToken?: string }>(
      "/api/auth/reset-password/request",
      { email, name, phone }
    );
    if (!res.success || !res.data) { setError(res.message || "입력 정보와 일치하는 계정이 없습니다."); return; }
    if (res.data.isSns) { setIsSns(res.data.snsProvider || "sns"); return; }
    setResetToken(res.data.resetToken || null);
    setStep(2);
  }

  async function step2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pwRegex.test(password)) { setError("비밀번호는 8자 이상 영문/숫자/특수문자 조합이어야 합니다."); return; }
    if (password !== password2) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (!resetToken) { setError("재설정 세션이 만료되었습니다. 처음부터 다시 시도해 주세요."); setStep(1); return; }
    const res = await api.post("/api/auth/reset-password/confirm", { resetToken, newPassword: password });
    if (!res.success) { setError(res.message || "비밀번호 변경에 실패했습니다."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h1 className="auth-title">비밀번호 재설정</h1>
        <p className="auth-sub">{step === 1 ? "본인 인증 후 비밀번호를 재설정해 주세요." : "새 비밀번호를 입력해 주세요."}</p>

        {isSns ? (
          <>
            <div style={{ marginTop: 20, padding: "18px 20px", border: "1px solid var(--brand-soft-2)", borderRadius: 12, background: "var(--brand-soft)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)", marginBottom: 8 }}>회원님은 {isSns} 계정으로 가입되어 있습니다.</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.65 }}>
                ※ SNS로 가입한 회원분들은 SNS 간편 로그인으로 로그인해주세요.
              </div>
            </div>
            <button type="button" className="auth-cta" onClick={() => router.push("/login")}>로그인으로 돌아가기</button>
          </>
        ) : step === 1 ? (
          <form onSubmit={step1Submit} noValidate>
            <div className="field">
              <label>아이디 (이메일)<span className="req">*</span></label>
              <div className="input-box"><input type="email" placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            <div className="field">
              <label>이름<span className="req">*</span></label>
              <div className="input-box"><input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} /></div>
            </div>
            <PhoneVerifyField phone={phone} onChangePhone={setPhone} verified={phoneVerified} onVerified={setPhoneVerified} />
            {error && <div className="help">{error}</div>}
            <button type="submit" className="auth-cta">확인</button>
          </form>
        ) : (
          <form onSubmit={step2Submit} noValidate>
            <div style={{ margin: "0 0 18px", padding: "18px 20px", background: "var(--bg)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginBottom: 4 }}>회원님의 아이디입니다.</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{email}</div>
            </div>
            <div className="field">
              <label>새 비밀번호<span className="req">*</span></label>
              <div className="input-box"><PasswordInput placeholder="8자리 이상 영문, 숫자, 특수문자 혼합" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="hint">영문 + 숫자 + 특수문자 조합 8자 이상</div>
            </div>
            <div className="field">
              <label>비밀번호 재입력<span className="req">*</span></label>
              <div className={`input-box ${password2 && password !== password2 ? "error" : ""}`}>
                <PasswordInput placeholder="비밀번호 재입력" value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </div>
              {password2 && password !== password2 && <div className="help">비밀번호가 일치하지 않습니다.</div>}
            </div>
            {error && <div className="help">{error}</div>}
            <button type="submit" className="auth-cta" disabled={done}>{done ? "변경 완료" : "완료"}</button>
            {done && (
              <div className="toast" style={{ marginTop: 18 }}>
                <span className="check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                </span>
                비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다.
              </div>
            )}
          </form>
        )}
      </div>
    </AuthShell>
  );
}
