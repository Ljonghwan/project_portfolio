"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { api } from "@/lib/api";

// p2-mypage-g5 1-C: 약관 본문은 admin WYSIWYG HTML(서버 sanitizeRichHtml 저장) → DOMPurify 2차 방어 후 렌더.
const TERMS_TITLES: Record<string, string> = {
  service: "이용약관",
  privacy: "개인정보처리방침",
  marketing: "마케팅 수신동의",
  thirdParty: "제3자 정보제공",
  withdrawal: "회원탈퇴 약관",
};
const TERMS_KEYS = ["service", "privacy", "marketing", "thirdParty", "withdrawal"];

interface TermsData {
  id: number;
  type: string;
  version: string;
  title: string;
  content: string;
  effectiveAt: string;
  updatedAt: string;
}

const SERVICE_FALLBACK = `본 약관은 덴탈인(이하 "회사")이 운영하는 치과 구인구직 및 익명 커뮤니티 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정합니다.

제1조 (목적)
이 약관은 회사가 제공하는 서비스의 이용조건과 절차, 회원과 회사의 권리·의무·책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
"회원"이란 본 약관에 동의하고 회사가 정한 절차에 따라 가입하여 서비스를 이용하는 자를 말합니다. "개인회원"은 치과 종사자 또는 취업희망자를, "기업회원"은 병원 운영자 또는 채용 담당자를 의미합니다.

제3조 (회원가입)
회원가입은 이용자가 약관 내용에 동의하고 회사가 정한 가입 양식에 정보를 기입한 후 가입신청을 하는 방식으로 이루어집니다.

제4조 (개인정보 보호)
회사는 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 수집·이용·제공·관리에 관한 사항은 별도의 개인정보처리방침에 따릅니다.

제5조 (회원의 의무)
회원은 관계 법령과 본 약관, 회사가 통지하는 사항을 준수해야 하며, 타인의 권리를 침해하거나 명예를 손상시키는 행위를 해서는 안 됩니다.

제6조 (서비스의 변경 및 중단)
회사는 운영상·기술상 필요에 따라 제공하는 서비스의 일부 또는 전부를 변경하거나 중단할 수 있습니다.

제7조 (이용계약의 해지)
회원은 언제든지 마이페이지의 회원탈퇴를 통해 이용계약을 해지할 수 있으며, 회사는 관련 법령이 정한 기간 동안 일부 정보를 보관할 수 있습니다.`;

const PRIVACY_FALLBACK = `덴탈인(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
이메일, 비밀번호, 이름, 휴대폰번호, 직종, 면허번호, 면허증 이미지, 사업자등록번호 등.

2. 개인정보의 수집·이용 목적
회원 가입 및 관리, 서비스 제공, 본인 확인, 채용 매칭 등.

3. 개인정보의 보유 및 이용 기간
회원 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에서 정한 보유기간 동안 별도 보관합니다.`;

function TermsBody() {
  const search = useSearchParams();
  const rawType = (search.get("type") || "service");
  const type = TERMS_KEYS.includes(rawType) ? rawType : "service";

  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTerms(null);
    (async () => {
      const res = await api.get<TermsData>(`/api/terms?type=${type}`);
      if (res.success && res.data) setTerms(res.data);
      setLoading(false);
    })();
  }, [type]);

  const defaultTitle = TERMS_TITLES[type] || "약관";
  // service/privacy만 정적 fallback 보유. 그 외(marketing/thirdParty/withdrawal)는 등록 전 안내.
  const fallback = type === "privacy" ? PRIVACY_FALLBACK : type === "service" ? SERVICE_FALLBACK : null;

  return (
    <main className="wrap">
      <div className="terms-page">
        <h1>{terms?.title || defaultTitle}</h1>
        {terms && (
          <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: -8 }}>
            버전 {terms.version} · 시행일 {new Date(terms.effectiveAt).toLocaleDateString("ko-KR")}
          </p>
        )}
        {loading ? (
          <p style={{ color: "var(--ink-3)" }}>약관을 불러오는 중...</p>
        ) : terms?.content ? (
          <div
            style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)" }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(terms.content) }}
          />
        ) : fallback ? (
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
            {fallback}
          </pre>
        ) : (
          <p style={{ color: "var(--ink-3)" }}>등록된 약관이 없습니다.</p>
        )}
      </div>
    </main>
  );
}

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="wrap"><div className="terms-page"><p style={{ color: "var(--ink-3)" }}>불러오는 중...</p></div></main>}>
        <TermsBody />
      </Suspense>
      <SiteFooter />
    </>
  );
}
