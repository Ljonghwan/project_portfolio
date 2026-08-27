"use client";

// F-B item4: 즐겨찾기는 채용공고 + 급구만 노출(후기/수다방 탭 제거). item7: 급구는 UrgentCard로 통일. item8: 탭별 스켈레톤.
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import LoadingIndicator, { InlineSpinner } from "@/components/LoadingIndicator";
import { JobCardSkeletons, UrgentCardSkeletons } from "@/components/CardSkeletons";
import UrgentCard from "@/components/UrgentCard";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { useMe } from "@/lib/useMe";
import { api } from "@/lib/api";
import { useCountsStore } from "@/stores/countsStore";
import {
  BookmarkedJobItem,
  AVAILABILITY_LABELS,
  WORK_TYPE_LABELS,
  WORK_TYPE_CLASSES,
  JOB_DUTY_TYPE_LABELS,
  formatSalary,
} from "@/lib/jobs";
import type { UrgentPost } from "@/lib/urgents";
import {
  getMyBookmarkedPosts,
  unbookmarkPost,
  POST_BOARD_PATHS,
  type BookmarkedPostItem,
  type ListResponse,
  type PostBoardType,
} from "@/lib/postBookmarks";

type JobsListData = { items: BookmarkedJobItem[]; total: number; page: number; pageSize: number };

type TabKey = "jobs" | "urgents";

const TABS: { key: TabKey; label: string }[] = [
  { key: "jobs", label: "채용 공고" },
  { key: "urgents", label: "급구" },
];

const TAB_TO_BOARD: Record<Exclude<TabKey, "jobs">, PostBoardType> = {
  urgents: "urgent",
};

// BookmarkedPostItem.post(급구) → UrgentCard용 UrgentPost 어댑터(즐겨찾기는 항상 bookmarked=true).
function toUrgentPost(p: NonNullable<BookmarkedPostItem["post"]>): UrgentPost {
  return {
    id: p.id,
    hospitalName: p.hospitalName ?? "",
    title: p.title,
    region: p.region ?? "",
    jobTypes: (p.jobTypes ?? []) as UrgentPost["jobTypes"],
    workTypes: (p.workTypes ?? []) as UrgentPost["workTypes"],
    expiredAt: p.expiredAt ?? "",
    bookmarked: true,
  } as UrgentPost;
}

