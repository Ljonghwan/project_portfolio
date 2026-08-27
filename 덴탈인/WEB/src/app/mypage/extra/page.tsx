"use client";

// p2-mypage-g2: 추가 정보 퍼블 1:1 (mypage-business-info.html 개인 / mypage-corp-extra.html 기업).
// info-tabs + form-row. 개인=나이/성별/거주지/경력/희망지역/희망연봉/면허증, 기업=병원명/주소/사업자번호/사업자등록증.
// 모델 갭(사업장구분 businessType / 면허증명 licenseName 컬럼 부재)은 PM 결정 대기 → 미렌더.
// 직종(jobType)은 시안에 없어 편집 UI 제거(가입 시 값 보존하여 저장).
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MyPageShell from "@/components/MyPageShell";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMe, type Me } from "@/lib/useMe";
import { api } from "@/lib/api";
import { openDaumPostcode } from "@/lib/postcode";
import { useSidoOptions, useSigunguList } from "@/stores/regionStore";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from "@/lib/jobs";
import { useCodeStore } from "@/stores/codeStore";
import { isValidBizNo, bizNoDigits } from "@/lib/bizNo";

const THIS_YEAR = new Date().getFullYear(); // 만 나이 계산 기준(현재연도 동적). 연 단위라 SSR/CSR 동일(hydration 무관).

export default function Page() {
  return <Suspense fallback={<div />}><Inner /></Suspense>;
}

function Inner() {
  const { me, loading, reload } = useMe();
  if (loading) return <MyPageShell me={null}><LoadingIndicator /></MyPageShell>;
  if (!me) return null;
  return me.userType === "corp"
    ? <CorpExtra key={me.id} me={me} reload={reload} />
    : <PersonalExtra key={me.id} me={me} reload={reload} />;
}

// 첨부 URL → 원본 파일명 추출(서버 저장명 `타임스탬프_해시_원본명` → 원본명). signup 파일명 표시와 일관.
function fileNameFromUrl(url: string | null | undefined): string {
  if (!url) return "";
  const last = (url.split("/").pop() || "").split("?")[0];
  const parts = last.split("_");
  return parts.length > 2 ? parts.slice(2).join("_") : last;
}

