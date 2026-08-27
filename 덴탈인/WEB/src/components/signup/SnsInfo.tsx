"use client";

// msg-g3 단위1: SNS 가입 안내 카드.
// - SnsConsentCard: /signup 진입 SNS 선택 시 "가져올 정보 공지"(이메일/전화/이름).
// - SnsInfoCard: 회원정보 스텝 상단 "카카오/구글 계정에서 가져온 정보" 안내 배너(단위2/3에서 사용).
import type { ReactNode } from "react";

export type SnsProvider = "kakao" | "naver" | "google";

function KakaoIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.7-2.5.6.1 1.3.1 2 .1 5.5 0 10-3.6 10-8S17.5 3 12 3z" /></svg>;
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-7.8z" /><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M6 14.4a6.6 6.6 0 0 1 0-4.2V7.4H2.3a11 11 0 0 0 0 9.8L6 14.4z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1 11 11 0 0 0 2.3 7.4L6 10.2c.9-2.6 3.2-4.8 6-4.8z" /></svg>
  );
}
function NaverIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.3 12.6 7.5 0H0v24h7.7V11.4L16.5 24H24V0h-7.7z" /></svg>;
}
function providerIcon(p: SnsProvider): ReactNode {
  if (p === "kakao") return <KakaoIcon />;
  if (p === "google") return <GoogleIcon />;
  return <NaverIcon />;
}
const PROVIDER_LABEL: Record<SnsProvider, string> = { kakao: "카카오", naver: "네이버", google: "구글" };

// /signup 진입: SNS 가입 시 가져올 정보 공지
export function SnsConsentCard() {
  return (
    <div className="consent-card" style={{ marginTop: 20 }}>
      <h4>SNS 가입 시 가져올 정보</h4>
      <div style={{ marginTop: 6 }}><span className="ctag">필수</span></div>
      <ol>
        <li>이메일</li>
        <li>전화번호</li>
        <li>이름</li>
      </ol>
    </div>
  );
}

// 회원정보 스텝: provider 계정에서 가져온 정보 안내 배너 (단위2/3)
export function SnsInfoCard({ provider, text }: { provider: SnsProvider; text?: string }) {
  const defaultText =
    provider === "google"
      ? "구글 계정의 이메일을 가져왔어요. 이름과 휴대폰 번호를 추가로 입력해 주세요."
      : `${PROVIDER_LABEL[provider]} 계정에서 가져온 정보입니다.`;
  return (
    <div className="sns-info-card">
      <div className="ic">{providerIcon(provider)}</div>
      <div className="text">{text ?? defaultText}</div>
    </div>
  );
}
