"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReviewForm from "@/components/ReviewForm";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { type Review } from "@/lib/reviews";

export default function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading: meLoading } = useMe(false);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (meLoading) return;
    if (!me) {
      alert("로그인이 필요합니다.");
      router.replace("/login");
      return;
    }
    if (me.userType !== "personal") {
      alert("개인 회원만 후기를 수정할 수 있습니다.");
      router.replace("/mypage");
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<Review>(`/api/reviews/${id}`, true);
      if (!alive) return;
      if (!res.success || !res.data) {
        alert(res.message || "후기를 불러올 수 없습니다.");
        router.replace("/reviews");
        return;
      }
      if (!res.data.isMine) {
        setDenied(true);
        alert("본인이 작성한 후기만 수정할 수 있습니다.");
        router.replace(`/reviews/${id}`);
        return;
      }
      setReview(res.data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, me, meLoading, router]);

  if (loading || !review || denied) {
    return (
      <>
        <SiteHeader />
        <main className="wrap"><div style={{ padding: 60, textAlign: "center" }}>확인 중…</div></main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/reviews">병원후기</Link> ·{" "}
          <Link href={`/reviews/${id}`}>상세</Link> · <b>수정</b>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 20 }}>
          병원 후기 수정
        </h1>
        <ReviewForm mode="edit" initial={review} reviewId={review.id} />
      </main>
      <SiteFooter />
    </>
  );
}
