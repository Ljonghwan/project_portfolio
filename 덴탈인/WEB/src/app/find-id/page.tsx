"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { api } from "@/lib/api";

export default function FindIdPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | { email: string; emailMasked: string; snsProvider: string | null }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setResult(null);
    if (!name.trim() || !/^01\d{8,9}$/.test(phone)) {
      setError("이름과 휴대폰번호를 정확히 입력해 주세요.");
      return;
    }
    const res = await api.post<{ email: string; emailMasked: string; snsProvider: string | null }>("/api/auth/find-id", { name, phone });
    if (!res.success || !res.data) {
      setError(res.message || "입력한 정보와 일치하는 아이디가 존재하지 않습니다.");
      return;
    }
    setResult(res.data);
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h1 className="auth-title">아이디 찾기</h1>
        <p className="auth-sub">이름과 휴대폰번호로 가입한 아이디를 찾을 수 있습니다.</p>

        {!result && (
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label>이름<span className="req">*</span></label>
              <div className={`input-box ${error ? "error" : ""}`}>
                <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>휴대폰번호<span className="req">*</span></label>
              <div className={`input-box ${error ? "error" : ""}`}>
                <input type="tel" inputMode="numeric" maxLength={11} placeholder="휴대폰번호 (- 없이 입력)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
              </div>
              {error && <div className="help">{error}</div>}
            </div>
            <button type="submit" className="auth-cta">확인</button>
          </form>
        )}

        {result && (
          <>
            <h2 className="auth-title" style={{ fontSize: 18, marginBottom: 6 }}>아이디 찾기 결과입니다.</h2>
            <div style={{ marginTop: 8, padding: 24, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}>회원님의 아이디</div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800 }}>{result.emailMasked}</div>
              {result.snsProvider && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--line)", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>
                  ※ SNS({result.snsProvider})로 가입한 회원분들은 SNS 간편 로그인으로 로그인해주세요.
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/login" className="auth-cta" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 0 }}>로그인 하러 가기</Link>
              <Link href="/reset-password" className="btn-line" style={{ height: 50, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>비밀번호 재설정</Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
