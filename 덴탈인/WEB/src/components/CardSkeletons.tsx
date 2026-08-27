"use client";

// Sprint p2-5 — 보드별 카드 형식에 1:1로 맞춘 스켈레톤.
// 각 스켈레톤은 실제 카드 컴포넌트와 "같은 컨테이너 className"을 써서 그리드/패딩/간격을 그대로 물려받고,
// 내부에 카드 요소(썸네일/제목/본문라인/메타/태그칩/별점·좋아요바 등)와 같은 위치·크기의 shimmer 박스를 둔다.
// → 데이터 도착 시 레이아웃 점프(CLS) 0, 실제 카드와 구분 안 되는 골격.
import React from "react";

// shimmer 박스 (globals.css .sk-box). 크기/모양은 inline.
function Box({ w, h, r = 6, mt, style }: { w?: number | string; h?: number | string; r?: number; mt?: number; style?: React.CSSProperties }) {
  return <span className="sk-box" style={{ display: "block", width: w, height: h, borderRadius: r, marginTop: mt, ...style }} aria-hidden="true" />;
}

/* ── 병원후기 (ReviewCard: .review-card > quote / body(3줄) / meta / loc / hosp / react) ── */
export function ReviewCardSkeleton() {
  return (
    <article className="review-card sk-card" aria-hidden="true">
      <Box w={28} h={22} r={4} />
      <div className="body" style={{ minHeight: 60, marginTop: 8 }}>
        <Box w="100%" h={12} />
        <Box w="92%" h={12} mt={8} />
        <Box w="64%" h={12} mt={8} />
      </div>
      <div className="meta" style={{ marginTop: 4 }}><Box w={96} h={12} r={4} /></div>
      <div className="loc" style={{ marginTop: 6 }}><Box w={64} h={12} r={4} /></div>
      <Box w={104} h={26} r={6} mt={14} />
      <div className="react" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2)" }}>
        <Box w={34} h={14} r={4} />
        <Box w={34} h={14} r={4} />
        <Box w={34} h={14} r={4} />
      </div>
    </article>
  );
}

/* ── 수다방 (TalkCard: .talk-card > talk-head(ava/nick/time) / cat-tag / h4 / p(3줄) / react) ── */
export function TalkCardSkeleton() {
  return (
    <article className="talk-card sk-card" aria-hidden="true">
      <div className="talk-head">
        <Box w={28} h={28} r={999} />
        <Box w={76} h={13} r={4} />
        <Box w={40} h={11} r={4} style={{ marginLeft: "auto" }} />
      </div>
      <Box w={56} h={22} r={999} />
      <Box w="85%" h={15} r={4} mt={2} />
      <div>
        <Box w="100%" h={12} />
        <Box w="95%" h={12} mt={8} />
        <Box w="60%" h={12} mt={8} />
      </div>
      <div className="react" style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--line-2)" }}>
        <Box w={34} h={14} r={4} />
        <Box w={34} h={14} r={4} />
        <Box w={48} h={14} r={4} style={{ marginLeft: "auto" }} />
      </div>
    </article>
  );
}

/* ── 급구 (UrgentCard: .urgent.with-flag > flag / bookmark / clinic / h5 / meta / loc / dday) ── */
export function UrgentCardSkeleton() {
  return (
    <article className="urgent with-flag sk-card" aria-hidden="true">
      <span className="urgent-flag" style={{ background: "var(--line-2)", color: "transparent" }}>급구</span>
      <Box w={28} h={28} r={8} style={{ position: "absolute", top: 8, right: 8 }} />
      <Box w={72} h={12} r={4} />
      <Box w="90%" h={15} r={4} mt={8} />
      <Box w="55%" h={15} r={4} mt={6} />
      <Box w={84} h={12} r={4} mt={10} />
      <Box w={60} h={12} r={4} mt={8} />
      <Box w={44} h={20} r={6} mt={12} />
    </article>
  );
}

