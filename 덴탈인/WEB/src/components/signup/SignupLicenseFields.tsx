"use client";

// msg-g3 단위1: 가입 면허 스텝(개인, 선택). 시안 signup-personal-email/sns STEP6.
// 면허번호 + 면허증 이미지 업로드(PII=private). 스킵 가능.
// 가입 흐름(방법B): 이미 로그인 상태 → 업로드(/api/upload visibility=private) + onSubmit(payload)로 부모가 PATCH /me/extra.
import { useState } from "react";
import { api } from "@/lib/api";

export type LicensePayload = {
  licenseNo: string | null;
  licenseImageUrl: string | null;
};

export default function SignupLicenseFields({
  onSubmit,
  submitting,
}: {
  onSubmit: (payload: LicensePayload) => void;
  submitting?: boolean;
}) {
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseImageUrl, setLicenseImageUrl] = useState("");
  const [fileName, setFileName] = useState(""); // F-A item5: 미리보기 대신 파일명만 표시
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // ①: 이미지 형식만 허용
    if (!f.type.startsWith("image/")) { alert("면허증은 이미지 파일(PNG, JPG, WEBP 등)만 첨부할 수 있습니다."); e.target.value = ""; return; }
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", f);
    fd.append("visibility", "private"); // 면허증 = PII
    const res = await api.upload<{ url: string }>("/api/upload", fd);
    setUploading(false);
    if (!res.success || !res.data) { setErr(res.message || "파일 업로드에 실패했습니다."); return; }
    setLicenseImageUrl(res.data.url);
    setFileName(f.name);
  }

  function submit() {
    onSubmit({
      licenseNo: licenseNo.trim() || null,
      licenseImageUrl: licenseImageUrl || null,
    });
  }

  return (
    <>
      {/* F-A item3: 퍼블 시안(STEP6) 1:1 — opt-head/스킵 버튼 제거, 평문 auth-title(줄바꿈 깨짐 해소) */}
      <h1 className="auth-title" style={{ textAlign: "left" }}>면허 정보를 입력해 주세요. (선택)</h1>
      <p className="auth-sub" style={{ textAlign: "left" }}>면허를 등록하면 인증 뱃지가 다른 회원에게 노출됩니다. (선택)</p>

      {/* 면허 번호 */}
      <div className="field">
        <label>면허 번호</label>
        <div className="input-box">
          <input type="text" placeholder="면허번호를 입력하세요." value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} />
        </div>
      </div>

      {/* 면허증 이미지 업로드 */}
      <div className="field">
        <label>면허증 (이미지 파일)</label>
        {/* F-A item5: 미리보기(private라 안 보임) 제거 → 파일명만 표시 */}
        <label className={`upload-box ${licenseImageUrl ? "has" : ""}`} style={{ display: 'flex' }}>
          <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          <div className="ic">
            {licenseImageUrl ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            )}
          </div>
          <div className="lab">{uploading ? "업로드 중..." : licenseImageUrl ? fileName : "+ 등록하기"}</div>
          <div className="meta">{licenseImageUrl ? "첨부 완료" : "이미지파일"}</div>
        </label>
        {licenseImageUrl && (
          <button type="button" className="opt-skip" style={{ marginTop: 8 }} onClick={() => { setLicenseImageUrl(""); setFileName(""); }}>파일 삭제</button>
        )}
      </div>

      <div className="badge-info">
        <div className="ic">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <div className="text">면허를 등록하면 다른 회원들에게 인증뱃지가 보여집니다.</div>
      </div>

      {err && <div className="help">{err}</div>}
      <button type="button" className="auth-cta" style={{ marginTop: 18 }} onClick={submit} disabled={submitting || uploading}>{submitting ? "처리 중..." : "가입 완료"}</button>
    </>
  );
}
