"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import LoadingIndicator, { InlineSpinner } from "@/components/LoadingIndicator";
import { PostRowSkeletons } from "@/components/CardSkeletons";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { useMe } from "@/lib/useMe";
import {
  getMyPosts,
  POST_BOARD_PATHS,
  type MyPostItem,
  type PostBoardType,
  type ListResponse,
} from "@/lib/postBookmarks";

const TABS: { key: PostBoardType | "all"; label: string }[] = [
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

function PostsContent() {
  const { me, loading: meLoading } = useMe(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("boardType") as PostBoardType | "all" | null;
  const currentTab: PostBoardType | "all" = tabParam &&
    ["all", "review", "talk", "urgent"].includes(tabParam) ? tabParam : "all";
  const pageParam = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(pageParam);
  const [data, setData] = useState<ListResponse<MyPostItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useMinimumLoading(loading || !data);
  const pageSize = 20;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const res = await getMyPosts(currentTab, page, pageSize);
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

  const handleTabChange = (key: PostBoardType | "all") => {
    setPage(1);
    const params = new URLSearchParams();
    if (key !== "all") params.set("boardType", key);
    router.replace(`/mypage/posts${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    const params = new URLSearchParams();
    if (currentTab !== "all") params.set("boardType", currentTab);
    if (p > 1) params.set("page", String(p));
    router.replace(`/mypage/posts${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  if (meLoading) {
    return (
      <MyPageShell me={null}>
        <LoadingIndicator />
      </MyPageShell>
    );
  }

  const total = data?.total ?? 0;
  const isCorp = me?.userType === "corp";
  const CAT_LABEL: Record<PostBoardType, string> = { review: "병원후기", talk: "익명수다방", urgent: "급구게시판" };

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head" style={{ marginBottom: 20 }}>
        <div>
          <h2>내가 쓴 글</h2>
          <div className="sub">내가 작성한 게시글을 카테고리별로 모아 볼 수 있습니다.</div>
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

      {showSkeleton && <div className="post-list"><PostRowSkeletons count={5} /></div>}

      {!showSkeleton && data && data.items.length === 0 && (
        <div className="fav-empty" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <h4>작성한 글이 없습니다.</h4>
          <p>아래 게시판에서 첫 글을 남겨보세요.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            <Link href="/reviews/new" className="go-btn">병원후기 쓰기</Link>
            <Link href="/talks/new" className="go-btn">수다방 글쓰기</Link>
            {me?.userType === "corp" && (
              <Link href="/urgents/new" className="go-btn">급구 등록</Link>
            )}
          </div>
        </div>
      )}

      {!showSkeleton && data && data.items.length > 0 && (
        <div className="post-list">
          {data.items.map((it) => {
            const detailPath = `${POST_BOARD_PATHS[it.boardType]}/${it.id}`;
            return (
              <Link key={`${it.boardType}-${it.id}`} href={detailPath} className="post-item">
                <span className={`post-cat ${it.boardType}`}>{CAT_LABEL[it.boardType]}</span>
                <div className="post-body">
                  <h4>{it.title}</h4>
                  {it.content && <p>{it.content}</p>}
                  <div className="post-meta">
                    {it.authorAlias && <span className="nick">{it.authorAlias}</span>}
                    {it.authorAlias && <span className="dot">·</span>}
                    <span>{formatDate(it.createdAt)}</span>
                  </div>
                  {isCorp && (
                    <div className="foot">
                      {it.hospitalName && <span className="hosp">{it.hospitalName}</span>}
                      {it.region && (
                        <span className="loc">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {it.region}
                        </span>
                      )}
                      <span className="react">
                        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg> {it.likeCount}</span>
                        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> {it.commentCount}</span>
                      </span>
                    </div>
                  )}
                </div>
                {!isCorp && (
                  <div className="post-stats">
                    <span className="stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                      {it.viewCount}
                    </span>
                    <span className="stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      {it.commentCount}
                    </span>
                  </div>
                )}
              </Link>
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

export default function MyPostsPage() {
  return (
    <Suspense fallback={<div />}>
      <PostsContent />
    </Suspense>
  );
}
