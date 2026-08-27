"use client";

// msg-g3 단위3: 기업 가입 ③기업정보 스텝(corp-email/sns 공통). 시안 signup-corp-*.html STEP5(기업정보).
// 병원명 / 병원주소(다음우편번호 + 상세주소) / 사업자등록번호 / 사업자등록증 업로드(private, 선택).
// 흐름(방법B): ②회원정보 완료로 이미 로그인 상태 → onSubmit(payload)로 부모가 PATCH /me/extra.
import { useState } from "react";
import { api } from "@/lib/api";
import { openDaumPostcode } from "@/lib/postcode";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from "@/lib/jobs";
import { useCodeStore } from "@/stores/codeStore";
import { isValidBizNo, bizNoDigits } from "@/lib/bizNo";

export type CorpPayload = {
  hospitalName: string;
  hospitalZipcode: string | null;
  hospitalAddress: string | null;
  hospitalDetailAddress: string | null;
  businessNo: string | null;
  businessType: string | null; // N-A item2: 사업장 구분(codes businessType, mypage/extra와 동일 코드값)
  businessLicenseImageUrl: string | null;
  // F11: 이메일 가입(atomic)은 가입 전 토큰이 없어 즉시 업로드 시 401. deferUpload면 File을 넘겨
  //      부모가 가입 완료(토큰 발급) 후 업로드+PATCH 처리.
  licenseFile?: File | null;
};

export default function SignupCorpFields({
  onSubmit,
  submitting,
  externalError,
  deferUpload = false,
}: {
  onSubmit: (payload: CorpPayload) => void;
  submitting?: boolean;
  externalError?: string | null; // 부모(가입 API 등) 에러 인라인 표시
  deferUpload?: boolean; // F11: true면 가입 전이라 즉시 업로드하지 않고 File을 부모로 위임
}) {
  useCodeStore((s) => s.loaded); // businessType 라벨/키 hydrate 후 리렌더
  const [hospitalName, setHospitalName] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [detail, setDetail] = useState("");
  const [businessNo, setBusinessNo] = useState(""); // 숫자 10자리(하이픈 제거)
  const [businessType, setBusinessType] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null); // F11: deferUpload 시 파일 보관
  const [fileName, setFileName] = useState(""); // F-A item5: 미리보기 대신 파일명만 표시
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function searchAddress() {
    const r = await openDaumPostcode();
    if (r) { setZipcode(r.zonecode); setAddress(r.address); setErr(null); }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // ①: 이미지 형식만 허용
    if (!f.type.startsWith("image/")) { alert("사업자등록증은 이미지 파일(PNG, JPG, WEBP 등)만 첨부할 수 있습니다."); e.target.value = ""; return; }
    setErr(null);
    // F11: 가입 전(deferUpload)엔 토큰이 없어 즉시 업로드 시 401 → File만 보관, 가입 후 부모가 업로드.
    if (deferUpload) {
      setLicenseFile(f);
      setFileName(f.name);
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    fd.append("visibility", "private"); // 사업자등록증 = PII
    const res = await api.upload<{ url: string }>("/api/upload", fd);
    setUploading(false);
    if (!res.success || !res.data) { setErr(res.message || "파일 업로드에 실패했습니다."); return; }
    setLicenseUrl(res.data.url);
    setFileName(f.name);
  }

  function submit() {
    setErr(null);
    if (!hospitalName.trim()) { setErr("병원명을 입력해 주세요."); return; }
    if (!businessType) { setErr("사업장 구분을 선택해 주세요."); return; }
    if (!address.trim()) { setErr("병원 주소를 검색해 주세요."); return; }
    if (!businessNo.trim()) { setErr("사업자등록번호를 입력해 주세요."); return; }
    // N-A item3: 10자리 + 체크섬 검증(외부 API 미사용).
    if (!isValidBizNo(businessNo)) { setErr("사업자등록번호가 올바르지 않습니다. 숫자 10자리를 정확히 입력해 주세요."); return; }
    onSubmit({
      hospitalName: hospitalName.trim(),
      hospitalZipcode: zipcode || null,
      hospitalAddress: address || null,
      hospitalDetailAddress: detail.trim() || null,
      businessNo: bizNoDigits(businessNo),
      businessType: businessType || null,
      businessLicenseImageUrl: licenseUrl || null,
      licenseFile: deferUpload ? licenseFile : null, // F11: 가입 후 부모가 업로드
    });
  }

  return (
    <>
      <h1 className="auth-title" style={{ textAlign: "left" }}>기업 정보를 입력해 주세요.</h1>
      <p className="auth-sub" style={{ textAlign: "left" }}>병원 정보를 입력해 가입을 완료합니다.</p>

      <div className="field">
        <label>병원명<span className="req">*</span></label>
        <div className="input-box"><input type="text" placeholder="병원명을 입력하세요." value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} /></div>
      </div>

      {/* N-A item2: 사업장 구분 — mypage/extra와 동일 코드값(BUSINESS_TYPES). */}
      <div className="field">
        <label>사업장 구분<span className="req">*</span></label>
        <div className="input-box">
          <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
            <option value="">사업장 구분 선택</option>
            {BUSINESS_TYPES.map((bt) => (
              <option key={bt} value={bt}>{BUSINESS_TYPE_LABELS[bt] ?? bt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>병원 주소<span className="req">*</span></label>
        <div className="addr-row">
          <div className="input-box"><input type="text" placeholder="주소를 검색해 주세요." value={address} readOnly /></div>
          <button type="button" className="addr-search-btn" onClick={searchAddress}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            주소검색
          </button>
        </div>
        <div className="input-box" style={{ marginTop: 8 }}><input type="text" placeholder="상세주소 입력" value={detail} onChange={(e) => setDetail(e.target.value)} /></div>
      </div>

      <div className="field">
        <label>사업자등록번호<span className="req">*</span></label>
        <div className="input-box"><input type="text" inputMode="numeric" placeholder="숫자 10자리 (- 없이)" value={businessNo} onChange={(e) => setBusinessNo(bizNoDigits(e.target.value))} maxLength={10} /></div>
      </div>

      {/* F-A item6: "사업자등록증 없음" 체크 제거 / item5: 미리보기 제거 → 파일명만 표시 */}
      <div className="field">
        <label className="field-label">사업자등록증<span className="field-opt">(선택)</span></label>
        {(() => {
          const attached = !!licenseUrl || !!licenseFile; // F11: deferUpload면 licenseFile로 첨부 인식
          return (
            <>
              <label className={`upload-box ${attached ? "has" : ""}`} style={{ display: 'flex' }}>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} style={{ display: "none" }} />
                <div className="ic">
                  {attached ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                  )}
                </div>
                <div className="lab">{uploading ? "업로드 중..." : attached ? fileName : "+ 등록하기"}</div>
                <div className="meta">{attached ? "첨부 완료" : "이미지 파일"}</div>
              </label>
              {attached && (
                <button type="button" className="opt-skip" style={{ marginTop: 8 }} onClick={() => { setLicenseUrl(""); setLicenseFile(null); setFileName(""); }}>파일 삭제</button>
              )}
            </>
          );
        })()}
      </div>

      {(err || externalError) && <div className="help">{err || externalError}</div>}
      <button type="button" className="auth-cta" style={{ marginTop: 18 }} onClick={submit} disabled={submitting || uploading}>{submitting ? "처리 중..." : "가입 완료"}</button>
    </>
  );
}
