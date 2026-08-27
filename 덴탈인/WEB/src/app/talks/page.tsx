"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TalkCard from "@/components/TalkCard";
import TalkSortModal from "@/components/TalkSortModal";
import EmptyState from "@/components/EmptyState";
import MobileFab from "@/components/MobileFab";
import { TalkCardSkeletons } from "@/components/CardSkeletons";
import { InlineSpinner } from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import {
  TALK_SORT_OPTIONS,
  type TalkPost,
  type TalkListResponse,
  type TalkSort,
} from "@/lib/talks";

function TalksListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, loading: meLoading } = useMe(false);

  const initialSort = (() => {
    const raw = searchParams.get("sort");
    if (raw === "likes" || raw === "comments") return raw;
    return "latest" as TalkSort;
  })();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [keywordInput, setKeywordInput] = useState(searchParams.get("keyword") ?? "");
  const [sort, setSort] = useState<TalkSort>(initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [data, setData] = useState<TalkListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useMinimumLoading(loading || !data);

  const pageSize = 20;

  const buildQuery = useCallback(() => {
    const sp = new URLSearchParams();
    if (keyword) sp.set("keyword", keyword);
    if (sort !== "latest") sp.set("sort", sort);
    if (page > 1) sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp;
  }, [keyword, sort, page]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const sp = buildQuery();
    const res = await api.get<TalkListResponse>(`/api/talks?${sp.toString()}`, !!me);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }, [buildQuery, me]);

  useEffect(() => {
    if (meLoading) return;
    fetchList();
  }, [fetchList, meLoading]);

  useEffect(() => {
    const sp = buildQuery();
    sp.delete("pageSize");
    const next = sp.toString();
    const current = searchParams.toString();
    if (next !== current) router.replace(`/talks${next ? `?${next}` : ""}`, { scroll: false });
  }, [buildQuery, router, searchParams]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / pageSize));
  }, [data]);

  const resetPage = () => setPage(1);
  const goPage = (p: number) => {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleWriteClick = () => {
    if (meLoading) return;
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    if (me.userType !== "personal") {
      alert("개인 회원만 글을 작성할 수 있습니다.");
      return;
    }
    router.push("/talks/new");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(keywordInput.trim().slice(0, 80));
    resetPage();
  };

  const sortLabel = useMemo(
    () => TALK_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "최신순",
    [sort]
  );

  const toggleLike = async (post: TalkPost) => {
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    if (me.userType !== "personal") {
      alert("개인 회원만 좋아요를 누를 수 있습니다.");
      return;
    }
    const willLike = !post.likedByMe;
    setData((prev) =>
      prev && {
        ...prev,
        items: prev.items.map((it) =>
          it.id === post.id
            ? {
                ...it,
                likedByMe: willLike,
                likeCount: Math.max(0, it.likeCount + (willLike ? 1 : -1)),
              }
            : it
        ),
      }
    );
    const res = willLike
      ? await api.post(`/api/talks/${post.id}/like`, undefined, true)
      : await api.del(`/api/talks/${post.id}/like`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      setData((prev) =>
        prev && {
          ...prev,
          items: prev.items.map((it) =>
            it.id === post.id
              ? {
                  ...it,
                  likedByMe: !willLike,
                  likeCount: Math.max(0, it.likeCount + (willLike ? -1 : 1)),
                }
              : it
          ),
        }
      );
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="page-head pad-top">
          <div>
            <div className="crumb">덴탈인 · 커뮤니티</div>
            <h2 style={{ margin: 0 }}>
              익명 수다방
              <span className="count">
                <b>{showSkeleton ? <InlineSpinner /> : (data?.total ?? 0).toLocaleString()}</b>건
              </span>
            </h2>
            <div className="sub">치과 종사자만 아는 그 이야기, 닉네임 없이 자유롭게 나눠요</div>
          </div>
        </div>

        <form className="talk-toolbar" onSubmit={handleSearch}>
          {/* 병원후기(.rv-search)와 동일 — 검색 아이콘이 인풋 내부 우측(.go 제출 버튼) */}
          <div className="rv-search">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="제목, 내용 검색"
              maxLength={80}
            />
            {keywordInput && (
              <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={() => { setKeyword(""); setKeywordInput(""); resetPage(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></svg>
              </button>
            )}
            <button className="go" type="submit" aria-label="검색">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </div>
          <button
            type="button"
            className={`rv-drop${sort !== "latest" ? " on" : ""}`}
            onClick={() => setSortOpen(true)}
            aria-haspopup="dialog"
          >
            {sortLabel}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button type="button" className="write" onClick={handleWriteClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            글쓰기
          </button>
        </form>

        <div className="talk-grid">
          {showSkeleton && <TalkCardSkeletons count={10} />}
          {!showSkeleton && data && data.items.length === 0 && (
            <div style={{ gridColumn: "1/-1" }}>
              <EmptyState
                icon="💬"
                title="아직 등록된 글이 없습니다"
                description="첫 번째 글을 작성해 동료 치과 종사자들과 이야기를 시작해 보세요."
                actionLabel="글쓰기"
                actionHref="/talks/new"
                testId="talks-empty"
              />
            </div>
          )}
          {!showSkeleton &&
            data?.items.map((post) => (
              <TalkCard key={post.id} post={post} onToggleLike={toggleLike} />
            ))}
        </div>

        {data && data.total > 0 && (
          <div className="pager">
            <button
              type="button"
              className="nav"
              onClick={() => goPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
              const start = Math.max(1, Math.min(totalPages - 9, page - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  type="button"
                  className={p === page ? "on" : ""}
                  onClick={() => goPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              className="nav"
              onClick={() => goPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              ›
            </button>
          </div>
        )}
      </main>
      <MobileFab label="글쓰기" onClick={handleWriteClick} />
      <SiteFooter />
      <TalkSortModal
        open={sortOpen}
        value={sort}
        onClose={() => setSortOpen(false)}
        onApply={(next) => {
          setSort(next);
          resetPage();
        }}
      />
    </>
  );
}

export default function TalksListPage() {
  return (
    <Suspense fallback={<div />}>
      <TalksListContent />
    </Suspense>
  );
}
