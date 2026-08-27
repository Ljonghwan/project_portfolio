"use client";

// 통합 검색 결과 — search-result.html 레이아웃(search-head/cat-tabs/result-group/페이저)은 유지하되,
// 보드별 결과 카드는 각 게시판 리스트 카드 컴포넌트(JobCard/ReviewCard/TalkCard/UrgentCard)로 통일(search-cards-unify, 2026-06-06).
// 키워드 하이라이트(mark)는 제거 — 제목/병원명 평문. 카드 좋아요/북마크는 각 카드 기본 동작(personal 가드) 유지.
import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import JobCard, { type JobCardData } from "@/components/JobCard";
import ReviewCard from "@/components/ReviewCard";
import TalkCard from "@/components/TalkCard";
import UrgentCard from "@/components/UrgentCard";
import {
  type Review,
  dislikeReview as apiDislikeReview,
  undislikeReview as apiUndislikeReview,
} from "@/lib/reviews";
import { type TalkPost } from "@/lib/talks";
import { type UrgentPost } from "@/lib/urgents";
import { MyListRowSkeletons } from "@/components/CardSkeletons";
import { useMinimumLoading } from "@/lib/useMinimumLoading";

type Board = "all" | "jobs" | "urgents" | "reviews" | "talks";

// 검색 응답 row — 각 카드가 필요로 하는 필드를 서버 search.ts가 채워줌.
type JobRow = {
  id: number; title: string; hospitalName: string; hospitalImages: string[] | null; region: string | null;
  workType: string; jobTypes: string[] | null;
  salaryType: string; salaryMin: number | null; salaryMax: number | null; salaryNegotiable: boolean;
  expiredAt: string | null; publishedAt: string | null; createdAt: string; bookmarked?: boolean;
};
type UrgentRow = {
  id: number; title: string; hospitalName: string; region: string | null;
  jobTypes: string[]; workTypes: string[];
  salaryType: string; salaryText: string | null; salaryAmount: number | null;
  expiredAt: string; viewCount: number; createdAt: string; bookmarked?: boolean;
};
type ReviewRow = {
  id: number; title: string; content: string; hospitalName: string; region: string; jobType: string;
  rating: number; ratingAvg: number | null; likeCount: number; dislikeCount: number; commentCount: number;
  authorAlias: string; isMine: boolean; likedByMe: boolean; dislikedByMe: boolean; createdAt: string;
};
type TalkRow = {
  id: number; title: string; content: string; images: string[]; category: string;
  likeCount: number; dislikeCount: number; commentCount: number;
  authorAlias: string; isMine: boolean; likedByMe: boolean; createdAt: string;
};

type SearchResp = {
  q: string; board: Board; page: number; pageSize: number;
  jobs: JobRow[]; urgents: UrgentRow[]; reviews: ReviewRow[]; talks: TalkRow[];
  totals: { totalJobs: number; totalUrgents: number; totalReviews: number; totalTalks: number };
};

const BOARDS: { key: Board; label: string }[] = [
  { key: "all", label: "통합" },
  { key: "jobs", label: "채용정보" },
  { key: "urgents", label: "급구게시판" },
  { key: "reviews", label: "익명 병원후기" },
  { key: "talks", label: "익명 수다방" },
];

function boardTotal(d: SearchResp, b: Board): number {
  switch (b) {
    case "jobs": return d.totals.totalJobs;
    case "urgents": return d.totals.totalUrgents;
    case "reviews": return d.totals.totalReviews;
    case "talks": return d.totals.totalTalks;
    case "all": return d.totals.totalJobs + d.totals.totalUrgents + d.totals.totalReviews + d.totals.totalTalks;
  }
}

