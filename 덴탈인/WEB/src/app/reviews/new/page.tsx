"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReviewForm from "@/components/ReviewForm";
import { useMe } from "@/lib/useMe";

export default function NewReviewPage() {
  const router = useRouter();
  const { me, loading } = useMe(false);

  useEffect(() => {
    if (loading) return;
    if (!me) {
      alert("로그인이 필요합니다.");
      router.replace("/login");
      return;
    }
    if (me.userType !== "personal") {
      alert("개인 회원만 후기를 작성할 수 있습니다.");
      router.replace("/mypage");
    }
  }, [me, loading, router]);

  if (loading || !me || me.userType !== "personal") {
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
          <Link href="/">홈</Link> · <Link href="/reviews">병원후기</Link> · <b>새 후기</b>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 20 }}>
          병원 후기 작성
        </h1>
        <ReviewForm mode="create" />
      </main>
      <SiteFooter />
    </>
  );
}