/* ── 채용 (jobs/page 인라인 .job: .photo(120h)+bookmark / clinic / h5 / tags / loc / pay) ── */
export function JobCardSkeleton() {
  return (
    <div className="job sk-card" aria-hidden="true" style={{ padding: 0 }}>
      <div className="photo" style={{ background: "var(--line-2)" }}>
        <Box w={28} h={28} r={8} style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.6)" }} />
      </div>
      <Box w={84} h={12} r={4} style={{ margin: "14px 16px 0" }} />
      <div style={{ margin: "6px 16px 14px", minHeight: 40 }}>
        <Box w="90%" h={14} r={4} />
        <Box w="55%" h={14} r={4} mt={6} />
      </div>
      <div style={{ display: "flex", gap: 4, margin: "0 16px 10px" }}>
        <Box w={44} h={20} r={4} />
        <Box w={52} h={20} r={4} />
      </div>
      <Box w={120} h={12} r={4} style={{ margin: "0 16px 16px" }} />
      <div style={{ margin: "10px 16px 16px", paddingTop: 10, borderTop: "1px solid var(--line-2)" }}>
        <Box w={96} h={14} r={4} />
      </div>
    </div>
  );
}

/* ── 내가 쓴 글 (.post-item grid: post-cat 칩 / post-body[h4+p+meta] / post-stats) ── */
export function PostRowSkeleton() {
  return (
    <div className="post-item sk-card" aria-hidden="true" style={{ border: 'none',  }}>
      <Box w={60} h={24} r={8} />
      <div className="post-body">
        <Box w="58%" h={15} r={4} />
        <Box w="92%" h={12} r={4} mt={8} />
        <Box w={130} h={11} r={4} mt={10} />
      </div>
      <div className="post-stats" style={{ display: "flex", gap: 12 }}>
        <Box w={34} h={12} r={4} />
        <Box w={34} h={12} r={4} />
      </div>
    </div>
  );
}

/* ── 내가 쓴 댓글 (.comment-item: src-row 원글박스 + my-comment[ava-sm + body{meta+text+react}]) ── */
export function CommentRowSkeleton() {
  return (
    <article className="comment-item sk-card" aria-hidden="true">
      <div className="src-row">
        <Box w={56} h={20} r={6} />
        <Box w="50%" h={13} r={4} />
      </div>
      <div className="my-comment">
        <Box w={28} h={28} r={999} />
        <div className="body" style={{ flex: 1 }}>
          <Box w={120} h={11} r={4} />
          <Box w="85%" h={13} r={4} mt={8} />
          <Box w="55%" h={13} r={4} mt={6} />
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <Box w={32} h={12} r={4} />
            <Box w={32} h={12} r={4} />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── 마이페이지 목록 행 (post/comment 카드: 뱃지 + 제목 + 본문 + 메타) ── */
export function MyListRowSkeleton() {
  return (
    <div className="sk-myrow" aria-hidden="true" style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Box w={52} h={18} r={999} />
        <Box w={80} h={12} r={4} />
        <Box w={60} h={12} r={4} style={{ marginLeft: "auto" }} />
      </div>
      <Box w="70%" h={15} r={4} />
      <Box w="95%" h={12} r={4} mt={8} />
      <Box w="40%" h={12} r={4} mt={8} />
    </div>
  );
}

// N개 반복 헬퍼
function repeat(n: number, render: (i: number) => React.ReactNode) {
  return Array.from({ length: n }).map((_, i) => render(i));
}

export function ReviewCardSkeletons({ count = 8 }: { count?: number }) {
  return <>{repeat(count, (i) => <ReviewCardSkeleton key={i} />)}</>;
}
export function TalkCardSkeletons({ count = 10 }: { count?: number }) {
  return <>{repeat(count, (i) => <TalkCardSkeleton key={i} />)}</>;
}
export function UrgentCardSkeletons({ count = 10 }: { count?: number }) {
  return <>{repeat(count, (i) => <UrgentCardSkeleton key={i} />)}</>;
}
export function JobCardSkeletons({ count = 10 }: { count?: number }) {
  return <>{repeat(count, (i) => <JobCardSkeleton key={i} />)}</>;
}
export function MyListRowSkeletons({ count = 4 }: { count?: number }) {
  return <>{repeat(count, (i) => <MyListRowSkeleton key={i} />)}</>;
}
export function PostRowSkeletons({ count = 5 }: { count?: number }) {
  return <>{repeat(count, (i) => <PostRowSkeleton key={i} />)}</>;
}
export function CommentRowSkeletons({ count = 5 }: { count?: number }) {
  return <>{repeat(count, (i) => <CommentRowSkeleton key={i} />)}</>;
}
