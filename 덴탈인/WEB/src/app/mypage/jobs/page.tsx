"use client";

// p2-mypage-g3: 채용 관리 퍼블 1:1 (mypage-corp-active/closed/draft 시안).
// 진행중/마감 = 3열 카드 그리드(.job-card), 임시저장 = 행 리스트(.corp-item).
// Q1=A(조회수), Q2=B(시안 액션만 — 보기/공개 버튼 제거).
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingIndicator from "@/components/LoadingIndicator";
import { JobCardSkeletons } from "@/components/CardSkeletons";
import EmptyState from "@/components/EmptyState";
import { useMe } from "@/lib/useMe";
import { useCodeStore } from "@/stores/codeStore";
import { useCountsStore } from "@/stores/countsStore";
import { api } from "@/lib/api";
import {
  type JobPost,
  type JobStatus,
  WORK_TYPE_LABELS,
  WORK_TYPE_CLASSES,
  JOB_DUTY_TYPE_LABELS,
  isAlwaysHiring,
  jobPeriodLabel,
} from "@/lib/jobs";

type ListData = { items: JobPost[]; total: number; page: number; pageSize: number };

// 시안 탭 순서: 진행중 → 마감 → 임시저장
const HEAD: Record<JobStatus, { h2: string; sub: string }> = {
  active: { h2: "진행중 채용", sub: "현재 노출 중인 채용 공고를 관리합니다." },
  closed: { h2: "마감된 채용", sub: "마감된 공고를 다시 복사해 등록하거나 삭제할 수 있어요." },
  draft: { h2: "임시저장", sub: "작성 중이던 채용 공고를 이어서 등록할 수 있어요." },
};

function readTab(v: string | null): JobStatus {
  return v === "draft" || v === "closed" ? v : "active";
}

