"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useCountsStore } from "@/stores/countsStore";
import type { Me } from "@/lib/useMe";

// 시안 mp-profile 인증 체크 배지 svg
function VerifyBadge() {
  return (
    <span className="verify">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7" />
      </svg>
    </span>
  );
}

function MpMenu({ me }: { me: Me }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "";
  const isCorp = me.userType === "corp";
  // msg-g2 항목7: 사이드바 카운트는 전역 store. 액션(삭제/마감/공개/즐겨찾기 해제) 후 refresh()로 즉시 동기화.
  const counts = useCountsStore((s) => s.counts);
  const refresh = useCountsStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  // 채용 목록 탭 활성: /mypage/jobs + ?tab= 기준
  const jobsListActive = pathname === "/mypage/jobs";
  const num = (n: number | undefined) => (counts != null && n != null ? <span className="num">{n}</span> : null);

  return (
    <nav className="mp-menu">
      <div className="group">계정 관리</div>
      <Link href="/mypage" className={pathname === "/mypage" ? "active" : ""}>마이페이지 홈</Link>
      <Link href="/mypage/info" className={pathname === "/mypage/info" ? "active" : ""}>내 정보</Link>
      <Link href="/mypage/extra" className={pathname === "/mypage/extra" ? "active" : ""}>추가 정보</Link>
      <hr />

      <div className="group">채용 관리</div>
      <Link href="/mypage/jobs/new" className={pathname === "/mypage/jobs/new" ? "active" : ""}>채용 공고 등록</Link>
      <Link href="/mypage/jobs?tab=active" className={jobsListActive && tab !== "closed" && tab !== "draft" ? "active" : ""}>
        진행중 채용 {num(counts?.jobsActive)}
      </Link>
      <Link href="/mypage/jobs?tab=closed" className={jobsListActive && tab === "closed" ? "active" : ""}>
        마감된 채용 {num(counts?.jobsClosed)}
      </Link>
      <Link href="/mypage/jobs?tab=draft" className={jobsListActive && tab === "draft" ? "active" : ""}>
        임시저장 {num(counts?.jobsDraft)}
      </Link>
      <hr />

      <div className="group">활동</div>
      {!isCorp && (
        <Link href="/mypage/favorites" className={pathname?.startsWith("/mypage/favorites") ? "active" : ""}>
          즐겨찾기 {num(counts?.favorites)}
        </Link>
      )}
      {/* p2-cleanup #4: "지원한 공고" 메뉴 제거 — 지원 기능 전면 제거(접수는 외부 이메일/전화) */}
      <Link href="/mypage/posts" className={pathname?.startsWith("/mypage/posts") ? "active" : ""}>
        내가 쓴 글 {num(counts?.posts)}
      </Link>
      <Link href="/mypage/comments" className={pathname?.startsWith("/mypage/comments") ? "active" : ""}>
        내가 쓴 댓글 {num(counts?.comments)}
      </Link>
      {/* 나의 문의 = 고객센터 문의하기의 '내 문의 내역' 탭(퍼블 support-qna.html) */}
      {/* 나의 문의는 고객센터(/support/qna/new?tab=my)로 이동 — MyPageShell은 /mypage/*에서만 렌더되어 active 불가(조건 제거) */}
      <Link href="/support/qna/new?tab=my">나의 문의</Link>
      <hr />

      <Link href="/mypage/leave" className={`danger${pathname === "/mypage/leave" ? " active" : ""}`}>회원 탈퇴</Link>
    </nav>
  );
}

export default function MyPageShell({ me, children }: { me: Me | null; children: React.ReactNode }) {
  const router = useRouter();
  const isCorp = me?.userType === "corp";
  const initial = me?.name?.slice(0, 1) || "?";
  // p2-mypage-g1-sidebar-badge(PM=A): hero ava-xl과 동일 소스(licenseStatus==='verified')일 때만 인증 체크배지 노출.
  const verified = me?.licenseStatus === "verified";

  async function logout() {
    // F12: 로그아웃 API가 실패/지연해도 클라 상태는 반드시 비운다(헤더 로그인정보 잔존 방지).
    //      구: await가 throw하면 clearAuth/redirect 미실행 → 로그아웃 무동작처럼 보임.
    try {
      await api.post("/api/auth/logout", undefined, true);
    } catch {
      /* 서버 실패와 무관하게 클라 세션 종료 */
    }
    useAuthStore.getState().clearAuth();
    router.replace("/login");
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="mp-layout">
          <aside className="mp-sidebar">
            <div className="mp-profile">
              {/* F10: 프로필 사진 있으면 이미지, 없으면 이니셜 */}
              <div className="ava">
                {me?.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.profileImageUrl} alt="" className="ava-img" />
                ) : initial}
                {verified && <VerifyBadge />}
              </div>
              <div className="name">{me?.name || "사용자"}</div>
              <div className="email">{me?.email}</div>
              <span className="role">{isCorp ? "기업회원" : "개인회원"}</span>
              <button type="button" className="logout" onClick={logout}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                로그아웃
              </button>
            </div>
            {me && (
              <Suspense fallback={<nav className="mp-menu" />}>
                <MpMenu me={me} />
              </Suspense>
            )}
          </aside>
          <section className="mp-content">{children}</section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