/* ===================== 개인 추가 정보 ===================== */
function PersonalExtra({ me, reload }: { me: Me; reload: () => void }) {
  const p = me.personalProfile;
  const sidoOptions = useSidoOptions();

  // jobType은 편집 UI 없이 보존(시안 미포함).
  const [jobType] = useState(p?.jobType ?? "");
  const [gender, setGender] = useState<"" | "male" | "female">((p?.gender as "male" | "female") || "");
  // msg-g2 항목8: 나이 → 출생연도 입력. 저장값=출생연도, 표시=현재나이(기준연도-출생연도).
  const [birthYear, setBirthYear] = useState<string>(p?.birthYear ? String(p.birthYear) : "");
  const [sido, setSido] = useState(p?.sido || "");
  const [sigungu, setSigungu] = useState(p?.sigungu || "");
  const [careerMode, setCareerMode] = useState<"new" | "exp">((p?.careerYears || p?.careerMonths) ? "exp" : "new");
  const [careerYears, setCareerYears] = useState<string>(String(p?.careerYears ?? 0));
  const [careerMonths, setCareerMonths] = useState<string>(String(p?.careerMonths ?? 0));
  const [desired, setDesired] = useState<{ sido: string; sigungu: string }[]>(Array.isArray(p?.desiredAreas) ? p!.desiredAreas! : []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [desiredSido, setDesiredSido] = useState("");
  const [desiredSigungu, setDesiredSigungu] = useState("");
  const [salaryMin, setSalaryMin] = useState<string>(p?.salaryMin ? String(p.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState<string>(p?.salaryMax ? String(p.salaryMax) : "");
  const [salaryNegotiable, setSalaryNegotiable] = useState(!!p?.salaryNegotiable);
  const [licenseName, setLicenseName] = useState(p?.licenseName || "");
  const [licenseNo, setLicenseNo] = useState(p?.licenseNo || "");
  const [licenseImageUrl, setLicenseImageUrl] = useState(p?.licenseImageUrl || "");
  const [licenseFileName, setLicenseFileName] = useState(fileNameFromUrl(p?.licenseImageUrl)); // 5번: 첨부 파일명 표시
  // 미리보기: 저장본=서명 토큰 URL(private), 선택본=로컬 blob(저장 전)
  const savedLicenseViewUrl = p?.licenseImageViewUrl || null;
  const [licensePreview, setLicensePreview] = useState<string | null>(null); // 선택본 blob
  // me 갱신(저장 후 서명 URL 변경)되면 선택본 해제 → 저장본 표시
  useEffect(() => {
    setLicensePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  }, [savedLicenseViewUrl]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // 동기 더블클릭 가드(BUG-3)

  const sigunguList = useSigunguList(sido);
  const desiredSigunguList = useSigunguList(desiredSido);
  // 출생연도 옵션 — 만 15세 이상(기준연도-15)부터 만 81세까지(2011~1945, 최신 연도 먼저).
  const birthYearOptions = useMemo(() => Array.from({ length: (THIS_YEAR - 15) - 1945 + 1 }, (_, i) => (THIS_YEAR - 15) - i), []);
  const currentAge = birthYear ? THIS_YEAR - Number(birthYear) : null; // 표시용 현재 나이

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("visibility", "private"); // 면허증 = PII
    const res = await api.upload<{ url: string }>("/api/upload", fd);
    if (!res.success || !res.data) { setErr(res.message || "파일 업로드 실패"); return null; }
    return res.data.url;
  }
  async function onLicenseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    // ①: 이미지 형식만 허용
    if (!f.type.startsWith("image/")) { alert("면허증은 이미지 파일(PNG, JPG, WEBP 등)만 첨부할 수 있습니다."); e.target.value = ""; return; }
    const blob = URL.createObjectURL(f);
    setLicensePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return blob; });
    const url = await uploadFile(f);
    if (url) { setLicenseImageUrl(url); setLicenseFileName(f.name); setErr(null); }
    else { URL.revokeObjectURL(blob); setLicensePreview(null); }
    e.target.value = "";
  }

  function addDesired() {
    if (!desiredSido || !desiredSigungu) return;
    if (desired.length >= 5) { setErr("희망지역은 최대 5개까지 추가 가능합니다."); return; }
    if (desired.some((d) => d.sido === desiredSido && d.sigungu === desiredSigungu)) { setPickerOpen(false); return; }
    setDesired([...desired, { sido: desiredSido, sigungu: desiredSigungu }]);
    setDesiredSido(""); setDesiredSigungu(""); setPickerOpen(false); setErr(null);
  }

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;
    setErr(null); setMsg(null);
    // msg-g2 항목9: 희망연봉(만원) 범위 사전 검증 — 컬럼 초과로 인한 원시 DB 에러 차단.
    const sMin = salaryNegotiable ? null : (salaryMin ? Number(salaryMin) : null);
    const sMax = salaryNegotiable ? null : (salaryMax ? Number(salaryMax) : null);
    if (sMin != null && sMin > 99999) { setErr("희망 연봉(최소)은 99,999만원 이하로 입력해 주세요."); return; }
    if (sMax != null && sMax > 99999) { setErr("희망 연봉(최대)은 99,999만원 이하로 입력해 주세요."); return; }
    if (sMin != null && sMax != null && sMin > sMax) { setErr("희망 연봉 최소 금액이 최대 금액보다 클 수 없습니다."); return; }
    const body = {
      jobType: jobType || undefined, // 시안 미편집, 가입값 보존
      gender: gender || null,
      birthYear: birthYear ? Number(birthYear) : null, // msg-g2 항목8: 출생연도 저장(age는 deprecated, 미전송)
      sido: sido || null,
      sigungu: sigungu || null,
      careerYears: careerMode === "new" ? 0 : (Number(careerYears) || 0),
      careerMonths: careerMode === "new" ? 0 : Math.max(0, Math.min(11, Number(careerMonths) || 0)),
      desiredAreas: desired,
      salaryMin: sMin,
      salaryMax: sMax,
      salaryNegotiable,
      licenseName: licenseName || null,
      licenseNo: licenseNo || null,
      licenseImageUrl: licenseImageUrl || null,
    };
    savingRef.current = true;
    setSaving(true);
    const res = await api.patch("/api/users/me/extra", body, true).finally(() => { savingRef.current = false; });
    setSaving(false);
    if (!res.success) {
      // msg-g2 항목9: server 검증 실패는 필드별 메시지 우선(통일문구/원시 DB 에러 회피).
      const issues = res.issues as { message: string }[] | undefined;
      const issueMsg = Array.isArray(issues) && issues.length > 0 ? issues[0].message : null;
      setErr(issueMsg || res.message || "저장 실패");
      return;
    }
    setMsg("저장되었습니다."); reload();
  }

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head">
        <div>
          <h2>추가 정보</h2>
          <div className="sub">모두 선택사항이며, 1개라도 수정되면 저장됩니다.</div>
        </div>
      </div>

      <LicenseStatusBanner status={me.licenseStatus} reason={me.licenseReason} reviewedAt={me.licenseReviewedAt} isCorp={false} />

      <div className="mp-card info-card extra-corp">
        <div className="info-tabs">
          <Link href="/mypage/info">내 정보</Link>
          <Link href="/mypage/extra" className="on">추가 정보</Link>
        </div>

        <form onSubmit={saveAll} noValidate>
          {/* msg-g2 항목8: 출생연도 입력 → 현재 나이 표시(저장값=출생연도) */}
          <div className="form-row">
            <div className="lbl">출생연도</div>
            <div className="field">
              <div className="row-flex" style={{ alignItems: "center" }}>
                <select className="select-base" style={{ maxWidth: 240 }} value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                  <option value="">출생연도 선택</option>
                  {birthYearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
                {currentAge != null && <span style={{ color: "var(--ink-3)", fontSize: 14, fontWeight: 600 }}>만 {currentAge}세</span>}
              </div>
            </div>
          </div>

          {/* 성별 — segmented */}
          <div className="form-row">
            <div className="lbl">성별</div>
            <div className="segmented" role="radiogroup">
              <label className={gender === "female" ? "on" : ""}><input type="radio" name="sex" checked={gender === "female"} onChange={() => setGender("female")} />여성</label>
              <label className={gender === "male" ? "on" : ""}><input type="radio" name="sex" checked={gender === "male"} onChange={() => setGender("male")} />남성</label>
            </div>
          </div>

          {/* 거주지 — 시도+시군구 cascade */}
          <div className="form-row start">
            <div className="lbl">주소 (현 거주지)</div>
            <div className="field">
              <div className="row-flex">
                <select className="select-base" value={sido} onChange={(e) => { setSido(e.target.value); setSigungu(""); }}>
                  <option value="">시도 선택</option>
                  {sidoOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="select-base" value={sigungu} onChange={(e) => setSigungu(e.target.value)} disabled={!sido}>
                  <option value="">시군구 선택</option>
                  {sigunguList.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 경력 — segmented 신입/경력 + 년/개월 select */}
          <div className="form-row">
            <div className="lbl">경력</div>
            <div className="field">
              <div className="segmented" role="radiogroup">
                <label style={{ marginBottom: 0 }} className={careerMode === "new" ? "on" : ""}><input type="radio" name="career" checked={careerMode === "new"} onChange={() => setCareerMode("new")} />신입</label>
                <label style={{ marginBottom: 0 }} className={careerMode === "exp" ? "on" : ""}><input type="radio" name="career" checked={careerMode === "exp"} onChange={() => setCareerMode("exp")} />경력</label>
              </div>
              {careerMode === "exp" && (
                <div className="row-flex" style={{ marginTop: 6 }}>
                  <select className="select-base" value={careerYears} onChange={(e) => setCareerYears(e.target.value)}>
                    {Array.from({ length: 31 }, (_, i) => i).map((y) => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select className="select-base" value={careerMonths} onChange={(e) => setCareerMonths(e.target.value)}>
                    {Array.from({ length: 12 }, (_, i) => i).map((m) => <option key={m} value={m}>{m}개월</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 근무 희망지역 — region-picker 칩 */}
          <div className="form-row start">
            <div className="lbl">근무 희망 지역</div>
            <div className="field">
              <div className="region-picker">
                <div className="region-chips">
                  {desired.map((d, i) => (
                    <span className="region-chip" key={`${d.sido}-${d.sigungu}-${i}`}>{d.sido} {d.sigungu}
                      <button type="button" aria-label={`${d.sigungu} 삭제`} onClick={() => setDesired(desired.filter((_, idx) => idx !== i))}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                      </button>
                    </span>
                  ))}
                  {!pickerOpen && desired.length < 5 && (
                    <button type="button" className="region-add" onClick={() => setPickerOpen(true)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      지역 선택
                    </button>
                  )}
                </div>
                {pickerOpen && (
                  <div className="row-flex" style={{ marginBottom: 8 }}>
                    <select className="select-base" value={desiredSido} onChange={(e) => { setDesiredSido(e.target.value); setDesiredSigungu(""); }}>
                      <option value="">시도</option>
                      {sidoOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select className="select-base" value={desiredSigungu} onChange={(e) => setDesiredSigungu(e.target.value)} disabled={!desiredSido}>
                      <option value="">시군구</option>
                      {desiredSigunguList.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
                    </select>
                    <button type="button" className="btn-sub" onClick={addDesired}>추가</button>
                    <button type="button" className="btn-sub ghost" onClick={() => { setPickerOpen(false); setDesiredSido(""); setDesiredSigungu(""); }}>취소</button>
                  </div>
                )}
                <p className="region-help">원하시는 근무지역을 5개까지 선택 가능합니다.</p>
              </div>
            </div>
          </div>

          {/* 희망 연봉 */}
          <div className="form-row">
            <div className="lbl">희망 연봉</div>
            <div className="field">
              <div className="row-flex">
                <input type="text" inputMode="numeric" className="input-base" placeholder="최소금액 만원" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value.replace(/[^0-9]/g, ""))} disabled={salaryNegotiable} />
                <span className="sep">~</span>
                <input type="text" inputMode="numeric" className="input-base" placeholder="최대금액 만원" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value.replace(/[^0-9]/g, ""))} disabled={salaryNegotiable} />
                <label className={`segmented ${salaryNegotiable ? "on" : ""}`} style={{ marginBottom: 0, flexShrink: 0, padding: 7 }}>
                  <input type="checkbox" checked={salaryNegotiable} onChange={(e) => setSalaryNegotiable(e.target.checked)} style={{ display: "none" }} />
                  면접 후 결정
                </label>
              </div>
            </div>
          </div>

          {/* 면허증 — license-card (면허증명=licenseName 컬럼 부재로 보류, 면허번호만) */}
          <div className="form-row start last">
            <div className="lbl">면허증</div>
            <div className="field">
              <div className="license-card">
                {/* 미리보기를 label(업로드 박스) 안에 인라인 표시: 선택본(blob) > 저장본(서명 URL) > 안내 */}
                <label className={`license-uploader ${(licensePreview || savedLicenseViewUrl) ? "has-file" : ""}`} aria-label="면허증 업로드">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onLicenseFile} style={{ display: "none" }} />
                  {(licensePreview || savedLicenseViewUrl) ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={licensePreview || savedLicenseViewUrl || ""} alt="면허증 미리보기" className="uploader-thumb" />
                      <span className="uploader-overlay">
                        <b>변경</b>
                        {licenseFileName && <em>{licenseFileName}</em>}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      <span className="label">+ 등록하기</span>
                      <span className="hint">이미지 파일</span>
                    </>
                  )}
                </label>
                <div className="license-info">
                  <span className="badge-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    인증 시 다른 회원들에게 인증뱃지가 보여집니다
                  </span>
                  <input type="text" className="input-base" placeholder="면허증명을 입력하세요." value={licenseName} onChange={(e) => setLicenseName(e.target.value)} />
                  <input type="text" className="input-base" placeholder="면허번호를 입력하세요." value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {err && <p className="help-msg err" style={{ marginTop: 12 }}>{err}</p>}
          {msg && (
            <div className="toast" style={{ marginTop: 14 }}>
              <span className="check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg></span>
              {msg}
            </div>
          )}

          <div className="form-actions end">
            <button type="submit" className="save-cta" disabled={saving}>저장</button>
          </div>
        </form>
      </div>
    </MyPageShell>
  );
}

/* ===================== 기업 추가 정보 ===================== */
function CorpExtra({ me, reload }: { me: Me; reload: () => void }) {
  const c = me.corpProfile;
  useCodeStore((s) => s.loaded); // businessType 라벨 hydrate 후 리렌더
  const [hospitalName, setHospitalName] = useState(c?.hospitalName || "");
  const [businessType, setBusinessType] = useState(c?.businessType || "");
  const [hospitalZipcode, setHospitalZipcode] = useState(c?.hospitalZipcode || "");
  const [hospitalAddress, setHospitalAddress] = useState(c?.hospitalAddress || "");
  const [hospitalDetailAddress, setHospitalDetailAddress] = useState(c?.hospitalDetailAddress || "");
  const [businessNo, setBusinessNo] = useState(c?.businessNo || "");
  const [businessLicenseImageUrl, setBusinessLicenseImageUrl] = useState(c?.businessLicenseImageUrl || "");
  const [bizFileName, setBizFileName] = useState(fileNameFromUrl(c?.businessLicenseImageUrl)); // 5번: 첨부 파일명 표시
  // 미리보기: 저장본=서명 토큰 URL(private), 선택본=로컬 blob(저장 전)
  const savedBizViewUrl = c?.businessLicenseImageViewUrl || null;
  const [bizPreview, setBizPreview] = useState<string | null>(null);
  useEffect(() => {
    setBizPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  }, [savedBizViewUrl]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // 동기 더블클릭 가드(BUG-3)

  async function onBizFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    // ①: 이미지 형식만 허용
    if (!f.type.startsWith("image/")) { alert("사업자등록증은 이미지 파일(PNG, JPG, WEBP 등)만 첨부할 수 있습니다."); e.target.value = ""; return; }
    const blob = URL.createObjectURL(f);
    setBizPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return blob; });
    const fd = new FormData();
    fd.append("file", f);
    fd.append("visibility", "private"); // 사업자등록증 = PII
    const res = await api.upload<{ url: string }>("/api/upload", fd);
    if (!res.success || !res.data) { setErr(res.message || "파일 업로드 실패"); URL.revokeObjectURL(blob); setBizPreview(null); e.target.value = ""; return; }
    setBusinessLicenseImageUrl(res.data.url); setBizFileName(f.name); setErr(null);
    e.target.value = "";
  }

  async function openPostcode() {
    setErr(null);
    const r = await openDaumPostcode();
    if (!r) return;
    setHospitalZipcode(r.zonecode);
    setHospitalAddress(r.address);
  }

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;
    setErr(null); setMsg(null);
    if (!hospitalName.trim()) { setErr("병원명을 입력해 주세요."); return; }
    // N-A item3: 사업자번호 입력 시 10자리 + 체크섬 검증(외부 API 미사용).
    if (businessNo.trim() && !isValidBizNo(businessNo)) { setErr("사업자등록번호가 올바르지 않습니다. 숫자 10자리를 정확히 입력해 주세요."); return; }
    const body = { hospitalName, hospitalZipcode, hospitalAddress, hospitalDetailAddress, businessNo: businessNo.trim() ? bizNoDigits(businessNo) : businessNo, businessLicenseImageUrl, businessType: businessType || null };
    savingRef.current = true;
    setSaving(true);
    const res = await api.patch("/api/users/me/extra", body, true).finally(() => { savingRef.current = false; });
    setSaving(false);
    if (!res.success) {
      // msg-g2 항목9: server 검증 실패는 필드별 메시지 우선(통일문구/원시 DB 에러 회피).
      const issues = res.issues as { message: string }[] | undefined;
      const issueMsg = Array.isArray(issues) && issues.length > 0 ? issues[0].message : null;
      setErr(issueMsg || res.message || "저장 실패");
      return;
    }
    setMsg("저장되었습니다."); reload();
  }

  const addrDisplay = hospitalAddress ? (hospitalZipcode ? `[${hospitalZipcode}] ${hospitalAddress}` : hospitalAddress) : "";

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head">
        <div>
          <h2>추가 정보</h2>
          <div className="sub">기업 정보를 입력해 주세요. 채용 공고에 함께 노출됩니다.</div>
        </div>
      </div>

      <LicenseStatusBanner status={me.licenseStatus} reason={me.licenseReason} reviewedAt={me.licenseReviewedAt} isCorp />

      <div className="mp-card info-card extra-corp">
        <div className="info-tabs">
          <Link href="/mypage/info">내 정보</Link>
          <Link href="/mypage/extra" className="on">추가 정보</Link>
        </div>

        <form onSubmit={saveAll} noValidate>
          <div className="form-row">
            <div className="lbl">병원명 <span className="req">*</span></div>
            <div className="field">
              <input type="text" className="input-base" placeholder="병원명을 입력하세요." value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
            </div>
          </div>

          {/* 사업장 구분 — codes businessType 단일 선택(택1, 재클릭 해제). PM Q1=A */}
          <div className="form-row">
            <div className="lbl">사업장 구분 <span className="req">*</span></div>
            <div className="field">
              <div className="chips-row">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    className={`chip-pick ${businessType === bt ? "on" : ""}`}
                    onClick={() => setBusinessType(businessType === bt ? "" : bt)}
                  >
                    {BUSINESS_TYPE_LABELS[bt] ?? bt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row start">
            <div className="lbl">병원 주소 <span className="req">*</span></div>
            <div className="field">
              <div className="row-2">
                <input type="text" className="input-base readonly" placeholder="주소" value={addrDisplay} readOnly />
                <button type="button" className="btn-sub ghost" onClick={openPostcode}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  주소검색
                </button>
              </div>
              <input type="text" className="input-base" placeholder="상세주소 입력" value={hospitalDetailAddress} onChange={(e) => setHospitalDetailAddress(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="lbl">사업자등록번호 <span className="req">*</span></div>
            <div className="field">
              <input type="text" className="input-base" inputMode="numeric" placeholder="숫자 10자리 (- 없이)" value={businessNo} onChange={(e) => setBusinessNo(bizNoDigits(e.target.value))} maxLength={10} />
            </div>
          </div>

          <div className="form-row start last">
            <div className="lbl">사업자등록증 <span className="req">*</span></div>
            <div className="field">
              <div className="upload">
                {/* 미리보기를 업로드 박스 안(클릭 가능 label)에 인라인 썸네일로: 선택본 > 저장본 */}
                {(bizPreview || savedBizViewUrl) && (
                  <label className="upload-thumb" aria-label="사업자등록증 변경">
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onBizFile} style={{ display: "none" }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bizPreview || savedBizViewUrl || ""} alt="사업자등록증 미리보기" />
                  </label>
                )}
                <div className="info">
                  <div className="ttl">{businessLicenseImageUrl ? "등록 완료" : "사업자등록증 이미지 파일"}</div>
                  <div className="meta">{businessLicenseImageUrl ? (bizFileName || "첨부 완료") : "JPG, PNG, WEBP 형식 · 최대 5MB · 1장 등록"}</div>
                </div>
                <label className="upbtn">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onBizFile} style={{ display: "none" }} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                  {businessLicenseImageUrl ? "변경" : "등록하기"}
                </label>
              </div>
            </div>
          </div>

          {err && <p className="help-msg err" style={{ marginTop: 12 }}>{err}</p>}
          {msg && (
            <div className="toast" style={{ marginTop: 14 }}>
              <span className="check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg></span>
              {msg}
            </div>
          )}

          <div className="save-row">
            <button type="submit" className="btn-save" disabled={saving}>저장</button>
          </div>
        </form>
      </div>
    </MyPageShell>
  );
}

