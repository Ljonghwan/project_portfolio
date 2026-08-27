"use client";

// F-A item1/item2: 가입 진입 = 회원유형(개인/기업) 선택 전용.
// - 이메일 가입(기본, provider 없음): 유형 선택 → 바로 /signup/{type}/email (SNS 4분기 방법화면 제거).
// - SNS 가입(?provider= 동반): 로그인 SNS 버튼 진입 → 유형 선택 → /signup/{type}/sns?provider=...(snsId/email/name 전달).
//   기업 SNS 경로(/signup/corp/sns)도 이 분기로 정상 진입.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SnsConsentCard } from "@/components/signup/SnsInfo";
import { useRedirectIfAuthed } from "@/lib/useRedirectIfAuthed";

function SignupChoiceContent() {
  useRedirectIfAuthed(); // msg-g3 LOW-2: 로그인 상태면 진입 차단
  const router = useRouter();
  const sp = useSearchParams();
  const provider = sp.get("provider"); // 있으면 SNS 가입 모드
  const isSns = !!provider;
  const [type, setType] = useState<"personal" | "corp" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function goNext() {
    if (!type) { setErr("회원 유형을 선택해 주세요."); return; }
    setErr(null);
    if (isSns) {
      // OAuth: snsId/email/name은 link 토큰(서버 검증값)에 담겨 있음 → link만 넘김.
      const params = new URLSearchParams({ provider: provider! });
      const link = sp.get("link");
      if (link) params.set("link", link);
      router.push(`/signup/${type}/sns?${params.toString()}`);
    } else {
      router.push(`/signup/${type}/email`);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h1 className="auth-title">회원 유형을<br />선택해 주세요.</h1>
        <p className="auth-sub">
          {isSns
            ? "SNS 계정으로 가입할 회원 유형을 선택해 주세요."
            : "치과 종사자를 위한 커뮤니티 덴탈인에 오신 것을 환영합니다."}
        </p>

        {/* 회원 유형 선택 */}
        <div className="type-grid" style={{ marginBottom: 22 }}>
          <button type="button" className={`type-card ${type === "personal" ? "on" : ""}`} onClick={() => { setType("personal"); setErr(null); }}>
            <div className="ic">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></svg>
            </div>
            <h3>개인 회원</h3>
            <p>취업하고 싶어요</p>
          </button>
          <button type="button" className={`type-card ${type === "corp" ? "on" : ""}`} onClick={() => { setType("corp"); setErr(null); }}>
            <div className="ic">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" /></svg>
            </div>
            <h3>기업 회원</h3>
            <p>병원을 운영하고 있어요</p>
          </button>
        </div>

        {/* {isSns && <SnsConsentCard />} */}

        {err && <div className="help" style={{ marginTop: 12 }}>{err}</div>}

        <button type="button" className="auth-cta" style={{ marginTop: isSns ? 18 : 0 }} onClick={goNext}>
          {isSns ? "다음" : "이메일로 회원 가입"}
        </button>

        <div className="signup-row" style={{ marginTop: 20, textAlign: "center" }}>
          이미 계정이 있으세요? <Link href="/login">로그인</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function SignupChoicePage() {
  return (
    <Suspense fallback={<div />}>
      <SignupChoiceContent />
    </Suspense>
  );
}