function FavoritesContent() {
  const { me, loading: meLoading } = useMe(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab") || "jobs";
  const tabParam = rawTab as TabKey;
  const validTab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam : "jobs";
  const currentTab = validTab;
  const pageParam = Number(searchParams.get("page") || 1);

  // P1-reviews FIX 사이클 #4 (BUG-H): 구 ?tab=hospitals 링크는 ?tab=jobs로 정리.
  useEffect(() => {
    if (rawTab === "hospitals") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "jobs");
      params.delete("page");
      router.replace(`/mypage/favorites?${params.toString()}`, { scroll: false });
    }
  }, [rawTab, router, searchParams]);

  const [jobsData, setJobsData] = useState<JobsListData | null>(null);
  const [postsData, setPostsData] = useState<ListResponse<BookmarkedPostItem> | null>(null);
  const [loading, setLoading] = useState(false);
  // p2-mypage-g4 작업A: 즐겨찾기 정렬(북마크 등록 시각). recent(기본)/oldest. 백엔드 sort 파라미터.
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  // p2-mypage-g4 Q2: 전 탭 배지용 per-board 즐겨찾기 카운트(마운트 시 1회).
  const [favCounts, setFavCounts] = useState<{ jobs: number; review: number; talk: number; urgent: number } | null>(null);
  // p2-45 LOW-1: 활성 탭 데이터 미도착이면 첫 페인트부터 스켈레톤.
  const activeData = currentTab === "jobs" ? jobsData : postsData;
  const showSkeleton = useMinimumLoading(loading || !activeData);
  const [page, setPage] = useState(pageParam);
  const pageSize = 20;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const res = await api.get<JobsListData>(`/api/me/bookmarks/jobs?page=${page}&pageSize=${pageSize}&sort=${sort}`, true);
    if (res.success && res.data) setJobsData(res.data);
    setLoading(false);
  }, [page, sort]);

  const fetchPosts = useCallback(async (board: PostBoardType) => {
    setLoading(true);
    const res = await getMyBookmarkedPosts(board, page, pageSize, sort);
    if (res.success && res.data) setPostsData(res.data);
    else setPostsData({ items: [], total: 0, page, pageSize });
    setLoading(false);
  }, [page, sort]);

  const fetchCounts = useCallback(async () => {
    const res = await api.get<{ jobs: number; review: number; talk: number; urgent: number }>("/api/me/bookmarks/counts", true);
    if (res.success && res.data) setFavCounts(res.data);
  }, []);

  useEffect(() => {
    if (meLoading) return;
    if (me?.userType === "corp") {
      alert("기업회원은 즐겨찾기를 사용할 수 없습니다.");
      router.replace("/mypage");
      return;
    }
    fetchCounts();
    if (currentTab === "jobs") {
      fetchJobs();
      setPostsData(null);
    } else {
      fetchPosts(TAB_TO_BOARD[currentTab]);
      setJobsData(null);
    }
  }, [meLoading, me, currentTab, fetchJobs, fetchPosts, fetchCounts, router]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  const totalForTab = useMemo(() => {
    if (currentTab === "jobs") return jobsData?.total ?? 0;
    return postsData?.total ?? 0;
  }, [currentTab, jobsData, postsData]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalForTab / pageSize));
  }, [totalForTab]);

  const handleTabChange = (key: TabKey) => {
    setPage(1);
    const params = new URLSearchParams();
    params.set("tab", key);
    router.replace(`/mypage/favorites?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    const params = new URLSearchParams();
    params.set("tab", currentTab);
    if (p > 1) params.set("page", String(p));
    router.replace(`/mypage/favorites?${params.toString()}`, { scroll: false });
  };

  const handleUnbookmarkJob = async (jobPostId: number) => {
    if (!confirm("이 공고를 스크랩 해제할까요?")) return;
    const prev = jobsData;
    if (prev) {
      setJobsData({ ...prev, items: prev.items.filter((it) => it.jobPostId !== jobPostId), total: Math.max(0, prev.total - 1) });
    }
    const res = await api.del<{ bookmarked: boolean; deleted: number }>(`/api/jobs/${jobPostId}/bookmark`, true);
    if (!res.success) {
      alert(res.message || "스크랩 해제에 실패했습니다.");
      if (prev) setJobsData(prev);
    } else {
      fetchCounts(); // 탭 배지 갱신
      useCountsStore.getState().refresh(); // msg-g2 항목7: 사이드바 즐겨찾기 카운트 동기화
    }
  };

  const handleUnbookmarkPost = async (boardType: PostBoardType, id: number) => {
    if (!confirm("이 게시글을 즐겨찾기 해제할까요?")) return;
    const prev = postsData;
    if (prev) {
      setPostsData({
        ...prev,
        items: prev.items.filter((it) => !(it.boardType === boardType && it.boardId === id)),
        total: Math.max(0, prev.total - 1),
      });
    }
    const res = await unbookmarkPost(boardType, id);
    if (!res.ok) {
      alert(res.message || "즐겨찾기 해제에 실패했습니다.");
      if (prev) setPostsData(prev);
    } else {
      fetchCounts(); // 탭 배지 갱신
      useCountsStore.getState().refresh(); // msg-g2 항목7: 사이드바 즐겨찾기 카운트 동기화
    }
  };

  if (meLoading) {
    return (
      <MyPageShell me={null}>
        <LoadingIndicator />
      </MyPageShell>
    );
  }

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 10 }}>
            즐겨찾기
            <span className="count">{showSkeleton ? <InlineSpinner /> : totalForTab}개</span>
          </h2>
          <div className="sub">관심 있는 채용 공고와 게시글을 모아보고, 마감 전에 빠르게 확인하세요.</div>
        </div>
      </div>

      <div className="fav-tabs" role="tablist">
        {TABS.map((t) => {
          const cnt = t.key === "jobs" ? favCounts?.jobs : favCounts?.[TAB_TO_BOARD[t.key as Exclude<TabKey, "jobs">]];
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              className={currentTab === t.key ? "on" : ""}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
              <span className="badge">{currentTab === t.key ? totalForTab : (cnt ?? 0)}</span>
            </button>
          );
        })}
      </div>

      {/* 채용 공고 탭 */}
      {currentTab === "jobs" && (
        <>
          <div className="fav-toolbar">
            <div className="left">
              <b>채용 공고</b> <span style={{ color: "var(--ink-4)" }}>·</span> 총 <b>{totalForTab}</b>개의 스크랩
            </div>
            <div className="right">
              <select className="fav-sort" aria-label="정렬" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value as "recent" | "oldest"); }}>
                <option value="recent">최근 즐겨찾기 순</option>
                <option value="oldest">오래된 순</option>
              </select>
            </div>
          </div>

          {showSkeleton && <div className="jobs-grid"><JobCardSkeletons count={6} /></div>}

          {!showSkeleton && jobsData && jobsData.items.length === 0 && (
            <div className="fav-empty">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h4>스크랩한 공고가 없습니다.</h4>
              <p>관심 있는 채용 공고의 스크랩 버튼을 눌러두면<br />언제든 마이페이지에서 확인할 수 있어요.</p>
              <Link href="/jobs" className="go-btn">
                채용공고 둘러보기
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {!showSkeleton && jobsData && jobsData.items.length > 0 && (
            <div className="jobs-grid">
              {jobsData.items.map((it) => {
                const inactive = it.availability !== "active";
                const job = it.job;
                if (!job) {
                  return (
                    <div key={it.jobPostId} className="job" style={{ opacity: 0.55, pointerEvents: "none" }}>
                      <div className="photo" />
                      <div className="clinic">삭제된 공고</div>
                      <h5>이 공고는 삭제되었습니다.</h5>
                      <div className="tags"><span className="t">{AVAILABILITY_LABELS.deleted}</span></div>
                    </div>
                  );
                }
                return (
                  <div key={it.jobPostId} className="job" style={inactive ? { opacity: 0.6 } : undefined}>
                    {inactive ? (
                      <div className="photo" style={{
                        backgroundImage: job.hospitalImages?.[0] ? `url(${job.hospitalImages[0]})` : undefined,
                      }}>
                        <button
                          type="button"
                          className="bookmark on"
                          aria-label="스크랩 해제"
                          onClick={() => handleUnbookmarkJob(it.jobPostId)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <Link href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="photo" style={{
                        backgroundImage: job.hospitalImages?.[0] ? `url(${job.hospitalImages[0]})` : undefined,
                        display: "block",
                      }}>
                        <button
                          type="button"
                          className="bookmark on"
                          aria-label="스크랩 해제"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUnbookmarkJob(it.jobPostId);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
                          </svg>
                        </button>
                      </Link>
                    )}
                    <div className="clinic">{job.hospitalName}</div>
                    {inactive ? (
                      <h5>{job.title}</h5>
                    ) : (
                      <h5><Link href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>{job.title}</Link></h5>
                    )}
                    <div className="tags">
                      <span className={`t ${WORK_TYPE_CLASSES[job.workType]}`}>{WORK_TYPE_LABELS[job.workType]}</span>
                      {(job.jobTypes ?? []).slice(0, 1).map((jt) => (
                        <span key={jt} className="t">{JOB_DUTY_TYPE_LABELS[jt] ?? jt}</span>
                      ))}
                      {inactive && (
                        <span className="t" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                          {AVAILABILITY_LABELS[it.availability]}
                        </span>
                      )}
                    </div>
                    <div className="loc">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {[job.region, job.address].filter(Boolean).join(" ") || "지역 미정"}
                    </div>
                    <div className="pay">{formatSalary(job)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 급구 탭 — item7: 급구 게시판 리스트(UrgentCard)와 동일 카드 */}
      {currentTab === "urgents" && (
        <>
          <div className="fav-toolbar">
            <div className="left">
              <b>급구</b>
              <span style={{ color: "var(--ink-4)" }}>·</span> 총 <b>{totalForTab}</b>개의 즐겨찾기
            </div>
            <div className="right">
              <select className="fav-sort" aria-label="정렬" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value as "recent" | "oldest"); }}>
                <option value="recent">최근 즐겨찾기 순</option>
                <option value="oldest">오래된 순</option>
              </select>
            </div>
          </div>

          {showSkeleton && <div className="urgent-grid"><UrgentCardSkeletons count={6} /></div>}

          {!showSkeleton && postsData && postsData.items.length === 0 && (
            <div className="fav-empty">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
                </svg>
              </div>
              <h4>즐겨찾기한 급구가 없습니다.</h4>
              <p>관심 있는 급구 공고의 즐겨찾기 버튼을 눌러두면<br />언제든 마이페이지에서 확인할 수 있어요.</p>
              <Link href={POST_BOARD_PATHS.urgent} className="go-btn">급구 둘러보기</Link>
            </div>
          )}

          {!showSkeleton && postsData && postsData.items.length > 0 && (
            <div className="urgent-grid">
              {postsData.items.map((it) => {
                if (!it.available || !it.post) {
                  return (
                    <article key={`urgent-${it.boardId}`} className="urgent with-flag" style={{ opacity: 0.55 }}>
                      <span className="urgent-flag">급구</span>
                      <button
                        type="button"
                        className="bookmark on"
                        aria-label="즐겨찾기 해제"
                        onClick={() => handleUnbookmarkPost("urgent", it.boardId)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" /></svg>
                      </button>
                      <div className="clinic">마감/삭제된 공고</div>
                      <h5>이 급구는 마감되었거나 삭제되었습니다.</h5>
                    </article>
                  );
                }
                return (
                  <UrgentCard
                    key={`urgent-${it.boardId}`}
                    post={toUrgentPost(it.post)}
                    onToggleBookmark={() => handleUnbookmarkPost("urgent", it.boardId)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 페이지네이션 (jobs / posts 공통) */}
      {totalForTab > pageSize && (
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

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div />}>
      <FavoritesContent />
    </Suspense>
  );
}
