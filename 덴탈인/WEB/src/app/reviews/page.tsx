"use client";

// P1-reviews FIX: sort 3-enum(latest|rating|like) + jobType multi-value 콤마 필터 + 라벨 시안 1:1.
// P1-reviews FIX 사이클 #4 (BUG-A): native <select> 3종 → `.demo-modal` 패턴 모달 3종 교체.
//   - 지역: sido/sigungu cascade + 누적 다중 체크박스
//   - 직종: 6 다중 체크박스
//   - 정렬: 3 단일 라디오
//   - rv-drop 활성 시 `.on` + 카운트 `.b` 배지, URL/직렬화는 콤마 유지.
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReviewCard from "@/components/ReviewCard";
import EmptyState from "@/components/EmptyState";
import MobileFab from "@/components/MobileFab";
import { ReviewCardSkeletons } from "@/components/CardSkeletons";
import { InlineSpinner } from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import {
  ReviewRegionModal,
  ReviewJobTypeModal,
  ReviewSortModal,
} from "@/components/ReviewFilterModal";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import {
  type Review,
  type ReviewListResponse,
  type ReviewSort,
  REVIEW_JOB_TYPE_OPTIONS,
  REVIEW_SORT_OPTIONS,
  dislikeReview as apiDislikeReview,
  undislikeReview as apiUndislikeReview,
} from "@/lib/reviews";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const JOB_TYPE_OPTION_VALUES = new Set<string>(REVIEW_JOB_TYPE_OPTIONS.map((o) => o.value));
const JOB_TYPE_OPTION_LABELS = REVIEW_JOB_TYPE_OPTIONS.reduce<Record<string, string>>(
  (acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  },
  {},
);

function isReviewSort(v: string | null): v is ReviewSort {
  return v === "latest" || v === "rating" || v === "like";
}

function ReviewsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, loading: meLoading } = useMe(false);

  const [regions, setRegions] = useState<string[]>(parseList(searchParams.get("region")));
  const [jobTypes, setJobTypes] = useState<string[]>(() =>
    parseList(searchParams.get("jobType")).filter((v) => JOB_TYPE_OPTION_VALUES.has(v)),
  );
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [keywordInput, setKeywordInput] = useState(searchParams.get("keyword") ?? "");
  const [sort, setSort] = useState<ReviewSort>(() => {
    const v = searchParams.get("sort");
    return isReviewSort(v) ? v : "latest";
  });
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useMinimumLoading(loading || !data);

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [jobTypeModalOpen, setJobTypeModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const pageSize = 20;

  const regionParam = useMemo(() => regions.join(","), [regions]);
  const jobTypeParam = useMemo(() => jobTypes.join(","), [jobTypes]);

  const buildQuery = useCallback(() => {
    const sp = new URLSearchParams();
    if (regionParam) sp.set("region", regionParam);
    if (jobTypeParam) sp.set("jobType", jobTypeParam);
    if (keyword) sp.set("keyword", keyword);
    if (sort !== "latest") sp.set("sort", sort);
    if (page > 1) sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp;
  }, [regionParam, jobTypeParam, keyword, sort, page]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const sp = buildQuery();
    const res = await api.get<ReviewListResponse>(`/api/reviews?${sp.toString()}`, !!me);
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
    if (next !== current) router.replace(`/reviews${next ? `?${next}` : ""}`, { scroll: false });
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

  const applyRegions = (next: string[]) => {
    setRegions(next);
    resetPage();
  };

  const removeRegion = (r: string) => {
    setRegions((prev) => prev.filter((x) => x !== r));
    resetPage();
  };

  const applyJobTypes = (next: string[]) => {
    setJobTypes(next.filter((v) => JOB_TYPE_OPTION_VALUES.has(v)));
    resetPage();
  };

  const removeJobType = (v: string) => {
    setJobTypes((prev) => prev.filter((x) => x !== v));
    resetPage();
  };

  const applySort = (next: ReviewSort) => {
    setSort(next);
    resetPage();
  };

  const sortLabel = useMemo(
    () => REVIEW_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "최신순",
    [sort],
  );

  const handleWriteClick = (e: React.MouseEvent) => {
    if (!me) {
      e.preventDefault();
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    if (me.userType !== "personal") {
      e.preventDefault();
      alert("개인 회원만 후기를 작성할 수 있습니다.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(keywordInput.trim());
    resetPage();
  };

  const guardPersonal = (): boolean => {
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return false;
    }
    if (me.userType !== "personal") {
      alert("개인 회원만 사용할 수 있습니다.");
      return false;
    }
    return true;
  };

  const patchReview = (id: number, patch: Partial<Review>) => {
    setData((prev) =>
      prev && {
        ...prev,
        items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      }
    );
  };

  const toggleLike = async (review: Review) => {
    if (!guardPersonal()) return;
    const willLike = !review.likedByMe;
    patchReview(review.id, {
      likedByMe: willLike,
      likeCount: Math.max(0, review.likeCount + (willLike ? 1 : -1)),
    });
    const res = willLike
      ? await api.post(`/api/reviews/${review.id}/like`, undefined, true)
      : await api.del(`/api/reviews/${review.id}/like`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      patchReview(review.id, {
        likedByMe: !willLike,
        likeCount: Math.max(0, review.likeCount + (willLike ? -1 : 1)),
      });
    }
  };

  const toggleDislike = async (review: Review) => {
    if (!guardPersonal()) return;
    const willDislike = !review.dislikedByMe;
    patchReview(review.id, {
      dislikedByMe: willDislike,
      dislikeCount: Math.max(0, review.dislikeCount + (willDislike ? 1 : -1)),
    });
    try {
      if (willDislike) await apiDislikeReview(review.id);
      else await apiUndislikeReview(review.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
      patchReview(review.id, {
        dislikedByMe: !willDislike,
        dislikeCount: Math.max(0, review.dislikeCount + (willDislike ? -1 : 1)),
      });
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        {/* M1(K2): 수다방/급구와 동일한 page-head 레이아웃(crumb + h2+전체카운트 + sub)으로 통일. 전체 N건을 타이틀 옆으로. */}
        <div className="page-head pad-top">
          <div>
            <div className="crumb">덴탈인 · 커뮤니티</div>
            <h2 style={{ margin: 0 }}>
              익명 병원 후기
              <span className="count">
                <b>{showSkeleton ? <InlineSpinner /> : (data?.total ?? 0).toLocaleString()}</b>건
              </span>
            </h2>
            <div className="sub">병원후기는 익명으로 작성되며, 작성 시 닉네임이 자동 생성됩니다.</div>
          </div>
        </div>

        <form className="rv-toolbar" onSubmit={handleSearch} style={{ marginTop: 16 }}>

          <button
            type="button"
            className={`rv-drop${regions.length > 0 ? " on" : ""}`}
            onClick={() => setRegionModalOpen(true)}
            aria-haspopup="dialog"
          >
            지역
            {regions.length > 0 && <span className="b">{regions.length}</span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className={`rv-drop${jobTypes.length > 0 ? " on" : ""}`}
            onClick={() => setJobTypeModalOpen(true)}
            aria-haspopup="dialog"
          >
            직종
            {jobTypes.length > 0 && <span className="b">{jobTypes.length}</span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className={`rv-drop rv-sort${sort !== "latest" ? " on" : ""}`}
            onClick={() => setSortModalOpen(true)}
            aria-haspopup="dialog"
          >
            {sortLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div className="rv-search">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="병원명, 제목, 본문 검색"
            />
            {keywordInput && (
              <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={() => { setKeyword(""); setKeywordInput(""); resetPage(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></svg>
              </button>
            )}
            <button className="go" type="submit" aria-label="검색">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>

          <Link href="/reviews/new" className="rv-write" onClick={handleWriteClick}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            글쓰기
          </Link>
        </form>

        <ReviewRegionModal
          open={regionModalOpen}
          onClose={() => setRegionModalOpen(false)}
          selected={regions}
          onApply={applyRegions}
        />
        <ReviewJobTypeModal
          open={jobTypeModalOpen}
          onClose={() => setJobTypeModalOpen(false)}
          selected={jobTypes}
          onApply={applyJobTypes}
        />
        <ReviewSortModal
          open={sortModalOpen}
          onClose={() => setSortModalOpen(false)}
          value={sort}
          onApply={applySort}
        />

        {(regions.length > 0 || jobTypes.length > 0 || keyword) && (
          <div className="rv-selected">
            <span className="lbl">선택됨</span>
            {regions.map((r) => (
              <span key={`r-${r}`} className="rv-pill">
                {r}
                <button
                  type="button"
                  aria-label={`${r} 해제`}
                  onClick={() => removeRegion(r)}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {jobTypes.map((v) => (
              <span key={`j-${v}`} className="rv-pill">
                {JOB_TYPE_OPTION_LABELS[v] ?? v}
                <button
                  type="button"
                  aria-label={`${JOB_TYPE_OPTION_LABELS[v] ?? v} 해제`}
                  onClick={() => removeJobType(v)}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {keyword && (
              <span className="rv-pill">
                키워드: {keyword}
                <button
                  type="button"
                  aria-label="키워드 해제"
                  onClick={() => {
                    setKeyword("");
                    setKeywordInput("");
                    resetPage();
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              className="rv-clear"
              type="button"
              onClick={() => {
                setRegions([]);
                setJobTypes([]);
                setKeyword("");
                setKeywordInput("");
                resetPage();
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              필터 초기화
            </button>
          </div>
        )}

        <div className="rv-list">
          {showSkeleton && <ReviewCardSkeletons count={6} />}
          {!showSkeleton && data && data.items.length === 0 && (
            // 빈 상태를 그리드 전체폭으로(talks/urgents와 동일 — gridColumn 1/-1).
            <div style={{ gridColumn: "1/-1" }}>
              <EmptyState
                icon="📝"
                title="아직 등록된 후기가 없습니다"
                description="첫 번째 익명 후기를 남겨 동료들에게 솔직한 정보를 공유해 보세요."
                actionLabel="후기 작성"
                actionHref="/reviews/new"
                testId="reviews-empty"
              />
            </div>
          )}
          {!showSkeleton &&
            data?.items.map((review, idx) => (
              <ReviewCard
                key={review.id}
                review={review}
                hot={idx === 0}
                onToggleLike={toggleLike}
                onToggleDislike={toggleDislike}
              />
            ))}
        </div>

        {data && data.total > 0 && (
          <div className="rv-page">
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
      <MobileFab label="후기 글쓰기" href="/reviews/new" onClick={handleWriteClick} />
      <SiteFooter />
    </>
  );
}

export default function ReviewsListPage() {
  return (
    <Suspense fallback={<div />}>
      <ReviewsListContent />
    </Suspense>
  );
}
