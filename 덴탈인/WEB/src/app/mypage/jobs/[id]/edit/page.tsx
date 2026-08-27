"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import JobPostForm from "@/components/JobPostForm";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMe } from "@/lib/useMe";
import { api } from "@/lib/api";
import { JobPost } from "@/lib/jobs";

export default function EditJobPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading } = useMe(true);
  const [job, setJob] = useState<JobPost | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // p2-7: 채용공고는 personal/corp 모두 작성 → 역할 가드 제거. owner 검증(아래)으로 통제.

  useEffect(() => {
    let alive = true;
    (async () => {
      setJobLoading(true);
      const res = await api.get<JobPost>(`/api/jobs/${id}`, true);
      if (!alive) return;
      if (res.success && res.data) {
        setJob(res.data);
      } else {
        setError(res.message || "공고를 찾을 수 없습니다.");
      }
      setJobLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (job && me && job.corpUserId !== me.id) {
      alert("본인 공고만 수정할 수 있습니다.");
      router.replace("/mypage/jobs");
    }
  }, [job, me, router]);

  if (loading || jobLoading || !me) {
    return (
      <MyPageShell me={null}>
        <LoadingIndicator />
      </MyPageShell>
    );
  }

  if (error || !job) {
    return (
      <MyPageShell me={me}>
        <div className="mypage-card">
          <p style={{ color: "var(--accent,#FB7185)" }}>{error || "공고를 불러올 수 없습니다."}</p>
        </div>
      </MyPageShell>
    );
  }

  return (
    <MyPageShell me={me}>
      <JobPostForm mode="edit" jobId={job.id} initial={job} />
    </MyPageShell>
  );
}