/* 라이선스 상태 배너 (반려 사유 노출 — 시안 외 정보성, 유지) */
function LicenseStatusBanner({ status, reason, reviewedAt, isCorp }: {
  status?: "none" | "pending" | "verified" | "rejected";
  reason?: string | null;
  reviewedAt?: string | null;
  isCorp: boolean;
}) {
  if (!status || status === "none") return null;
  const label = isCorp ? "사업자등록증" : "면허증";
  const base: React.CSSProperties = { margin: "0 0 16px", padding: "12px 14px", borderRadius: 10, fontSize: 14, lineHeight: 1.5 };
  if (status === "pending") {
    return <div data-testid="license-banner-pending" style={{ ...base, background: "#FFF6E5", border: "1px solid #F4C36B", color: "#7A4A00" }}>
      <strong>{label} 심사 대기 중</strong> — 운영자 확인이 완료될 때까지 일부 기능(채용 공고 등록 등)이 제한될 수 있습니다.
    </div>;
  }
  if (status === "verified") {
    return <div data-testid="license-banner-verified" style={{ ...base, background: "#E8F8F4", border: "1px solid #59C9B5", color: "#0C5C4F" }}>
      <strong>{label} 인증 완료</strong>{reviewedAt && <span style={{ marginLeft: 8, color: "#377F71" }}>({new Date(reviewedAt).toLocaleDateString("ko-KR")} 확인)</span>}
    </div>;
  }
  if (status === "rejected") {
    return <div data-testid="license-banner-rejected" style={{ ...base, padding: "14px 16px", background: "#FFF0F0", border: "1px solid #F5A3A3", color: "#8B1F1F", lineHeight: 1.6 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label} 인증이 반려되었습니다.</div>
      {reason && <div data-testid="license-banner-reason" style={{ whiteSpace: "pre-wrap" }}><strong>사유:</strong> {reason}</div>}
      {reviewedAt && <div style={{ marginTop: 6, color: "#A55656", fontSize: 13 }}>처리일: {new Date(reviewedAt).toLocaleString("ko-KR")}</div>}
      <div style={{ marginTop: 8, fontSize: 13, color: "#A55656" }}>아래 폼에서 다시 업로드한 뒤 저장하면 재심사가 진행됩니다.</div>
    </div>;
  }
  return null;
}
