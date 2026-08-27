"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import JobPostForm from "@/components/JobPostForm";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMe } from "@/lib/useMe";
import { api } from "@/lib/api";
import { JobPost } from "@/lib/jobs";

function NewJobPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");
  const { me, loading } = useMe(true);
  const [source, setSource] = useState<JobPost | null>(null);
  const [sourceLoading, setSourceLoading] = useState<boolean>(!!fromId);

  // p2-7: 채용공고는 personal/corp 모두 등록 가능 → 진입 가드 제거.
  // corp 사업자등록증 가드는 서버가 강제(BUSINESS_LICENSE_REQUIRED → 폼에서 alert + /mypage/extra). 개인은 면제.

  useEffect(() => {
    if (!fromId) {
      setSourceLoading(false);
      return;
    }
    if (loading || !me) return;
    let alive = true;
    (async () => {
      setSourceLoading(true);
      const res = await api.get<JobPost>(`/api/jobs/${fromId}`, true);
      if (!alive) return;
      if (!res.success || !res.data) {
        alert(res.message || "복사할 공고를 찾을 수 없습니다.");
        router.replace("/mypage/jobs");
        return;
      }
      if (res.data.corpUserId !== me.id) {
        alert("본인 공고만 복사할 수 있습니다.");
        router.replace("/mypage/jobs");
        return;
      }
      setSource({ ...res.data, title: `${res.data.title} (복사)` });
      setSourceLoading(false);
    })();
    return () => { alive = false; };
  }, [fromId, loading, me, router]);

  if (loading || !me || sourceLoading) {
    return (
      <MyPageShell me={null}>
        <LoadingIndicator />
      </MyPageShell>
    );
  }

  return (
    <MyPageShell me={me}>
      <JobPostForm mode="create" initial={source ?? undefined} />
    </MyPageShell>
  );
}

export default function NewJobPostPage() {
  return (
    <Suspense
      fallback={
        <MyPageShell me={null}>
          <LoadingIndicator />
        </MyPageShell>
      }
    >
      <NewJobPostContent />
    </Suspense>
  );
}
