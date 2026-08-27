"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import UrgentCard from "@/components/UrgentCard";
import EmptyState from "@/components/EmptyState";
import MobileFab from "@/components/MobileFab";
import { UrgentCardSkeletons } from "@/components/CardSkeletons";
import { InlineSpinner } from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import UrgentSortModal from "@/components/UrgentSortModal";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import {
  URGENT_SORT_OPTIONS,
  type UrgentListResponse,
  type UrgentPost,
  type UrgentSort,
} from "@/lib/urgents";

function UrgentsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, loading: meLoading } = useMe(false);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [keywordInput, setKeywordInput] = useState(searchParams.get("keyword") ?? "");
  const [sort, setSort] = useState<UrgentSort>(
    (URGENT_SORT_OPTIONS.find((o) => o.value === searchParams.get("sort"))?.value as UrgentSort) ?? "latest"
  );
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [data, setData] = useState<UrgentListResponse | null>(null);
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
    const res = await api.get<UrgentListResponse>(`/api/urgents?${sp.toString()}`, !!me);
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
    if (next !== current) router.replace(`/urgents${next ? `?${next}` : ""}`, { scroll: false });
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
    // N-A item4(F-C 잔여): 개인·기업 모두 급구 등록 가능 → corp 전용 가드/alert 제거.
    router.push("/urgents/new");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(keywordInput.trim().slice(0, 80));
    resetPage();
  };

  const toggleBookmark = async (post: UrgentPost) => {
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    const willOn = !post.bookmarked;
    setData((prev) =>
      prev && {
        ...prev,
        items: prev.items.map((it) =>
          it.id === post.id
            ? {
                ...it,
                bookmarked: willOn,
                bookmarkCount: Math.max(0, it.bookmarkCount + (willOn ? 1 : -1)),
              }
            : it
        ),
      }
    );
    const res = willOn
      ? await api.post(`/api/urgents/${post.id}/bookmark`, undefined, true)
      : await api.del(`/api/urgents/${post.id}/bookmark`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      setData((prev) =>
        prev && {
          ...prev,
          items: prev.items.map((it) =>
            it.id === post.id
              ? {
                  ...it,
                  bookmarked: !willOn,
                  bookmarkCount: Math.max(0, it.bookmarkCount + (willOn ? -1 : 1)),
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
            <div className="crumb">덴탈인 · 채용</div>
            <h2 style={{ margin: 0 }}>
              급구 게시판
              <span className="count">
                <b>{showSkeleton ? <InlineSpinner /> : (data?.total ?? 0).toLocaleString()}</b>건
              </span>
            </h2>
            <div className="sub">지금 당장 사람이 필요한 병원의 급한 공고예요. 빠르게 매칭해 드릴게요.</div>
          </div>
        </div>

        <form className="urgent-toolbar" onSubmit={handleSearch}>
          {/* 병원후기(.rv-search)와 동일 — 검색 아이콘이 인풋 내부 우측(.go 제출 버튼) */}
          <div className="rv-search">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="제목, 내용 검색"
              maxLength={80}
              suppressHydrationWarning
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
          {/* G1 F4: 정렬 버튼을 수다방(talks)과 동일한 `rv-drop` 마크업으로 통일 — 구 `.sort` 레이아웃 깨짐 해소. */}
          <button
            type="button"
            className={`rv-drop${sort !== "latest" ? " on" : ""}`}
            onClick={() => setSortOpen(true)}
            aria-haspopup="dialog"
          >
            {URGENT_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "최신순"}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button type="button" className="write" onClick={handleWriteClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            급구 등록
          </button>
        </form>

        <UrgentSortModal
          open={sortOpen}
          value={sort}
          onClose={() => setSortOpen(false)}
          onApply={(next) => {
            setSort(next);
            resetPage();
          }}
        />

        <div className="urgent-grid">
          {showSkeleton && <UrgentCardSkeletons count={10} />}
          {!showSkeleton && data && data.items.length === 0 && (
            <div style={{ gridColumn: "1/-1" }}>
              <EmptyState
                icon="🚨"
                title="아직 등록된 급구 공고가 없습니다"
                description="단기·긴급 채용 공고가 올라오면 이곳에서 D-Day와 함께 한눈에 확인할 수 있습니다."
                testId="urgents-empty"
              />
            </div>
          )}
          {!showSkeleton &&
            data?.items.map((post) => (
              <UrgentCard key={post.id} post={post} onToggleBookmark={toggleBookmark} />
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
      <MobileFab label="급구 등록" onClick={handleWriteClick} />
      <SiteFooter />
    </>
  );
}

export default function UrgentsListPage() {
  return (
    <Suspense fallback={<div />}>
      <UrgentsListContent />
    </Suspense>
  );
}
