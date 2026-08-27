"use client";

// msg-g3 ②=A: 시안 약관 3종(서비스/개인정보/마케팅) + 전체동의. 만14세(termsAge)는 별도 행 없이
// "개인정보 수집·이용 동의 (만 14세 이상)"에 통합 → termsPrivacy와 함께 토글(서버 termsAge 필수 무변경).
import Link from "next/link";

export type TermsState = {
  termsService: boolean;
  termsPrivacy: boolean;
  termsAge: boolean;
  marketingAgree: boolean;
};

export const TERMS_INIT: TermsState = {
  termsService: false,
  termsPrivacy: false,
  termsAge: false,
  marketingAgree: false,
};

export function termsAllRequired(t: TermsState) {
  return t.termsService && t.termsPrivacy && t.termsAge;
}

export default function TermsAgree({ value, onChange }: { value: TermsState; onChange: (next: TermsState) => void }) {
  // UI 약관 3종(전체동의는 마케팅 포함). termsAge는 개인정보 동의에 종속.
  const allChecked = value.termsService && value.termsPrivacy && value.marketingAgree;
  function setAll(v: boolean) {
    onChange({ termsService: v, termsPrivacy: v, termsAge: v, marketingAgree: v });
  }
  function setService(v: boolean) {
    onChange({ ...value, termsService: v });
  }
  function setPrivacy(v: boolean) {
    onChange({ ...value, termsPrivacy: v, termsAge: v }); // 만14세 통합
  }
  function setMarketing(v: boolean) {
    onChange({ ...value, marketingAgree: v });
  }

  return (
    <div className="terms-list">
      <div className="terms-row all">
        <label className="check">
          <input type="checkbox" checked={allChecked} onChange={(e) => setAll(e.target.checked)} />
          <span>모두 확인했으며 동의합니다.</span>
        </label>
      </div>
      <div className="terms-row">
        <label className="check">
          <input type="checkbox" checked={value.termsService} onChange={(e) => setService(e.target.checked)} />
          <span><span className="req-tag">[필수]</span> 서비스 이용약관</span>
        </label>
        <Link href="/terms?type=service" className="view" target="_blank">보기 ›</Link>
      </div>
      <div className="terms-row">
        <label className="check">
          <input type="checkbox" checked={value.termsPrivacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span><span className="req-tag">[필수]</span> 개인정보 수집·이용 동의 (만 14세 이상)</span>
        </label>
        <Link href="/terms?type=privacy" className="view" target="_blank">보기 ›</Link>
      </div>
      <div className="terms-row">
        <label className="check">
          <input type="checkbox" checked={value.marketingAgree} onChange={(e) => setMarketing(e.target.checked)} />
          <span><span className="opt-tag">[선택]</span> 마케팅 활용 동의</span>
        </label>
        <Link href="/terms?type=marketing" className="view" target="_blank">보기 ›</Link>
      </div>
    </div>
  );
}
