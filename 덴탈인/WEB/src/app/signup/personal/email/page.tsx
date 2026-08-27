"use client";

// msg-g3 단위2: 개인 이메일 회원가입 5스텝 재구현 (signup-personal-email.html 1:1).
// ①약관(TermsAgree 3종) → ②직종(JobTypePicker 6칩) → ③회원정보(이메일중복확인/비번×2/이름/휴대폰인증) →
// ④선택정보(SignupOptionalFields, 스킵) → ⑤면허(SignupLicenseFields, 스킵).
// 흐름(방법B): ③ 완료 시 가입 API 호출 → accessToken 발급(로그인) → ④⑤는 PATCH /me/extra + /api/upload.
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import TermsAgree, { TERMS_INIT, type TermsState, termsAllRequired } from "@/components/TermsAgree";
import PhoneVerifyField from "@/components/PhoneVerifyField";
import PasswordInput from "@/components/PasswordInput";
import JobTypePicker, { type JobType } from "@/components/JobTypePicker";
import SignupOptionalFields, { type OptionalPayload } from "@/components/signup/SignupOptionalFields";
import SignupLicenseFields, { type LicensePayload } from "@/components/signup/SignupLicenseFields";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useRedirectIfAuthed } from "@/lib/useRedirectIfAuthed";

const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const TOTAL = 5;
const STEP_TITLE = ["약관 동의", "직종 선택", "회원정보 입력", "선택 정보를 입력해 주세요.", "면허 정보를 입력해 주세요. (선택)"];
const STEP_SUB = ["서비스 이용을 위해 약관에 동의해 주세요.", "구직자 회원의 직종을 선택해 주세요.", "가입 정보를 입력해 주세요.", "", ""];