function fmtYMD(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  const yy = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yy}.${m}.${da}`;
}
function fmtMD(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
function calcDDay(expiredAt: string | null): number | null {
  if (!expiredAt) return null;
  const exp = new Date(expiredAt);
  if (Number.isNaN(exp.getTime())) return null;
  exp.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - today.getTime()) / 86400000);
}

function jobTags(job: JobPost) {
  const tags: { label: string; cls: string }[] = [];
  (job.jobTypes ?? []).slice(0, 3).forEach((jt) => tags.push({ label: JOB_DUTY_TYPE_LABELS[jt] ?? jt, cls: "" }));
  if (job.workType && WORK_TYPE_LABELS[job.workType]) tags.push({ label: WORK_TYPE_LABELS[job.workType], cls: WORK_TYPE_CLASSES[job.workType] ?? "" });
  return tags;
}

function MyCorpJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, loading: meLoading } = useMe(true);
  useCodeStore((s) => s.loaded); // 직종/근무형태 라벨 hydrate 후 리렌더
  const [tab, setTab] = useState<JobStatus>(() => readTab(searchParams.get("tab")));

  useEffect(() => { setTab(readTab(searchParams.get("tab"))); }, [searchParams]);

  const goTab = useCallback((t: JobStatus) => { setTab(t); router.replace(`/mypage/jobs?tab=${t}`); }, [router]);

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ kind: "delete" | "close"; id: number } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmRef = useRef(false);

  const fetchList = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    const res = await api.get<ListData>(`/api/jobs/me/list?status=${tab}&pageSize=50`, true);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }, [me, tab]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const CONFIRM_META = {
    delete: { variant: "danger" as const, title: "공고를 삭제하시겠습니까?", description: "삭제된 공고는 복구할 수 없습니다.", ok: "삭제했습니다.", fail: "삭제에 실패했습니다." },
    close: { variant: "default" as const, title: "공고를 마감하시겠습니까?", description: "마감하면 채용 목록에서 내려갑니다.", ok: "마감 처리되었습니다.", fail: "마감에 실패했습니다." },
  };

  const runConfirm = async () => {
    if (!confirmAction || confirmRef.current) return;
    const { kind, id } = confirmAction;
    confirmRef.current = true;
    setConfirmBusy(true);
    const res = kind === "delete"
      ? await api.del(`/api/jobs/${id}`, true).finally(() => { confirmRef.current = false; })
      : await api.post(`/api/jobs/${id}/close`, undefined, true).finally(() => { confirmRef.current = false; });
    setConfirmBusy(false);
    setConfirmAction(null);
    if (res.success) {
      alert(CONFIRM_META[kind].ok);
      // msg-g2 항목7: 삭제/마감 후 사이드바 카운트(진행중/마감/임시저장) 동기화.
      useCountsStore.getState().refresh();
      if (kind === "delete") fetchList();
      else goTab("closed");
    } else {
      alert(res.message || CONFIRM_META[kind].fail);
    }
  };

  if (meLoading || !me) {
    return <MyPageShell me={null}><LoadingIndicator /></MyPageShell>;
  }

  const head = HEAD[tab];
  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <MyPageShell me={me}>
      <div className="mp-page-head">
        <div>
          <h2>{head.h2}</h2>
          <div className="sub">{head.sub}</div>
        </div>
        <div className="total">총 <b>{total}</b>건</div>
      </div>

      {loading && (tab === "draft"
        ? <div className="corp-list"><JobCardSkeletons count={3} /></div>
        : <div className="corp-jobs-grid"><JobCardSkeletons count={6} /></div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon="📋"
          title={tab === "active" ? "진행중인 공고가 없습니다" : tab === "closed" ? "마감된 공고가 없습니다" : "임시저장된 공고가 없습니다"}
          description={tab === "active" ? "새 공고를 등록해 인재를 모집해 보세요." : tab === "closed" ? "마감된 공고가 여기에 모입니다." : "작성하던 공고를 임시저장하면 이곳에서 이어 쓸 수 있어요."}
          actionLabel={tab !== "closed" ? "공고 등록" : undefined}
          actionHref={tab !== "closed" ? "/mypage/jobs/new" : undefined}
          testId={`mypage-jobs-empty-${tab}`}
        />
      )}

      {/* 진행중 / 마감 — 카드 그리드 */}
      {!loading && items.length > 0 && (tab === "active" || tab === "closed") && (
        <div className="corp-jobs-grid">
          {items.map((job) => {
            const closed = tab === "closed";
            const dday = calcDDay(job.expiredAt);
            const photoStyle = job.hospitalImages?.[0] ? { backgroundImage: `url(${job.hospitalImages[0]})` } : undefined;
            return (
              <article className={`job-card ${closed ? "closed" : ""}`} key={job.id}>
                <div className="photo" style={photoStyle}>
                  {closed ? (
                    <span className="status">마감</span>
                  ) : (
                    <>
                      {/* F8: 상시채용은 D-3650 같은 큰 D-day 대신 "상시채용" 배지 */}
                      {job.alwaysHiring ? (
                        <span className="dday far">상시채용</span>
                      ) : (
                        dday != null && dday >= 0 && (
                          <span className={`dday ${dday >= 30 ? "far" : ""}`}>{dday === 0 ? "D-Day" : `D-${dday}`}</span>
                        )
                      )}
                      <span className="status">진행중</span>
                    </>
                  )}
                </div>
                <div className="body">
                  <div className="clinic">{job.hospitalName}</div>
                  <h5>{job.title}</h5>
                  <div className="tags">
                    {jobTags(job).map((t, i) => <span key={i} className={`t ${t.cls}`}>{t.label}</span>)}
                  </div>
                  <div className="meta-row">
                    <span>{jobPeriodLabel(job, fmtYMD)}</span>
                    <span className="applicants">{closed ? "최종 조회" : "조회"} <b>{job.viewCount.toLocaleString()}</b></span>
                  </div>
                </div>
                <div className="actions">
                  {closed ? (
                    <>
                      <Link href={`/mypage/jobs/new?from=${job.id}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        복사하여 재등록
                      </Link>
                      <button type="button" className="delete-btn" onClick={() => setConfirmAction({ kind: "delete", id: job.id })}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        삭제
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={`/mypage/jobs/${job.id}/edit`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        수정
                      </Link>
                      <Link href={`/mypage/jobs/new?from=${job.id}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        복사
                      </Link>
                      <button type="button" className="close-btn" onClick={() => setConfirmAction({ kind: "close", id: job.id })}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                        마감
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 임시저장 — 행 리스트 */}
      {!loading && items.length > 0 && tab === "draft" && (
        <div className="corp-list">
          {items.map((job) => (
            <article className="corp-item" key={job.id}>
              <div className="info">
                <div className="top">
                  <span className="badge draft">임시저장</span>
                  <span className="clinic">{job.hospitalName}</span>
                </div>
                <h4>{job.title || "(제목 없음)"}</h4>
                <div className="tags">
                  {jobTags(job).map((t, i) => <span key={i} className={`t ${t.cls}`}>{t.label}</span>)}
                </div>
                <div className="meta">
                  <span>모집기간 {isAlwaysHiring(job) ? "상시채용" : (job.expiredAt ? `~ ${fmtYMD(job.expiredAt)}` : "미설정")}</span>
                  <span>마지막 저장 {fmtMD(job.updatedAt)}</span>
                </div>
              </div>
              <div className="actions">
                <Link href={`/mypage/jobs/${job.id}/edit`} className="act-btn dark">수정</Link>
                <Link href={`/mypage/jobs/new?from=${job.id}`} className="act-btn">복사</Link>
                <button type="button" className="act-btn danger" onClick={() => setConfirmAction({ kind: "delete", id: job.id })}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        variant={confirmAction ? CONFIRM_META[confirmAction.kind].variant : "default"}
        title={confirmAction ? CONFIRM_META[confirmAction.kind].title : ""}
        description={confirmAction ? CONFIRM_META[confirmAction.kind].description : undefined}
        busy={confirmBusy}
        onCancel={() => !confirmBusy && setConfirmAction(null)}
        onConfirm={runConfirm}
      />
    </MyPageShell>
  );
}

export default function MyCorpJobsPage() {
  return (
    <Suspense fallback={<MyPageShell me={null}><LoadingIndicator /></MyPageShell>}>
      <MyCorpJobsContent />
    </Suspense>
  );
}
