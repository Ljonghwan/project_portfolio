"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import LoadingIndicator, { InlineSpinner } from "@/components/LoadingIndicator";
import { CommentRowSkeletons } from "@/components/CardSkeletons";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { useMe } from "@/lib/useMe";
import {
  getMyComments,
  type CommentBoardType,
  type MyCommentItem,
  type MyCommentListResponse,
} from "@/lib/comments";
import { POST_BOARD_PATHS } from "@/lib/postBookmarks";

const TABS: { key: CommentBoardType | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "review", label: "병원후기" },
  { key: "talk", label: "수다방" },
  { key: "urgent", label: "급구" },
];

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${da}`;
}

function CommentsContent() {
  const { me, loading: meLoading } = useMe(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("boardType") as CommentBoardType | "all" | null;
  const currentTab: CommentBoardType | "all" =
    tabParam && ["all", "review", "talk", "urgent"].includes(tabParam) ? tabParam : "all";
  const pageParam = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(pageParam);
  const [data, setData] = useState<MyCommentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useMinimumLoading(loading || !data);
  const pageSize = 20;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const res = await getMyComments(currentTab, page, pageSize);
    if (res.success && res.data) setData(res.data);
    else setData({ items: [], total: 0, page, pageSize });
    setLoading(false);
  }, [currentTab, page]);

  useEffect(() => {
    if (meLoading) return;
    fetchList();
  }, [meLoading, fetchList]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / pageSize));
  }, [data]);

  const handleTabChange = (key: CommentBoardType | "all") => {
    setPage(1);
    const params = new URLSearchParams();
    if (key !== "all") params.set("boardType", key);
    router.replace(`/mypage/comments${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    const params = new URLSearchParams();
    if (currentTab !== "all") params.set("boardType", currentTab);
    if (p > 1) params.set("page", String(p));
    router.replace(`/mypage/comments${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  if (meLoading) {
    return (
      <MyPageShell me={null}>
        <LoadingIndicator />
      </MyPageShell>
    );
  }

  const total = data?.total ?? 0;
  const CAT_LABEL: Record<CommentBoardType, string> = { review: "병원후기", talk: "익명수다방", urgent: "급구게시판" };
  const initial = me?.name?.slice(0, 1) || "?";

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>내가 쓴 댓글</h2>
          <div className="sub">내가 작성한 댓글과 원본 글을 함께 확인할 수 있습니다.</div>
        </div>
      </div>

      <div className="post-tabs" role="tablist">
        {TABS.map((t) => {
          const c = data?.counts?.[t.key];
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              className={currentTab === t.key ? "on" : ""}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
              {c != null && <span style={{ marginLeft: 4, fontVariantNumeric: "tabular-nums", fontWeight: currentTab === t.key ? 800 : 600, opacity: currentTab === t.key ? 1 : 0.7 }}>{c}</span>}
            </button>
          );
        })}
        <span className="count">총 <b>{showSkeleton ? <InlineSpinner /> : total}</b>개</span>
      </div>

      {showSkeleton && <div className="comment-list" style={{ marginTop: 14 }}><CommentRowSkeletons count={5} /></div>}

      {!showSkeleton && data && data.items.length === 0 && (
        <div className="fav-empty" style={{ marginTop: 14 }}>
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h4>작성한 댓글이 없습니다.</h4>
          <p>아래 게시판에 들어가 첫 댓글을 남겨보세요.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            <Link href="/reviews" className="go-btn">병원후기</Link>
            <Link href="/talks" className="go-btn">수다방</Link>
            <Link href="/urgents" className="go-btn">급구</Link>
          </div>
        </div>
      )}

      {!showSkeleton && data && data.items.length > 0 && (
        <div className="comment-list" style={{ marginTop: 14 }}>
          {data.items.map((it) => {
            const detailPath = `${POST_BOARD_PATHS[it.boardType]}/${it.boardId}`;
            const srcInner = (
              <>
                <span className={`src-cat ${it.boardType}`}>{CAT_LABEL[it.boardType]}</span>
                <span className="src-title">
                  {it.boardAvailable ? (it.boardTitle || "원글 보기") : "원글이 삭제되었습니다."}
                </span>
                <span className="src-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
              </>
            );
            return (
              <article key={`${it.boardType}-${it.id}`} className={`comment-item ${it.boardAvailable ? "" : "deleted"}`}>
                {it.boardAvailable ? (
                  <Link href={detailPath} className="src-row">{srcInner}</Link>
                ) : (
                  <div className="src-row dead">{srcInner}</div>
                )}
                <div className="my-comment">
                  <div className="ava-sm">{initial}</div>
                  <div className="body">
                    <div className="meta">
                      <span className="nick">{me?.name || "나"}</span>
                      <span className="dot">·</span>
                      <span>{formatDate(it.createdAt)}</span>
                      {it.parentId && <><span className="dot">·</span><span>답글</span></>}
                    </div>
                    <p className="text">{it.content}</p>
                    <div className="react">
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" /><line x1="7" y1="22" x2="7" y2="11" /></svg>
                        {it.likeCount}
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        {it.replyCount}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {data && data.total > pageSize && (
        <div className="pager" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="nav"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
            const start = Math.max(1, Math.min(totalPages - 9, page - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button key={p} type="button" className={p === page ? "on" : ""} onClick={() => handlePageChange(p)}>
                {p}
              </button>
            );
          })}
          <button
            type="button"
            className="nav"
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            ›
          </button>
        </div>
      )}
    </MyPageShell>
  );
}

export default function MyCommentsPage() {
  return (
    <Suspense fallback={<div />}>
      <CommentsContent />
    </Suspense>
  );
}
