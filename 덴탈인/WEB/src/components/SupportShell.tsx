"use client";

// 고객센터 통합 셸 (퍼블 support-qna.html 기준) — 좌측 메뉴 3항목(공지사항/FAQ/문의하기) + 우측 콘텐츠.
// ⚠️ "내 문의 내역"은 사이드 항목이 아님 — 문의하기 페이지 내부 `.qna-tabs` 탭으로 노출(퍼블 1:1).
// cnt 배지: 공지/FAQ=공개 총개수, 문의하기=로그인 회원의 내 문의 수(비회원은 cnt 숨김).
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuthStore } from "@/stores/authStore";
import { useCountsStore } from "@/stores/countsStore";
import { listNotices, listFaqs } from "@/lib/supportFaq";

type Props = { active: "notice" | "faq" | "write"; children: React.ReactNode };

export default function SupportShell({ active, children }: Props) {
  const { isLoggedIn, hydrated } = useAuthStore();
  const counts = useCountsStore((s) => s.counts);
  const refresh = useCountsStore((s) => s.refresh);
  const pathname = usePathname();
  const [noticeCnt, setNoticeCnt] = useState<number | null>(null);
  const [faqCnt, setFaqCnt] = useState<number | null>(null);

  // 로그인 회원이면 문의 카운트 동기화(배지). 비회원은 호출 안 함.
  useEffect(() => {
    if (hydrated && isLoggedIn) void refresh();
  }, [hydrated, isLoggedIn, pathname, refresh]);

  // 공지/FAQ 공개 총개수(사이드 cnt 배지). 1회 로드.
  useEffect(() => {
    listNotices(1, 1).then((r) => { if (r.success && r.data) setNoticeCnt(r.data.total); });
    listFaqs().then((r) => { if (r.success && r.data) setFaqCnt(r.data.total ?? r.data.items.length); });
  }, []);

  const inquiries = counts?.inquiries ?? null;
  const showMember = hydrated && isLoggedIn;

  const cnt = (n: number | null) => (n != null && n > 0 ? <span className="cnt">{n}</span> : null);

  return (
    <>
      <SiteHeader />
      <main className="wrap support-layout">
        <aside className="support-side">
          <h3>고객센터</h3>
          <ul>
            <li>
              <Link href="/support/notice" className={active === "notice" ? "on" : ""}>
                공지사항{cnt(noticeCnt)}
              </Link>
            </li>
            <li>
              <Link href="/support/faq" className={active === "faq" ? "on" : ""}>
                자주 묻는 질문{cnt(faqCnt)}
              </Link>
            </li>
            <li>
              <Link href="/support/qna/new" className={active === "write" ? "on" : ""}>
                문의하기{/* 비회원은 cnt 숨김 — 회원의 내 문의 수만 노출 */}
                {showMember && cnt(inquiries)}
              </Link>
            </li>
          </ul>
        </aside>
        <section className="support-main">{children}</section>
      </main>
      <SiteFooter />
    </>
  );
}
