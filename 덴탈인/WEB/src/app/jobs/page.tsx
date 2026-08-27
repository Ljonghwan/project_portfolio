"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import EmptyState from "@/components/EmptyState";
import MobileFab from "@/components/MobileFab";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import {
  JobPost,
  SalaryType,
  WORK_TYPE_LABELS,
  CAREER_TYPE_LABELS,
  CAREER_TYPES,
  JOB_DUTY_TYPE_LABELS,
  JOB_DUTY_TYPES,
} from "@/lib/jobs";
import { useSidoOptions } from "@/stores/regionStore";
import JobCard from "@/components/JobCard";
import JobSortModal, { JOB_SORT_OPTIONS } from "@/components/JobSortModal";
import { JobCardSkeletons } from "@/components/CardSkeletons";
import { InlineSpinner } from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";

type ListData = { items: JobPost[]; total: number; page: number; pageSize: number };

const WORK_TYPES = ["full_time", "contract", "part_time", "intern"] as const;
// p2-7: CAREER_TYPES(3셋)·JOB_DUTY_TYPES(9셋)는 lib(서버 codes hydrate)에서 import — 하드코딩 0.

// 급여 타입 필터 pill (UI 표시용 - server 필터로는 salaryMin만 전송)
type SalaryFilterKey = "" | "negotiable" | SalaryType;
// #9: 급여 필터 5개만(면접 후 결정/연봉/월급/일급/시급). internal/weekly/perCase/negotiable 제거.
const SALARY_FILTERS: { key: SalaryFilterKey; label: string; unit: "만원" | "원" | null }[] = [
  { key: "", label: "전체", unit: null },
  { key: "interview", label: "면접 후 결정", unit: null },
  { key: "annual", label: "연봉", unit: "만원" },
  { key: "monthly", label: "월급", unit: "만원" },
  { key: "daily", label: "일급", unit: "원" },
  { key: "hourly", label: "시급", unit: "원" },
];

const SALARY_LABEL_BY_KEY: Record<SalaryFilterKey, string> = {
  "": "급여",
  negotiable: "급여",
  interview: "면접 후 결정",
  internal: "회사 내규에 따름",
  annual: "연봉",
  monthly: "월급",
  weekly: "주급",
  daily: "일급",
  hourly: "시급",
  perCase: "건당",
};

const RECENT_KEY = "jobs:recent-conditions";
const RECENT_MAX = 5;

type RecentCondition = {
  id: string;          // 고유 키 (timestamp+random)
  savedAt: string;     // YYYY.MM.DD
  query: Record<string, string>;
  summary: string;     // "서울 · 신입 · 정규직"
};

function loadRecent(): RecentCondition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch { return []; }
}

