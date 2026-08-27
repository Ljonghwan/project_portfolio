"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import UrgentForm from "@/components/UrgentForm";
import { useMe } from "@/lib/useMe";
import { normalizeSido } from "@/stores/regionStore";

export default function NewUrgentPage() {
  const router = useRouter();
  const { me, loading } = useMe(true);

  useEffect(() => {
    if (loading || !me) return;
    // F-C item7: 개인·기업 모두 급구 등록 가능. 사업자등록증 가드는 기업에만(개인 면제).
    if (me.userType === "corp" && !me.corpProfile?.businessLicenseImageUrl) {
      alert("사업자등록증을 먼저 등록해 주세요. (마이페이지 → 병원정보)");
      router.replace("/mypage/extra");
    }
  }, [me, loading, router]);

  if (loading || !me) {
    return (
      <>
        <SiteHeader />
        <main className="wrap"><div style={{ padding: 60, textAlign: "center" }}>불러오는 중…</div></main>
        <SiteFooter />
      </>
    );
  }

  // F-B item2: 본인 추가정보(corpProfile)를 급구 폼 기본값으로 prefill (병원명/근무지=병원주소).
  const cp = me.corpProfile;
  const corpInitial = cp
    ? {
        hospitalName: cp.hospitalName || "",
        // F-B fix: region을 보드 표준 짧은 키로 정규화(normalizeSido) — UrgentCard 노출 형식을 주소검색 결과와 통일.
        region: cp.hospitalAddress ? normalizeSido(cp.hospitalAddress.trim().split(/\s+/)[0] || "") : "",
        address: cp.hospitalAddress || "",
        addressDetail: cp.hospitalDetailAddress || "",
      }
    : undefined;

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          급구 게시판 · <b>새 글 작성</b>
        </div>
        <UrgentForm mode="create" initial={corpInitial} />
      </main>
      <SiteFooter />
    </>
  );
}
