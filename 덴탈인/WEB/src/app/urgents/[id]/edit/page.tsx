"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import UrgentForm from "@/components/UrgentForm";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import type { UrgentFormInput, UrgentPost } from "@/lib/urgents";

export default function EditUrgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading: meLoading } = useMe(true);
  const [initial, setInitial] = useState<UrgentFormInput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meLoading || !me) return;
    // F-C item7: 개인·기업 모두 작성 가능 → 소유 검증은 isMine(아래)로. userType 가드 제거.
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<UrgentPost>(`/api/urgents/${id}`, true);
      if (!alive) return;
      if (!res.success || !res.data) {
        alert(res.message || "공고를 찾을 수 없습니다.");
        router.replace("/urgents");
        return;
      }
      if (!res.data.isMine) {
        alert("본인 공고만 수정할 수 있습니다.");
        router.replace(`/urgents/${id}`);
        return;
      }
      const p = res.data;
      setInitial({
        hospitalName: p.hospitalName,
        title: p.title,
        region: p.region,
        address: p.address,
        addressDetail: p.addressDetail,
        jobTypes: p.jobTypes,
        workTypes: p.workTypes,
        headcount: p.headcount,
        salaryType: p.salaryType,
        salaryAmount: p.salaryAmount,
        workHours: p.workHours,
        contactPhone: p.contactPhone,
        content: p.content,
        images: p.images,
        expiredAt: p.expiredAt,
      });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, me, meLoading, router]);

  if (meLoading || !me || loading || !initial) {
    return (
      <>
        <SiteHeader />
        <main className="wrap"><div style={{ padding: 60, textAlign: "center" }}>불러오는 중…</div></main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          급구 게시판 · <b>수정</b>
        </div>
        <UrgentForm mode="edit" postId={Number(id)} initial={initial} />
      </main>
      <SiteFooter />
    </>
  );
}