const GROUP_ICON: Record<Exclude<Board, "all">, ReactNode> = {
  jobs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  urgents: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  reviews: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  talks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8a5 5 0 1 0-10 0v9l5-3 5 3z" /></svg>,
};
const GROUP_LABEL: Record<Exclude<Board, "all">, string> = {
  jobs: "채용정보", urgents: "급구게시판", reviews: "익명 병원후기", talks: "익명 수다방",
};
// 각 게시판 리스트 그리드 클래스를 그대로 따른다(5열 등 동일 디자인).
const GROUP_GRID: Record<Exclude<Board, "all">, string> = {
  jobs: "jobs-grid", urgents: "urgent-grid", reviews: "rv-list", talks: "cards-5",
};

function SearchEmpty() {
  return (
    <div className="search-empty" data-testid="search-empty">
      <div className="ic">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </div>
      <h4>검색 결과가 없습니다</h4>
      <p>다른 키워드로 다시 검색해보세요</p>
    </div>
  );
}

function SearchContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const { me } = useMe(false);
  const initialQ = sp.get("q") || "";
  const initialBoard = (sp.get("board") as Board) || "all";
  const initialPage = Number(sp.get("page")) || 1;

  const [q, setQ] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);
  const [board, setBoard] = useState<Board>(initialBoard);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<SearchResp | null>(null);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useMinimumLoading(loading || (submitted.length >= 2 && !data));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQ(initialQ);
    setSubmitted(initialQ);
    setBoard(initialBoard);
    setPage(initialPage);
  }, [initialQ, initialBoard, initialPage]);

  useEffect(() => {
    if (!submitted) { setData(null); setError(null); return; }
    if (submitted.length < 2) { setData(null); setError("검색어는 2자 이상 입력해 주세요."); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ q: submitted, board, page: String(page) });
      // auth=true: 토큰 동봉 시 서버가 likedByMe/bookmarked/isMine을 채워 카드 토글 상태 반영.
      const res = await api.get<SearchResp>(`/api/search?${params.toString()}`, true);
      if (!alive) return;
      if (res.success && res.data) setData(res.data);
      else setError(res.message || "검색에 실패했습니다.");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [submitted, board, page]);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) { setError("검색어는 2자 이상 입력해 주세요."); return; }
    router.push(`/search?${new URLSearchParams({ q: trimmed, board }).toString()}`);
    setSubmitted(trimmed);
    setPage(1);
  };

  const changeBoard = (b: Board) => {
    setBoard(b);
    setPage(1);
    if (submitted) router.push(`/search?${new URLSearchParams({ q: submitted, board: b }).toString()}`);
  };

  const goPage = (p: number) => {
    setPage(p);
    if (submitted) {
      const params = new URLSearchParams({ q: submitted, board });
      if (p > 1) params.set("page", String(p));
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- 카드 토글(각 게시판 페이지와 동일 패턴: optimistic + rollback) ----
  const patchBoard = (b: "jobs" | "urgents" | "reviews" | "talks", id: number, patch: Record<string, unknown>) => {
    setData((prev) => {
      if (!prev) return prev;
      const arr = (prev[b] as Array<{ id: number }>).map((it) => (it.id === id ? { ...it, ...patch } : it));
      return { ...prev, [b]: arr } as SearchResp;
    });
  };

  const requireLogin = (): boolean => {
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return false;
    }
    return true;
  };
  const guardPersonal = (): boolean => {
    if (!requireLogin()) return false;
    if (me!.userType !== "personal") { alert("개인 회원만 사용할 수 있습니다."); return false; }
    return true;
  };

  const toggleReviewLike = async (review: Review) => {
    if (!guardPersonal()) return;
    const willLike = !review.likedByMe;
    patchBoard("reviews", review.id, { likedByMe: willLike, likeCount: Math.max(0, review.likeCount + (willLike ? 1 : -1)) });
    const res = willLike
      ? await api.post(`/api/reviews/${review.id}/like`, undefined, true)
      : await api.del(`/api/reviews/${review.id}/like`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      patchBoard("reviews", review.id, { likedByMe: !willLike, likeCount: Math.max(0, review.likeCount + (willLike ? -1 : 1)) });
    }
  };

  const toggleReviewDislike = async (review: Review) => {
    if (!guardPersonal()) return;
    const willDislike = !review.dislikedByMe;
    patchBoard("reviews", review.id, { dislikedByMe: willDislike, dislikeCount: Math.max(0, review.dislikeCount + (willDislike ? 1 : -1)) });
    try {
      if (willDislike) await apiDislikeReview(review.id);
      else await apiUndislikeReview(review.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
      patchBoard("reviews", review.id, { dislikedByMe: !willDislike, dislikeCount: Math.max(0, review.dislikeCount + (willDislike ? -1 : 1)) });
    }
  };

  const toggleTalkLike = async (post: TalkPost) => {
    if (!guardPersonal()) return;
    const willLike = !post.likedByMe;
    patchBoard("talks", post.id, { likedByMe: willLike, likeCount: Math.max(0, post.likeCount + (willLike ? 1 : -1)) });
    const res = willLike
      ? await api.post(`/api/talks/${post.id}/like`, undefined, true)
      : await api.del(`/api/talks/${post.id}/like`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      patchBoard("talks", post.id, { likedByMe: !willLike, likeCount: Math.max(0, post.likeCount + (willLike ? -1 : 1)) });
    }
  };

  // 급구 북마크는 personal + corp 둘 다 허용(비로그인만 차단).
  const toggleUrgentBookmark = async (post: UrgentPost) => {
    if (!requireLogin()) return;
    const will = !post.bookmarked;
    patchBoard("urgents", post.id, { bookmarked: will });
    const res = will
      ? await api.post(`/api/urgents/${post.id}/bookmark`, undefined, true)
      : await api.del(`/api/urgents/${post.id}/bookmark`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      patchBoard("urgents", post.id, { bookmarked: !will });
    }
  };

  // 채용 스크랩은 personal 전용.
  const toggleJobBookmark = async (jobId: number, currentlyBookmarked: boolean) => {
    if (!requireLogin()) return;
    if (me!.userType === "corp") { alert("기업회원은 채용 스크랩을 사용할 수 없습니다."); return; }
    patchBoard("jobs", jobId, { bookmarked: !currentlyBookmarked });
    const res = currentlyBookmarked
      ? await api.del(`/api/jobs/${jobId}/bookmark`, true)
      : await api.post(`/api/jobs/${jobId}/bookmark`, undefined, true);
    if (!res.success) {
      alert(res.message || "스크랩 처리에 실패했습니다.");
      patchBoard("jobs", jobId, { bookmarked: currentlyBookmarked });
    }
  };

  // ---- 보드별 카드 렌더 (각 게시판 리스트 카드 컴포넌트로 통일) ----
  const renderCards = (b: Exclude<Board, "all">, limit?: number) => {
    if (!data) return null;
    if (b === "jobs") {
      const rows = limit ? data.jobs.slice(0, limit) : data.jobs;
      return (
        <div className={GROUP_GRID.jobs}>
          {rows.map((j) => <JobCard key={j.id} job={j as unknown as JobCardData} onToggleBookmark={toggleJobBookmark} />)}
        </div>
      );
    }
    if (b === "urgents") {
      const rows = limit ? data.urgents.slice(0, limit) : data.urgents;
      return (
        <div className={GROUP_GRID.urgents}>
          {rows.map((u) => <UrgentCard key={u.id} post={u as unknown as UrgentPost} onToggleBookmark={toggleUrgentBookmark} />)}
        </div>
      );
    }
    if (b === "reviews") {
      const rows = limit ? data.reviews.slice(0, limit) : data.reviews;
      return (
        <div className={GROUP_GRID.reviews}>
          {rows.map((r) => <ReviewCard key={r.id} review={r as unknown as Review} onToggleLike={toggleReviewLike} onToggleDislike={toggleReviewDislike} />)}
        </div>
      );
    }
    const rows = limit ? data.talks.slice(0, limit) : data.talks;
    return (
      <div className={GROUP_GRID.talks}>
        {rows.map((t) => <TalkCard key={t.id} post={t as unknown as TalkPost} onToggleLike={toggleTalkLike} />)}
      </div>
    );
  };

  const hasItems = (b: Exclude<Board, "all">): boolean => {
    if (!data) return false;
    return boardTotal(data, b) > 0;
  };

  const total = data ? boardTotal(data, "all") : 0;
  const totalPages = data && board !== "all" ? Math.max(1, Math.ceil(boardTotal(data, board) / data.pageSize)) : 1;

  return (
    <main className="wrap search-shell" style={{ paddingBottom: 64 }}>
      {/* 인페이지 검색 폼(헤더 검색과 별개 — /search 직접 진입/재검색용) */}
      {/* <form onSubmit={submitSearch} className="search-form" style={{ display: "flex", gap: 8, margin: "32px 0 0" }} data-testid="search-form">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="병원명, 지역, 직종, 키워드 검색" className="rv-input" style={{ flex: 1 }} data-testid="search-input" />
        <button type="submit" className="rv-submit" data-testid="search-submit">검색</button>
      </form> */}

      <div className="search-head">
        <div className="crumb"><Link href="/">홈</Link> · <b>검색 결과</b></div>
        <h2>{submitted ? <><span className="kw">{submitted}</span> 검색 결과</> : "검색"}</h2>
        {data && <div className="total">병원명, 지역, 직종, 제목 통합 결과 <b>{total.toLocaleString()}</b>건</div>}
      </div>

      {error && (
        <div style={{ padding: 16, background: "#FEE2E2", color: "#B91C1C", borderRadius: 8, margin: "16px 0" }}>{error}</div>
      )}

      {!submitted && !error && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>검색어를 입력해 주세요.</div>
      )}

      {submitted && submitted.length >= 2 && (
        <>
          <div className="cat-tabs" role="tablist">
            {BOARDS.map((b) => (
              <button key={b.key} type="button" className={board === b.key ? "on" : ""} onClick={() => changeBoard(b.key)} data-testid={`search-tab-${b.key}`}>
                {b.label}
                {data && <span className="num">{boardTotal(data, b.key).toLocaleString()}</span>}
              </button>
            ))}
          </div>

          {showSkeleton ? (
            <MyListRowSkeletons count={6} />
          ) : data ? (
            board === "all" ? (
              total === 0 ? (
                <SearchEmpty />
              ) : (
                (["jobs", "urgents", "reviews", "talks"] as const).map((b) =>
                  hasItems(b) ? (
                    <div className="result-group" key={b} data-testid={`search-section-${b}`}>
                      <div className="g-head">
                        <div className="g-title">
                          <span className="ic">{GROUP_ICON[b]}</span>
                          {GROUP_LABEL[b]}
                          <span className="cnt"><b>{boardTotal(data, b).toLocaleString()}</b>건</span>
                        </div>
                        <button type="button" className="more-link" onClick={() => changeBoard(b)} data-testid={`search-more-${b}`}>
                          더보기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                      </div>
                      {renderCards(b, 4)}
                    </div>
                  ) : null
                )
              )
            ) : (
              <div className="result-group" style={{ marginBottom: 0 }} data-testid={`search-section-${board}`}>
                <div className="g-head">
                  <div className="g-title">
                    {GROUP_LABEL[board as Exclude<Board, "all">]} 검색 결과 <span className="cnt"><b>{boardTotal(data, board).toLocaleString()}</b>건</span>
                  </div>
                </div>
                {boardTotal(data, board) === 0 ? <SearchEmpty /> : renderCards(board as Exclude<Board, "all">)}
                {totalPages > 1 && (
                  <div className="pager" style={{ marginTop: 24 }}>
                    <button type="button" disabled={page <= 1} onClick={() => goPage(page - 1)}>이전</button>
                    <span style={{ padding: "0 12px" }}>{page} / {totalPages}</span>
                    <button type="button" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>다음</button>
                  </div>
                )}
              </div>
            )
          ) : null}
        </>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="wrap" style={{ padding: 60, textAlign: "center" }}>불러오는 중…</main>}>
        <SearchContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}