export default function PersonalEmailSignupPage() {
  useRedirectIfAuthed(); // msg-g3 LOW-2: 진입 시 로그인 상태면 차단(가입 중 전환은 무시)
  const router = useRouter();
  const [step, setStep] = useState(1); // 1..5
  const [terms, setTerms] = useState<TermsState>(TERMS_INIT);
  const [jobType, setJobType] = useState<JobType | "">("");

  const [email, setEmail] = useState("");
  const [emailChecked, setEmailChecked] = useState<null | boolean>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkEmail() {
    setEmailMsg(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailChecked(false); setEmailMsg("이메일 형식이 올바르지 않습니다."); return;
    }
    const res = await api.get<{ available: boolean }>(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
    if (res.success && res.data?.available) { setEmailChecked(true); setEmailMsg("사용 가능한 이메일입니다."); }
    else if (res.success && res.data) { setEmailChecked(false); setEmailMsg("이미 사용 중인 이메일입니다."); }
    else { setEmailChecked(false); setEmailMsg(res.message || "이메일 확인에 실패했습니다."); }
  }

  function next1() {
    if (!termsAllRequired(terms)) { setSubmitErr("필수 약관에 모두 동의해 주세요."); return; }
    setSubmitErr(null); setStep(2);
  }
  function next2() {
    if (!jobType) { setSubmitErr("직종을 선택해 주세요."); return; }
    setSubmitErr(null); setStep(3);
  }

  // ③ 회원정보 완료 → 가입 API(계정 생성) → 토큰 → ④로 이동
  async function submitAccount() {
    setSubmitErr(null);
    if (emailChecked !== true) { setSubmitErr("이메일 중복확인을 해주세요."); return; }
    if (!pwRegex.test(password)) { setSubmitErr("비밀번호는 8자 이상 영문/숫자/특수문자 조합이어야 합니다."); return; }
    if (password !== password2) { setSubmitErr("비밀번호가 일치하지 않습니다."); return; }
    if (!name.trim()) { setSubmitErr("이름을 입력해 주세요."); return; }
    if (!phoneVerified) { setSubmitErr("휴대폰 인증을 완료해 주세요."); return; }
    if (!jobType) { setSubmitErr("직종을 선택해 주세요."); return; }
    setLoading(true);
    const res = await api.post<{ accessToken: string }>("/api/auth/signup/personal/email", {
      email, password, name, phone, jobType, ...terms,
    });
    setLoading(false);
    if (!res.success || !res.data) { setSubmitErr(res.message || "가입에 실패했습니다."); return; }
    setAccessToken(res.data.accessToken);
    await useAuthStore.getState().syncFromServer();
    setStep(4); // 가입 완료(로그인 상태) → 선택정보
  }

  // ④ 선택정보 저장
  async function saveOptional(payload: OptionalPayload) {
    setLoading(true);
    const res = await api.patch("/api/users/me/extra", payload, true);
    setLoading(false);
    if (!res.success) { setSubmitErr(res.message || "저장에 실패했습니다."); return; }
    setStep(5);
  }
  // ⑤ 면허 저장 → 완료
  async function saveLicense(payload: LicensePayload) {
    setLoading(true);
    const res = await api.patch("/api/users/me/extra", payload, true);
    setLoading(false);
    if (!res.success) { setSubmitErr(res.message || "저장에 실패했습니다."); return; }
    finish();
  }
  function finish() { router.push("/mypage?welcome=1"); }

  return (
    <AuthShell>
      <div className="auth-card">
        {/* ①B 막대 진행바 (5스텝 가변) */}
        <div className="signup-stepbar">
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className={`signup-step ${step >= i + 1 ? "on" : ""}`} />
          ))}
        </div>

        {/* 선택정보/면허 스텝은 컴포넌트가 자체 헤더(opt-head) 렌더 — 그 외 스텝만 제목 표시 */}
        {step <= 3 && (
          <>
            <h1 className="auth-title" style={{ textAlign: "left" }}>{STEP_TITLE[step - 1]}</h1>
            <p className="auth-sub" style={{ textAlign: "left" }}>{STEP_SUB[step - 1]}</p>
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
            <div className="field">
              <label>아이디 (이메일)<span className="req">*</span></label>
              <div className="row-with-btn">
                <div className="input-box">
                  <input type="email" placeholder="이메일 입력" value={email} onChange={(e) => { setEmail(e.target.value); setEmailChecked(null); setEmailMsg(null); }} autoComplete="email" />
                </div>
                <button type="button" className="verify-btn" onClick={checkEmail}>중복확인</button>
              </div>
              {emailMsg && (emailChecked ? <div className="ok-msg">{emailMsg}</div> : <div className="help">{emailMsg}</div>)}
            </div>

            <div className="field">
              <label>비밀번호<span className="req">*</span></label>
              <div className="input-box">
                <PasswordInput placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="hint">8자리 이상 영문, 숫자, 특수문자 혼합</div>
            </div>

            <div className="field">
              <label>비밀번호 확인<span className="req">*</span></label>
              <div className={`input-box ${password2 && password !== password2 ? "error" : ""}`}>
                <PasswordInput placeholder="비밀번호 재입력" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
              </div>
              {password2 && password !== password2 && <div className="help">비밀번호가 일치하지 않습니다.</div>}
            </div>

            <div className="field">
              <label>이름<span className="req">*</span></label>
              <div className="input-box">
                <input type="text" placeholder="이름 입력" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="hint">2~8자 한글 또는 영어</div>
            </div>

            <PhoneVerifyField phone={phone} onChangePhone={setPhone} verified={phoneVerified} onVerified={setPhoneVerified} />

            {submitErr && <div className="help">{submitErr}</div>}
            <div className="btn-row">
              <button type="button" className="auth-cta" style={{ background: "var(--surface)", color: "var(--ink-2)", border: "1.5px solid var(--line)", flex: 1 }} onClick={() => setStep(2)}>이전</button>
              <button type="submit" className="auth-cta" style={{ flex: 2 }} disabled={loading}>{loading ? "가입 중..." : "다음"}</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <SignupOptionalFields onSubmit={saveOptional} onSkip={() => setStep(5)} submitting={loading} />
        )}

        {step === 5 && (
          <SignupLicenseFields onSubmit={saveLicense} submitting={loading} />
        )}
      </div>
    </AuthShell>
  );
}