function saveRecent(list: RecentCondition[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {/* quota */}
}

function todayDot() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function JobsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, loading: meLoading } = useMe(false);

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const sidoOptions = useSidoOptions();
  const [workType, setWorkType] = useState(searchParams.get("workType") ?? "");
  const [careerType, setCareerType] = useState(searchParams.get("careerType") ?? "");
  // p2-7: 담당업무 다중 필터(jobTypes). URL ?jobTypes=clinic,desk
  const [jobTypes, setJobTypes] = useState<string[]>(
    () => (searchParams.get("jobTypes") ?? searchParams.get("jobType") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const toggleJobType = (k: string) =>
    setJobTypes((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  const [salaryFilter, setSalaryFilter] = useState<SalaryFilterKey>(
    (searchParams.get("salaryFilter") as SalaryFilterKey) ?? ""
  );
  const [salaryMin, setSalaryMin] = useState(searchParams.get("salaryMin") ?? "");
  const [salaryMax, setSalaryMax] = useState(searchParams.get("salaryMax") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");
  const [sortOpen, setSortOpen] = useState(false); // HOTFIX #2: 정렬 모달
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useMinimumLoading(loading || !data);
  const [recent, setRecent] = useState<RecentCondition[]>([]);

  const pageSize = 20;

  useEffect(() => { setRecent(loadRecent()); }, []);

  // 검색어를 SiteHeader가 갱신해 query string에 q를 넘기는 경우 화면에 반영
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const buildQuery = useCallback(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (region) sp.set("region", region);
    if (workType) sp.set("workType", workType);
    if (careerType) sp.set("careerType", careerType);
    if (jobTypes.length) sp.set("jobTypes", jobTypes.join(","));
    if (salaryFilter) sp.set("salaryFilter", salaryFilter);
    if (salaryMin) sp.set("salaryMin", salaryMin);
    if (sort && sort !== "latest") sp.set("sort", sort);
    if (page > 1) sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp;
  }, [q, region, workType, careerType, jobTypes, salaryFilter, salaryMin, sort, page]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const sp = buildQuery();
    // #10: 급여형태(salaryFilter=salaryType 키)를 server salaryType 파라미터로 전송 → 형태+금액 동시 필터.
    sp.delete("salaryFilter");
    if (salaryFilter && salaryFilter !== "negotiable") {
      sp.set("salaryType", salaryFilter);
    }
    // 면접 후 결정(interview)은 금액 무의미 → 금액 제거
    if (salaryFilter === "interview" || salaryFilter === "negotiable") {
      sp.delete("salaryMin");
    }
    const res = await api.get<ListData>(`/api/jobs?${sp.toString()}`, !!me);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }, [buildQuery, me, salaryFilter]);

  useEffect(() => {
    if (meLoading) return;
    fetchList();
  }, [fetchList, meLoading]);

  const toggleBookmark = async (jobId: number, currentlyBookmarked: boolean) => {
    if (!me) {
      if (confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    if (me.userType === "corp") {
      alert("기업회원은 채용 스크랩을 사용할 수 없습니다.");
      return;
    }
    setData((prev) => prev && {
      ...prev,
      items: prev.items.map((it) => it.id === jobId ? { ...it, bookmarked: !currentlyBookmarked } : it),
    });
    const res = currentlyBookmarked
      ? await api.del(`/api/jobs/${jobId}/bookmark`, true)
      : await api.post(`/api/jobs/${jobId}/bookmark`, undefined, true);
    if (!res.success) {
      alert(res.message || "스크랩 처리에 실패했습니다.");
      setData((prev) => prev && {
        ...prev,
        items: prev.items.map((it) => it.id === jobId ? { ...it, bookmarked: currentlyBookmarked } : it),
      });
    }
  };

  // URL 동기화
  useEffect(() => {
    const sp = buildQuery();
    sp.delete("pageSize");
    const next = sp.toString();
    const current = searchParams.toString();
    if (next !== current) router.replace(`/jobs${next ? `?${next}` : ""}`, { scroll: false });
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

  // 현재 필터 요약 ("서울 · 신입 · 정규직" 식)
  const buildSummary = useCallback(() => {
    const tokens: string[] = [];
    if (region) tokens.push(region);
    for (const jt of jobTypes) {
      if (JOB_DUTY_TYPE_LABELS[jt]) tokens.push(JOB_DUTY_TYPE_LABELS[jt]);
    }
    if (workType && WORK_TYPE_LABELS[workType as keyof typeof WORK_TYPE_LABELS]) {
      tokens.push(WORK_TYPE_LABELS[workType as keyof typeof WORK_TYPE_LABELS]);
    }
    if (careerType && CAREER_TYPE_LABELS[careerType as keyof typeof CAREER_TYPE_LABELS]) {
      tokens.push(CAREER_TYPE_LABELS[careerType as keyof typeof CAREER_TYPE_LABELS]);
    }
    if (q) tokens.push(`"${q}"`);
    return tokens.length ? tokens.join(", ") : "전체";
  }, [region, jobTypes, workType, careerType, q]);

  const saveCurrentCondition = () => {
    const summary = buildSummary();
    if (summary === "전체" && !salaryMin && !salaryMax && !salaryFilter) {
      alert("저장할 조건이 없습니다. 필터를 선택해 주세요.");
      return;
    }
    const item: RecentCondition = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: todayDot(),
      query: {
        ...(q && { q }),
        ...(region && { region }),
        ...(workType && { workType }),
        ...(careerType && { careerType }),
        ...(jobTypes.length && { jobTypes: jobTypes.join(",") }),
        ...(salaryFilter && { salaryFilter }),
        ...(salaryMin && { salaryMin }),
        ...(salaryMax && { salaryMax }),
      },
      summary,
    };
    const dedup = recent.filter((r) => r.summary !== summary);
    const next = [item, ...dedup].slice(0, RECENT_MAX);
    setRecent(next);
    saveRecent(next);
  };

  const applyRecent = (r: RecentCondition) => {
    setQ(r.query.q ?? "");
    setRegion(r.query.region ?? "");
    setWorkType(r.query.workType ?? "");
    setCareerType(r.query.careerType ?? "");
    setJobTypes((r.query.jobTypes ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    setSalaryFilter((r.query.salaryFilter as SalaryFilterKey) ?? "");
    setSalaryMin(r.query.salaryMin ?? "");
    setSalaryMax(r.query.salaryMax ?? "");
    resetPage();
  };

  const removeRecent = (id: string) => {
    const next = recent.filter((r) => r.id !== id);
    setRecent(next);
    saveRecent(next);
  };

  const currentUnit = SALARY_FILTERS.find((f) => f.key === salaryFilter)?.unit ?? "만원";
  const isNegotiable = salaryFilter === "negotiable" || salaryFilter === "interview" || salaryFilter === "internal";

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="page-head">
          <div>
            <h2 style={{ marginTop: 6 }}>채용 정보</h2>
          </div>
        </div>

        <div className="search-panel">
          <div className="panel-title">
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            상세 검색
          </div>

          <div className="filter-row">
            <span className="label">직종</span>
            <div className="chip-group">
              <button type="button" className={`pill ${jobTypes.length === 0 ? "on" : ""}`} onClick={() => { setJobTypes([]); resetPage(); }}>전체</button>
              {JOB_DUTY_TYPES.map((jt) => (
                <button key={jt} type="button" className={`pill ${jobTypes.includes(jt) ? "on" : ""}`} onClick={() => { toggleJobType(jt); resetPage(); }}>
                  {JOB_DUTY_TYPE_LABELS[jt]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="label">지역</span>
            <div className="chip-group">
              <button type="button" className={`pill ${region === "" ? "on" : ""}`} onClick={() => { setRegion(""); resetPage(); }}>전체</button>
              {sidoOptions.map((r) => (
                <button key={r.value} type="button" className={`pill ${region === r.value ? "on" : ""}`} onClick={() => { setRegion(r.value); resetPage(); }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="label">고용형태</span>
            <div className="chip-group">
              <button type="button" className={`pill ${workType === "" ? "on" : ""}`} onClick={() => { setWorkType(""); resetPage(); }}>전체</button>
              {WORK_TYPES.map((wt) => (
                <button key={wt} type="button" className={`pill ${workType === wt ? "on" : ""}`} onClick={() => { setWorkType(wt); resetPage(); }}>
                  {WORK_TYPE_LABELS[wt]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="label">경력</span>
            <div className="chip-group">
              <button type="button" className={`pill ${careerType === "" ? "on" : ""}`} onClick={() => { setCareerType(""); resetPage(); }}>전체</button>
              {CAREER_TYPES.map((ct) => (
                <button key={ct} type="button" className={`pill ${careerType === ct ? "on" : ""}`} onClick={() => { setCareerType(ct); resetPage(); }}>
                  {CAREER_TYPE_LABELS[ct]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="label">급여</span>
            <div className="salary-row">
              {SALARY_FILTERS.map((f) => (
                <button
                  key={f.key || "all"}
                  type="button"
                  className={`pill ${salaryFilter === f.key ? "on" : ""}`}
                  onClick={() => {
                    setSalaryFilter(f.key);
                    if (f.key === "negotiable" || f.key === "") {
                      setSalaryMin("");
                      setSalaryMax("");
                    }
                    resetPage();
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="label">{SALARY_LABEL_BY_KEY[salaryFilter]}</span>
            <div className="salary-row">
              <span className="salary-input">
                <input
                  type="text"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  disabled={isNegotiable}
                  inputMode="numeric"
                />
                <span className="unit">{currentUnit}</span>
              </span>
              <span className="tilde">~</span>
              <span className="salary-input">
                <input
                  type="text"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={isNegotiable ? "-" : "0"}
                  disabled={isNegotiable}
                  inputMode="numeric"
                />
                <span className="unit">{currentUnit}</span>
              </span>
              <button type="button" className="pill brand" onClick={saveCurrentCondition}>조건 저장</button>
            </div>
          </div>
        </div>

        <div className="recent-bar">
          <span className="recent-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            최근 검색한 조건
            <span className="count">{recent.length}건</span>
          </span>
          {recent.length === 0 ? (
            <span className="recent-empty">아직 저장된 조건이 없습니다. 필터를 선택하고 “조건 저장”을 눌러주세요.</span>
          ) : (
            recent.map((r) => (
              <button
                key={r.id}
                type="button"
                className="recent-chip"
                onClick={() => applyRecent(r)}
                title={`${r.savedAt} 저장된 조건 적용`}
              >
                {/* M4: 텍스트는 ellipsis(min-width:0), x 아이콘은 flex-shrink:0 + 우측(margin-left:auto)로 찌그러짐 방지 */}
                <span className="recent-chip-text">{r.savedAt} · {r.summary}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="삭제"
                  onClick={(e) => { e.stopPropagation(); removeRecent(r.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeRecent(r.id); } }}
                  style={{ display: "inline-grid", placeItems: "center", width: 16, height: 16, borderRadius: "50%", background: "var(--ink-4)", color: "#fff", cursor: "pointer", flexShrink: 0, marginLeft: "auto" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ width: 8, height: 8 }}>
                    <path d="m6 6 12 12M6 18 18 6" />
                  </svg>
                </span>
              </button>
            ))
          )}
          {/* M2(K1): "조건 알림"(검색조건 알림 등록) 기능 전면 제거 — 버튼·notSupported 호출 삭제. "조건 저장"(최근 검색 조건)은 유지. */}
        </div>

        <div className="list-meta">
          <div className="count">
            검색결과 <b>{showSkeleton ? <InlineSpinner /> : `${(data?.total ?? 0).toLocaleString()}건`}</b>
          </div>
          {/* HOTFIX #2(2026-06-11): 다른 게시판(talks/urgents)과 동일한 rv-drop 버튼 + 정렬 모달로 통일(데스크탑/모바일 일관). 구 인라인 버튼·native select 폐기. */}
          <button
            type="button"
            className={`rv-drop${["view", "salary", "expiring"].includes(sort) ? " on" : ""}`}
            onClick={() => setSortOpen(true)}
            aria-haspopup="dialog"
          >
            {JOB_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "최신순"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <JobSortModal
          open={sortOpen}
          value={sort}
          onClose={() => setSortOpen(false)}
          onApply={(next) => { setSort(next); resetPage(); }}
        />

        <div className="jobs-head">
          <div className="jobs-tabs">
            <button type="button" className={workType === "" ? "on" : ""} onClick={() => { setWorkType(""); resetPage(); }}>전체</button>
            {WORK_TYPES.map((wt) => (
              <button key={wt} type="button" className={workType === wt ? "on" : ""} onClick={() => { setWorkType(wt); resetPage(); }}>
                {WORK_TYPE_LABELS[wt]}
              </button>
            ))}
          </div>
          <div className="jobs-filter">
            {/* 신규3: 즐겨찾기 우선 = 디자인시스템 cb(초록) 체크박스. personal 전용(sort=bookmark). */}
            {me?.userType === "personal" && (
              <label className="cb">
                <input
                  type="checkbox"
                  checked={sort === "bookmark"}
                  onChange={(e) => { setSort(e.target.checked ? "bookmark" : "latest"); resetPage(); }}
                />
                즐겨찾기 우선
              </label>
            )}
          </div>
        </div>

        <div className="jobs-grid">
          {showSkeleton && <JobCardSkeletons count={10} />}
          {!showSkeleton && data && data.items.length === 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState
                icon="🔎"
                title="검색 조건에 맞는 공고가 없습니다"
                description="필터나 검색어를 조정해 보세요. 전체 공고를 보고 싶다면 검색 초기화 버튼을 눌러주세요."
                testId="jobs-empty"
              />
            </div>
          )}
          {!showSkeleton && data?.items.map((job) => (
            <JobCard key={job.id} job={job} onToggleBookmark={toggleBookmark} />
          ))}
        </div>

        {data && data.total > 0 && (
          <div className="pager">
            <button type="button" className="nav" onClick={() => goPage(Math.max(1, page - 1))} disabled={page <= 1} aria-label="이전">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
              const start = Math.max(1, Math.min(totalPages - 9, page - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button key={p} type="button" className={p === page ? "on" : ""} onClick={() => goPage(p)}>{p}</button>
              );
            })}
            <button type="button" className="nav" onClick={() => goPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} aria-label="다음">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </main>
      <MobileFab
        label="채용 등록"
        onClick={() => {
          if (meLoading) return;
          if (!me) {
            if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
            return;
          }
          router.push("/mypage/jobs/new");
        }}
      />
      <SiteFooter />
    </>
  );
}

export default function JobsListPage() {
  return (
    <Suspense fallback={<div />}>
      <JobsListContent />
    </Suspense>
  );
}
