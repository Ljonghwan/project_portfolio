"use client";

// SNS OAuth 개인 가입 5스텝 (signup-personal-sns.html 1:1).
// ①약관 → ②직종 → ③회원정보(link에서 가져온 항목 readonly, 없는 항목[이름] 입력, 휴대폰은 항상 입력+SMS 인증) →
// ④선택정보(스킵) → ⑤면허(스킵). 흐름(방법B): ③ 완료 시 signup/sns(계정, link 동봉)→토큰 → ④⑤ PATCH /me/extra.
// snsId/email은 link 토큰(서버 검증값)에서만 신뢰 — 클라 전송 안 함.
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import TermsAgree, { TERMS_INIT, type TermsState, termsAllRequired } from "@/components/TermsAgree";
import PhoneVerifyField from "@/components/PhoneVerifyField";
import JobTypePicker, { type JobType } from "@/components/JobTypePicker";
import { SnsInfoCard } from "@/components/signup/SnsInfo";
import SignupOptionalFields, { type OptionalPayload } from "@/components/signup/SignupOptionalFields";
import SignupLicenseFields, { type LicensePayload } from "@/components/signup/SignupLicenseFields";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useRedirectIfAuthed } from "@/lib/useRedirectIfAuthed";
import { decodeSnsLink, type SnsProvider } from "@/lib/snsLink";

const TOTAL = 5;

function PersonalSnsSignupContent() {
  useRedirectIfAuthed(); // msg-g3 LOW-2
  const router = useRouter();
  const sp = useSearchParams();
  const link = sp.get("link");
  const info = decodeSnsLink(link);
  const provider: SnsProvider = info?.provider || ((sp.get("provider") as SnsProvider) || "naver");
  const presetEmail = info?.email || "";
  const hasName = !!info?.name; // 가져온 이름 있으면 readonly, 없으면 입력
  const presetPhone = info?.phone || ""; // prefill만 — 인증은 항상 SMS로

  const [step, setStep] = useState(1);
  const [terms, setTerms] = useState<TermsState>(TERMS_INIT);
  const [jobType, setJobType] = useState<JobType | "">("");
  const [name, setName] = useState(info?.name || "");
  const [phone, setPhone] = useState(presetPhone);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // link 토큰이 없거나 만료(디코드 실패)면 가입 불가 → 로그인으로.
  useEffect(() => {
    if (!info) router.replace("/login?sns_error=expired");
  }, [info, router]);

  function next1() {
    if (!termsAllRequired(terms)) { setSubmitErr("필수 약관에 모두 동의해 주세요."); return; }
    setSubmitErr(null); setStep(2);
  }
  function next2() {
    if (!jobType) { setSubmitErr("직종을 선택해 주세요."); return; }
    setSubmitErr(null); setStep(3);
  }

  async function submitAccount() {
    setSubmitErr(null);
    if (!name.trim()) { setSubmitErr("이름을 입력해 주세요."); return; }
    if (!phoneVerified) { setSubmitErr("휴대폰 인증을 완료해 주세요."); return; }
    setLoading(true);
    // snsId/email은 link 토큰(서버 검증)에서만. 클라는 link + 입력값(name/phone)만 전송.
    const res = await api.post<{ accessToken: string }>("/api/auth/signup/sns", {
      provider, link, name, phone, userType: "personal", jobType, ...terms,
    });
    setLoading(false);
    if (!res.success || !res.data) { setSubmitErr(res.message || "가입에 실패했습니다."); return; }
    setAccessToken(res.data.accessToken);
    await useAuthStore.getState().syncFromServer();
    setStep(4);
  }

  async function saveOptional(payload: OptionalPayload) {
    setLoading(true);
    const res = await api.patch("/api/users/me/extra", payload, true);
    setLoading(false);
    if (!res.success) { setSubmitErr(res.message || "저장에 실패했습니다."); return; }
    setStep(5);
  }
  async function saveLicense(payload: LicensePayload) {
    setLoading(true);
    const res = await api.patch("/api/users/me/extra", payload, true);
    setLoading(false);
    if (!res.success) { setSubmitErr(res.message || "저장에 실패했습니다."); return; }
    finish();
  }
  function finish() { router.push("/mypage?welcome=1"); }

  const STEP_TITLE = ["약관 동의", "직종 선택", "회원정보"];
  const STEP_SUB = ["서비스 이용을 위해 약관에 동의해 주세요.", "구직자 회원의 직종을 선택해 주세요.", ""];

  return (
    <AuthShell>
      <div className="auth-card">
        <div className="signup-stepbar">
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className={`signup-step ${step >= i + 1 ? "on" : ""}`} />
          ))}
        </div>

        {step <= 3 && (
          <>
            <h1 className="auth-title" style={{ textAlign: "left" }}>{STEP_TITLE[step - 1]}</h1>
            {STEP_SUB[step - 1] && <p className="auth-sub" style={{ textAlign: "left" }}>{STEP_SUB[step - 1]}</p>}
          </>
        )}

        {step === 1 && (
          <>
            <TermsAgree value={terms} onChange={setTerms} />
            {submitErr && <div className="help" style={{ marginTop: 12 }}>{submitErr}</div>}
            <button type="button" className="auth-cta" onClick={next1}>다음</button>
          </>
        )}

        {step === 2 && (
          <>
            <JobTypePicker value={jobType} onChange={(v) => { setJobType(v); setSubmitErr(null); }} />
            {submitErr && <div className="help" style={{ marginTop: 12 }}>{submitErr}</div>}
            <div className="btn-row">
              <button type="button" className="auth-cta" style={{ background: "var(--surface)", color: "var(--ink-2)", border: "1.5px solid var(--line)", flex: 1 }} onClick={() => setStep(1)}>이전</button>
              <button type="button" className="auth-cta" style={{ flex: 2 }} onClick={next2}>다음</button>
            </div>
          </>
        )}

        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); submitAccount(); }} noValidate>
            <SnsInfoCard provider={provider} />
            <div className="field">
              <label>이메일</label>
              <div className="input-box"><input type="email" value={presetEmail} readOnly /></div>
            </div>
            <div className="field">
              <label>이름{!hasName && <span className="req">*</span>}</label>
              <div className="input-box"><input type="text" placeholder="이름 입력" value={name} onChange={(e) => setName(e.target.value)} readOnly={hasName} /></div>
              {!hasName && <div className="hint">2~8자 한글 또는 영어</div>}
            </div>
            {/* 휴대폰은 가져온 값과 무관하게 항상 입력 + SMS 인증(알리고). 가져온 번호는 prefill. */}
            <PhoneVerifyField phone={phone} onChangePhone={setPhone} verified={phoneVerified} onVerified={setPhoneVerified} />
            {submitErr && <div className="help">{submitErr}</div>}
            <div className="btn-row">
              <button type="button" className="auth-cta" style={{ background: "var(--surface)", color: "var(--ink-2)", border: "1.5px solid var(--line)", flex: 1 }} onClick={() => setStep(2)}>이전</button>
              <button type="submit" className="auth-cta" style={{ flex: 2 }} disabled={loading}>{loading ? "가입 중..." : "다음"}</button>
            </div>
          </form>
        )}

        {step === 4 && <SignupOptionalFields onSubmit={saveOptional} onSkip={() => setStep(5)} submitting={loading} />}
        {step === 5 && <SignupLicenseFields onSubmit={saveLicense} submitting={loading} />}
      </div>
    </AuthShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <PersonalSnsSignupContent />
    </Suspense>
  );
}
