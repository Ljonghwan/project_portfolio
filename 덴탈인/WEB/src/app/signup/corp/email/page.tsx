"use client";

// msg-g3 단위3: 기업 이메일 회원가입 3스텝 재구현 (signup-corp-email.html 1:1).
// ①약관(TermsAgree 3종) → ②회원정보(담당자: 이메일중복확인/비번×2/담당자명/휴대폰인증) → ③기업정보(병원명/주소/사업자번호/등록증).
// N-A item1: 3step(약관→회원정보→기업정보) 모두 필수. ②는 검증만 후 ③로 진행, ③ 기업정보까지 채우면
// signup/corp/email에 전체(회원+기업정보) 전송 → 계정 생성+CorpProfile 동시(atomic) + 자동 로그인 → /mypage.
// (구 방법B: ②에서 계정 생성 후 ③ PATCH — 기업정보 미완 반쪽 계정 가능성 있어 폐기.)
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import TermsAgree, { TERMS_INIT, type TermsState, termsAllRequired } from "@/components/TermsAgree";
import PhoneVerifyField from "@/components/PhoneVerifyField";
import PasswordInput from "@/components/PasswordInput";
import SignupCorpFields, { type CorpPayload } from "@/components/signup/SignupCorpFields";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useRedirectIfAuthed } from "@/lib/useRedirectIfAuthed";

const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const TOTAL = 3;
const STEP_TITLE = ["약관 동의", "회원정보 입력"];
const STEP_SUB = ["서비스 이용을 위해 약관에 동의해 주세요.", "담당자 정보를 입력해 주세요."];

export default function CorpEmailSignupPage() {
  useRedirectIfAuthed(); // msg-g3 LOW-2
  const router = useRouter();
  const [step, setStep] = useState(1); // 1..3
  const [terms, setTerms] = useState<TermsState>(TERMS_INIT);

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
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setEmailChecked(false); setEmailMsg("이메일 형식이 올바르지 않습니다."); return; }
    const res = await api.get<{ available: boolean }>(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
    if (res.success && res.data?.available) { setEmailChecked(true); setEmailMsg("사용 가능한 이메일입니다."); }
    else if (res.success && res.data) { setEmailChecked(false); setEmailMsg("이미 사용 중인 이메일입니다."); }
    else { setEmailChecked(false); setEmailMsg(res.message || "이메일 확인에 실패했습니다."); }
  }

  function next1() {
    if (!termsAllRequired(terms)) { setSubmitErr("필수 약관에 모두 동의해 주세요."); return; }
    setSubmitErr(null); setStep(2);
  }

  // ② 회원정보(담당자) — 검증만 후 ③로 진행(계정 생성은 ③ 완료 시점).
  function next2() {
    setSubmitErr(null);
    if (emailChecked !== true) { setSubmitErr("이메일 중복확인을 해주세요."); return; }
    if (!pwRegex.test(password)) { setSubmitErr("비밀번호는 8자 이상 영문/숫자/특수문자 조합이어야 합니다."); return; }
    if (password !== password2) { setSubmitErr("비밀번호가 일치하지 않습니다."); return; }
    if (!name.trim()) { setSubmitErr("담당자명을 입력해 주세요."); return; }
    if (!phoneVerified) { setSubmitErr("휴대폰 인증을 완료해 주세요."); return; }
    setStep(3);
  }

  // ③ 기업정보까지 완료 → 회원+기업정보 함께 가입 API 전송(atomic) → 자동 로그인 → /mypage
  async function completeSignup(corp: CorpPayload) {
    setSubmitErr(null);
    setLoading(true);
    const res = await api.post<{ accessToken: string }>("/api/auth/signup/corp/email", {
      email, password, name, phone, ...terms,
      hospitalName: corp.hospitalName,
      businessNo: corp.businessNo,
      businessType: corp.businessType,
      hospitalAddress: corp.hospitalAddress,
      hospitalZipcode: corp.hospitalZipcode,
      hospitalDetailAddress: corp.hospitalDetailAddress,
      businessLicenseImageUrl: corp.businessLicenseImageUrl,
    });
    if (!res.success || !res.data) { setLoading(false); setSubmitErr(res.message || "가입에 실패했습니다."); return; }
    setAccessToken(res.data.accessToken);
    // F11: atomic 가입은 가입 전 토큰이 없어 사업자등록증을 가입 후(토큰 확보)에 업로드 + PATCH.
    //      이미지는 선택값이라 실패해도 가입 자체는 완료 — 실패 시 무시(마이페이지에서 재등록 가능).
    if (corp.licenseFile) {
      try {
        const fd = new FormData();
        fd.append("file", corp.licenseFile);
        fd.append("visibility", "private");
        const up = await api.upload<{ url: string }>("/api/upload", fd);
        if (up.success && up.data?.url) {
          await api.patch("/api/users/me/extra", { businessLicenseImageUrl: up.data.url }, true);
        }
      } catch { /* 선택 항목 — 무시 */ }
    }
    setLoading(false);
    await useAuthStore.getState().syncFromServer();
    router.push("/mypage?welcome=1");
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <div className="signup-stepbar">
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className={`signup-step ${step >= i + 1 ? "on" : ""}`} />
          ))}
        </div>

        {step <= 2 && (
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
          <form onSubmit={(e) => { e.preventDefault(); next2(); }} noValidate>
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
              <div className="input-box"><PasswordInput placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></div>
              <div className="hint">8자리 이상 영문, 숫자, 특수문자 혼합</div>
            </div>
            <div className="field">
              <label>비밀번호 확인<span className="req">*</span></label>
              <div className={`input-box ${password2 && password !== password2 ? "error" : ""}`}><PasswordInput placeholder="비밀번호 재입력" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" /></div>
              {password2 && password !== password2 && <div className="help">비밀번호가 일치하지 않습니다.</div>}
            </div>
            <div className="field">
              <label>담당자명<span className="req">*</span></label>
              <div className="input-box"><input type="text" placeholder="담당자명 입력" value={name} onChange={(e) => setName(e.target.value)} /></div>
            </div>
            <PhoneVerifyField phone={phone} onChangePhone={setPhone} verified={phoneVerified} onVerified={setPhoneVerified} />
            {submitErr && <div className="help">{submitErr}</div>}
            <div className="btn-row">
              <button type="button" className="auth-cta" style={{ background: "var(--surface)", color: "var(--ink-2)", border: "1.5px solid var(--line)", flex: 1 }} onClick={() => setStep(1)}>이전</button>
              <button type="submit" className="auth-cta" style={{ flex: 2 }}>다음</button>
            </div>
          </form>
        )}

        {/* F11: 이메일 가입은 atomic(가입 전 토큰 없음) → deferUpload로 등록증을 가입 후 업로드 */}
        {step === 3 && <SignupCorpFields onSubmit={completeSignup} submitting={loading} externalError={submitErr} deferUpload />}
      </div>
    </AuthShell>
  );
}
