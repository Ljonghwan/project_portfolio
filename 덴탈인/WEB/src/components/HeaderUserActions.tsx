"use client";

// Sprint p2-2 작업 3 — 헤더 로그인/로그아웃 영역. authStore(zustand persist) 구독.
// 새로고침 시 /api/users/me를 기다리지 않고 localStorage 복원값으로 즉시 올바른 버튼을 그린다.
// hydrated 게이트로 SSR/CSR 첫 렌더를 동일(skeleton)하게 맞춰 hydration mismatch를 피하고,
// mount 직후 persist 복원값으로 실제 버튼을 표시한다(API 대기로 인한 버튼 교체 없음).
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import NotificationBell from "./NotificationBell";

export default function HeaderUserActions() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // H2(G7): 헤더 로그아웃 버튼 제거 — 로그아웃은 마이페이지에서. (router/api/clearAuth 미사용 제거)

  // SSR + 클라 첫 렌더 공통 placeholder — hydration mismatch 방지(레이아웃 시프트 없는 고정 폭).
  if (!hydrated) {
    return (
      <>
        <span className="ghost" aria-hidden="true" style={{ visibility: "hidden" }}>
          <span className="head-name">로그인 / 회원가입</span>
        </span>
        <Link href="/login" className="cta">
          채용 등록
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </>
    );
  }

  const loggedIn = isLoggedIn && user;

  return (
    <>
      {loggedIn ? (
        <>
          {/* p2-notifications: 로그인 사용자(개인+기업) 공통 실 알림 벨 + unread badge + 드롭다운 */}
          <NotificationBell />
          {/* H5(G7): 알림 우측 프로필(아바타) 버튼 → /mypage. 모바일은 아바타만(name/role CSS 숨김). */}
          <Link href="/mypage" className={`user-chip${user.userType === "corp" ? " corp" : ""}`}>
            <span className="name">
              <b>{user.name || "회원"}</b>님
            </span>
            <span className="role">{user.userType === "corp" ? "기업" : "회원"}</span>
            {/* F10: 프로필 사진 있으면 이미지, 없으면 이니셜 */}
            <span className="ava">
              {user.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImageUrl} alt="" className="ava-img" />
              ) : (
                (user.name || "?").slice(0, 1)
              )}
            </span>
          </Link>
        </>
      ) : (
        <Link href="/login" className="ghost">
          <span className="ava">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </span>
          <span className="head-name">로그인 / 회원가입</span>
        </Link>
      )}
      {/* p2-7: 개인/기업 모두 공고 등록 가능 → 로그인 사용자는 등록 화면, 비로그인만 /login */}
      <Link href={loggedIn ? "/mypage/jobs/new" : "/login"} className="cta">
        채용 등록
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </>
  );
}
