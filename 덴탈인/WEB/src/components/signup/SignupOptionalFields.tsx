"use client";

// msg-g3 단위1: 가입 선택정보 스텝(개인). 시안 signup-personal-email/sns STEP5.
// mypage/extra 필드 재사용 — 출생연도(birthYear)/성별/거주지(시도+시군구)/경력/희망지역(max5)/희망연봉.
// 자체 state 관리 + onSubmit(payload)/onSkip 콜백. payload = PATCH /me/extra body 형식.
// 가입 흐름(방법B): 회원정보 완료로 이미 로그인 상태 → 부모가 onSubmit에서 PATCH /me/extra 호출.
import { useMemo, useState } from "react";
import { useSidoOptions, useSigunguList } from "@/stores/regionStore";

const THIS_YEAR = 2026; // 서버 기준연도(Date.now 회피)

export type OptionalPayload = {
  birthYear: number | null;
  gender: "male" | "female" | null;
  sido: string | null;
  sigungu: string | null;
  careerYears: number;
  careerMonths: number;
  desiredAreas: { sido: string; sigungu: string }[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
};

export default function SignupOptionalFields({
  onSubmit,
  onSkip,
  submitting,
}: {
  onSubmit: (payload: OptionalPayload) => void;
  onSkip: () => void;
  submitting?: boolean;
}) {
  const sidoOptions = useSidoOptions();
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [birthYear, setBirthYear] = useState("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [careerMode, setCareerMode] = useState<"new" | "exp">("new");
  const [careerYears, setCareerYears] = useState("0");
  const [careerMonths, setCareerMonths] = useState("0");
  const [desired, setDesired] = useState<{ sido: string; sigungu: string }[]>([]);
  const [desiredSido, setDesiredSido] = useState("");
  const [desiredSigungu, setDesiredSigungu] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryNegotiable, setSalaryNegotiable] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sigunguList = useSigunguList(sido);
  const desiredSigunguList = useSigunguList(desiredSido);
  const birthYearOptions = useMemo(() => Array.from({ length: (THIS_YEAR - 15) - 1945 + 1 }, (_, i) => (THIS_YEAR - 15) - i), []);
  const currentAge = birthYear ? THIS_YEAR - Number(birthYear) : null;

  function addDesired() {
    if (!desiredSido || !desiredSigungu) return;
    if (desired.length >= 5) { setErr("희망지역은 최대 5개까지 추가 가능합니다."); return; }
    if (desired.some((d) => d.sido === desiredSido && d.sigungu === desiredSigungu)) { setDesiredSido(""); setDesiredSigungu(""); return; }
    setDesired([...desired, { sido: desiredSido, sigungu: desiredSigungu }]);
    setDesiredSido(""); setDesiredSigungu(""); setErr(null);
  }

  function submit() {
    setErr(null);
    const sMin = salaryNegotiable ? null : (salaryMin ? Number(salaryMin) : null);
    const sMax = salaryNegotiable ? null : (salaryMax ? Number(salaryMax) : null);
    if (sMin != null && sMin > 99999) { setErr("희망 연봉(최소)은 99,999만원 이하로 입력해 주세요."); return; }
    if (sMax != null && sMax > 99999) { setErr("희망 연봉(최대)은 99,999만원 이하로 입력해 주세요."); return; }
    if (sMin != null && sMax != null && sMin > sMax) { setErr("희망 연봉 최소 금액이 최대 금액보다 클 수 없습니다."); return; }
    onSubmit({
      birthYear: birthYear ? Number(birthYear) : null,
      gender: gender || null,
      sido: sido || null,
      sigungu: sigungu || null,
      careerYears: careerMode === "new" ? 0 : Number(careerYears) || 0,
      careerMonths: careerMode === "new" ? 0 : Math.max(0, Math.min(11, Number(careerMonths) || 0)),
      desiredAreas: desired,
      salaryMin: sMin,
      salaryMax: sMax,
      salaryNegotiable,
    });
  }

  return (
    <>
      <div className="opt-head">
        <h1 className="auth-title">선택 정보를 입력해 주세요.</h1>
        <button type="button" className="opt-skip" onClick={onSkip} disabled={submitting}>다음에 등록하기 ›</button>
      </div>
      <p className="auth-sub">입력하시면 더 잘 맞는 채용을 추천해 드려요.</p>

      {/* 출생연도 */}
      <div className="field">
        <label>출생연도</label>
        <div className="input-box" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
            <option value="">출생연도 선택</option>
            {birthYearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          {currentAge != null && <span style={{ color: "var(--ink-3)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>만 {currentAge}세</span>}
        </div>
      </div>

      {/* 성별 */}
      <div className="field">
        <label>성별</label>
        <div className="gender-toggle">
          <button type="button" className={gender === "female" ? "on" : ""} onClick={() => setGender("female")}>여성</button>
          <button type="button" className={gender === "male" ? "on" : ""} onClick={() => setGender("male")}>남성</button>
        </div>
      </div>

      {/* 거주지 */}
      <div className="field">
        <label>주소 (현 거주지)</label>
        <div className="signup-grid-2">
          <div className="input-box">
            <select value={sido} onChange={(e) => { setSido(e.target.value); setSigungu(""); }}>
              <option value="">시/도 선택</option>
              {sidoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="input-box">
            <select value={sigungu} onChange={(e) => setSigungu(e.target.value)} disabled={!sido}>
              <option value="">시/군/구 선택</option>
              {sigunguList.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 경력 */}
      <div className="field">
        <label>경력</label>
        <div className="radio-row">
          <label className={careerMode === "new" ? "on" : ""}><input type="radio" name="career" checked={careerMode === "new"} onChange={() => setCareerMode("new")} />신입</label>
          <label className={careerMode === "exp" ? "on" : ""}><input type="radio" name="career" checked={careerMode === "exp"} onChange={() => setCareerMode("exp")} />경력</label>
        </div>
        {careerMode === "exp" && (
          <div className="signup-grid-2">
            <div className="input-box">
              <select value={careerYears} onChange={(e) => setCareerYears(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => i).map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
            </div>
            <div className="input-box">
              <select value={careerMonths} onChange={(e) => setCareerMonths(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => i).map((m) => <option key={m} value={m}>{m}개월</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 희망 근무 지역 (max 5, cascade) */}
      <div className="field">
        <label>근무 희망 지역</label>
        <div className="signup-region">
          {desired.length > 0 && (
            <div className="sr-chips">
              {desired.map((d, i) => (
                <span className="sr-chip" key={`${d.sido}-${d.sigungu}-${i}`}>{d.sido} {d.sigungu}
                  <button type="button" aria-label={`${d.sigungu} 삭제`} onClick={() => setDesired(desired.filter((_, idx) => idx !== i))}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          {desired.length < 5 && (
            <div className="sr-add">
              <select value={desiredSido} onChange={(e) => { setDesiredSido(e.target.value); setDesiredSigungu(""); }}>
                <option value="">시/도</option>
                {sidoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={desiredSigungu} onChange={(e) => setDesiredSigungu(e.target.value)} disabled={!desiredSido}>
                <option value="">시/군/구</option>
                {desiredSigunguList.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
              </select>
              <button type="button" className="btn-sub dark" onClick={addDesired}>추가</button>
            </div>
          )}
          <p className="sr-hint">원하시는 근무지역을 5개까지 선택 가능합니다.</p>
        </div>
      </div>

      {/* 희망 연봉 */}
      <div className="field">
        <label>희망 연봉</label>
        <div className="radio-row" style={{ marginBottom: 8 }}>
          <label className={salaryNegotiable ? "on" : ""} style={{ flex: "none" }}>
            <input type="checkbox" checked={salaryNegotiable} onChange={(e) => setSalaryNegotiable(e.target.checked)} />
            면접 후 결정
          </label>
        </div>
        <div className={`pay-row ${salaryNegotiable ? "off" : ""}`}>
          <div className="input-box">
            <input type="text" inputMode="numeric" placeholder="최소금액 만원" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value.replace(/[^0-9]/g, ""))} disabled={salaryNegotiable} />
          </div>
          <span className="sep">~</span>
          <div className="input-box">
            <input type="text" inputMode="numeric" placeholder="최대금액 만원" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value.replace(/[^0-9]/g, ""))} disabled={salaryNegotiable} />
          </div>
        </div>
      </div>

      {err && <div className="help">{err}</div>}
      <div className="btn-row">
        <button type="button" className="auth-cta" onClick={submit} disabled={submitting}>{submitting ? "저장 중..." : "다음"}</button>
      </div>
    </>
  );
}
