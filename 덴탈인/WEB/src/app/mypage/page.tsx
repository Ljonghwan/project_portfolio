"use client";

// p2-mypage-g1: 마이홈 개인/기업 퍼블 1:1 (mypage-personal.html / mypage-corp.html 시안).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MyPageShell from "@/components/MyPageShell";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMe } from "@/lib/useMe";
import { api } from "@/lib/api";
import { useCodeStore } from "@/stores/codeStore";
import { useCountsStore } from "@/stores/countsStore";
import {
  type BookmarkedJobItem,
  WORK_TYPE_LABELS,
  JOB_DUTY_TYPE_LABELS,
  AVAILABILITY_LABELS,
  isAlwaysHiring,
  jobPeriodLabel,
} from "@/lib/jobs";
import {
  getMyPosts,
  POST_BOARD_LABELS,
  POST_BOARD_PATHS,
  type MyPostItem,
  type PostBoardType,
  type ListResponse,
} from "@/lib/postBookmarks";

type Counts = {
  jobsActive: number;
  jobsClosed: number;
  jobsDraft: number;
  favorites: number;
  posts: number;
  comments: number;
  inquiries: number;
};

type JobsListData = { items: BookmarkedJobItem[]; total: number; page: number; pageSize: number };

// 기업 최근 채용 mini-list용 (serializeJob 응답 일부)
type MyJob = {
  id: number;
  title: string;
  status: string;
  publishedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  alwaysHiring?: boolean | null; // 상시채용 표기(F8 확장)
};
type MyJobList = { items: MyJob[]; total: number };

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${da}`;
}

function calcDDay(expiredAt: string | null): number | null {
  if (!expiredAt) return null;
  const exp = new Date(expiredAt);
  if (Number.isNaN(exp.getTime())) return null;
  exp.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// 보드 칩 색상 (시안 tag-notice 변형)
const BOARD_CHIP_STYLE: Record<PostBoardType, { background: string; color: string }> = {
  review: { background: "#FEF3C7", color: "#92400E" },
  talk: { background: "var(--brand-soft)", color: "var(--brand-ink)" },
  urgent: { background: "#FEE2E2", color: "#991B1B" },
};

export default function MyPageHome() {
  const router = useRouter();
  useCodeStore((s) => s.loaded); // codes hydrate 후 라벨 리렌더
  const { me, loading } = useMe();

  const [counts, setCounts] = useState<Counts | null>(null);
  const [favJobs, setFavJobs] = useState<BookmarkedJobItem[] | null>(null);
  const [recentPosts, setRecentPosts] = useState<MyPostItem[] | null>(null);
  const [recentJobs, setRecentJobs] = useState<MyJob[] | null>(null);

  const isCorp = me?.userType === "corp";

  // counts(개인/기업 공통)
  useEffect(() => {
    if (!me) return;
    let alive = true;
    api.get<Counts>("/api/me/counts", true).then((res) => {
      if (alive && res.success && res.data) setCounts(res.data);
    });
    return () => { alive = false; };
  }, [me]);

  const loadPersonal = useCallback(async () => {
    const [favRes, postRes] = await Promise.all([
      api.get<JobsListData>("/api/me/bookmarks/jobs?page=1&pageSize=6", true),
      getMyPosts("all", 1, 3),
    ]);
    if (favRes.success && favRes.data) setFavJobs(favRes.data.items);
    else setFavJobs([]);
    if (postRes.success && postRes.data) setRecentPosts(postRes.data.items);
    else setRecentPosts([]);
  }, []);

  const loadCorp = useCallback(async () => {
    const res = await api.get<MyJobList>("/api/jobs/me/list?status=active&pageSize=5", true);
    if (res.success && res.data) setRecentJobs(res.data.items);
    else setRecentJobs([]);
  }, []);

  useEffect(() => {
    if (!me) return;
    if (me.userType === "corp") loadCorp();
    else loadPersonal();
  }, [me, loadCorp, loadPersonal]);

  function unbookmarkJob(jobPostId: number) {
    const prev = favJobs;
    setFavJobs((cur) => (cur ? cur.filter((it) => it.jobPostId !== jobPostId) : cur));
    api.del<{ bookmarked: boolean }>(`/api/jobs/${jobPostId}/bookmark`, true).then((res) => {
      if (!res.success) {
        alert(res.message || "스크랩 해제에 실패했습니다.");
        setFavJobs(prev ?? null);
      } else {
        useCountsStore.getState().refresh(); // msg-g2 항목7: 사이드바 즐겨찾기 카운트 동기화
      }
    });
  }

  if (loading) return <MyPageShell me={null}><LoadingIndicator /></MyPageShell>;
  if (!me) return null;

  return (
    <MyPageShell me={me}>
      {isCorp ? (
        <CorpHome
          me={me}
          counts={counts}
          recentJobs={recentJobs}
          router={router}
        />
      ) : (
        <PersonalHome
          me={me}
          counts={counts}
          favJobs={favJobs}
          recentPosts={recentPosts}
          onUnbookmark={unbookmarkJob}
        />
      )}
    </MyPageShell>
  );
}

/* ===================== 개인 홈 ===================== */
function PersonalHome({
  me,
  counts,
  favJobs,
  recentPosts,
  onUnbookmark,
}: {
  me: NonNullable<ReturnType<typeof useMe>["me"]>;
  counts: Counts | null;
  favJobs: BookmarkedJobItem[] | null;
  recentPosts: MyPostItem[] | null;
  onUnbookmark: (jobPostId: number) => void;
}) {
  const initial = me.name?.slice(0, 1) || "?";
  const status = me.licenseStatus ?? "none";
  const verified = status === "verified";
  const licenseChip =
    status === "verified" ? "면허증 인증 완료"
    : status === "pending" ? "면허 인증 심사 중"
    : status === "rejected" ? "면허 인증 반려"
    : "면허 미인증";

  return (
    <>
      {/* Hero */}
      <div className="mp-hero">
        <div className="ava-xl">
          {/* F10: 프로필 사진 있으면 이미지, 없으면 이니셜 */}
          {me.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.profileImageUrl} alt="" className="ava-img" />
          ) : initial}
          {verified && (
            <span className="verified" title="면허증 인증">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          )}
        </div>
        <div className="info">
          <div className="greet">반갑습니다, {me.name}님</div>
          <h2>오늘도 좋은 하루 되세요</h2>
          <div className="meta">
            <span>{licenseChip}</span>
            <span>{me.email}</span>
            <span>가입 {formatDate(me.createdAt)}</span>
          </div>
        </div>
        <Link href="/mypage/info" className="edit-btn">
          내 정보 수정
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </Link>
      </div>

      {/* Stats */}
      <div className="mp-stats">
        <Link className="mp-stat" href="/mypage/posts">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="14 3 14 9 20 9" /></svg>
          </div>
          <div>
            <div className="v">{counts?.posts ?? 0}</div>
            <div className="l">내가 쓴 글</div>
          </div>
        </Link>
        <Link className="mp-stat" href="/mypage/comments">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          <div>
            <div className="v">{counts?.comments ?? 0}</div>
            <div className="l">내가 쓴 댓글</div>
          </div>
        </Link>
        <Link className="mp-stat" href="/mypage/favorites">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
          </div>
          <div>
            <div className="v">{counts?.favorites ?? 0}</div>
            <div className="l">즐겨찾기</div>
          </div>
        </Link>
        <Link className="mp-stat" href="/mypage/inquiry">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" /><line x1="12" y1="17" x2="12" y2="17.5" /></svg>
          </div>
          <div>
            <div className="v">{counts?.inquiries ?? 0}</div>
            <div className="l">나의 문의</div>
          </div>
        </Link>
      </div>

      {/* 즐겨찾는 공고 */}
      <div className="mp-card">
        <div className="mp-card-head">
          <h3>즐겨찾는 공고</h3>
          <Link href="/mypage/favorites" className="all">
            전체보기
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
        {favJobs && favJobs.length > 0 ? (
          <div className="fav-grid">
            {favJobs.map((it) => {
              const job = it.job;
              // BUG-2 fix(p2-mypage-g1-verify): availability 처리 — /mypage/favorites와 통일.
              // hard-delete(job null) / soft-delete·마감·만료(availability!=='active')는 비클릭 + dim + 상태 라벨.
              const inactive = !job || it.availability !== "active";
              const bookmarkBtn = (
                <button type="button" className="bookmark-btn" aria-label="즐겨찾기 해제" onClick={() => onUnbookmark(it.jobPostId)}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z" /></svg>
                </button>
              );
              // msg-g2 항목6: 병원 이미지(hospitalImages[0]) 노출. 없으면 회색 placeholder(기존 svg 로고).
              const thumbSrc = job?.hospitalImages?.[0] || null;
              const logo = thumbSrc ? (
                <div className="logo-sm" style={{ backgroundImage: `url(${thumbSrc})`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="병원 이미지" />
              ) : (
                <div className="logo-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V8l7-5 7 5v13" /><path d="M9 21v-6h6v6" /></svg>
                </div>
              );
              if (!job) {
                return (
                  <article className="fav-card" key={it.jobPostId} style={{ opacity: 0.55 }}>
                    <div className="top">
                      {logo}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5>삭제된 공고</h5>
                        <span className="loc">이 공고는 삭제되었습니다.</span>
                      </div>
                      {bookmarkBtn}
                    </div>
                    <div className="keywords">
                      <span style={{ background: "#FEE2E2", color: "#991B1B" }}>{AVAILABILITY_LABELS.deleted}</span>
                    </div>
                  </article>
                );
              }
              const tags: string[] = [];
              if (job.workType && WORK_TYPE_LABELS[job.workType]) tags.push(WORK_TYPE_LABELS[job.workType]);
              (job.jobTypes ?? []).slice(0, 2).forEach((jt) => {
                tags.push(JOB_DUTY_TYPE_LABELS[jt] ?? jt);
              });
              return (
                <article className="fav-card" key={it.jobPostId} style={inactive ? { opacity: 0.6 } : undefined}>
                  <div className="top">
                    {logo}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5>
                        {inactive ? job.hospitalName : <Link href={`/jobs/${job.id}`} style={{ color: "inherit" }}>{job.hospitalName}</Link>}
                      </h5>
                      <span className="loc">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {job.region || "지역 미정"}
                      </span>
                    </div>
                    {bookmarkBtn}
                  </div>
                  {(tags.length > 0 || inactive) && (
                    <div className="keywords">
                      {tags.map((t, i) => <span key={i}>{t}</span>)}
                      {inactive && <span style={{ background: "#FEE2E2", color: "#991B1B" }}>{AVAILABILITY_LABELS[it.availability] ?? "마감"}</span>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mp-empty">즐겨찾는 공고가 없습니다.</div>
        )}
      </div>

      {/* 최근 내가 쓴 글 */}
      <div className="mp-card">
        <div className="mp-card-head">
          <h3>최근 내가 쓴 글</h3>
          <Link href="/mypage/posts" className="all">
            전체보기
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
        {recentPosts && recentPosts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recentPosts.map((p, idx) => {
              const last = idx === recentPosts.length - 1;
              const chip = BOARD_CHIP_STYLE[p.boardType];
              return (
                <Link
                  key={`${p.boardType}-${p.id}`}
                  href={`${POST_BOARD_PATHS[p.boardType]}/${p.id}`}
                  style={{ padding: "14px 0", borderBottom: last ? undefined : "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 12, color: "inherit" }}
                >
                  <span className="tag-notice" style={chip}>{POST_BOARD_LABELS[p.boardType] || p.boardType}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-4)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{formatDate(p.createdAt)}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mp-empty">아직 작성한 글이 없습니다.</div>
        )}
      </div>
    </>
  );
}

/* ===================== 기업 홈 ===================== */
function CorpHome({
  me,
  counts,
  recentJobs,
  router,
}: {
  me: NonNullable<ReturnType<typeof useMe>["me"]>;
  counts: Counts | null;
  recentJobs: MyJob[] | null;
  router: ReturnType<typeof useRouter>;
}) {
  const status = me.licenseStatus ?? "none";
  const strip =
    status === "verified"
      ? { h4: "사업자 인증 완료", p: "인증 마크가 공고에 함께 노출됩니다.", btn: "정보 수정" }
      : status === "pending"
      ? { h4: "사업자 인증 심사 중", p: "관리자 승인 후 인증 마크가 공고에 노출됩니다.", btn: "추가 정보" }
      : status === "rejected"
      ? { h4: "사업자 인증이 반려되었습니다", p: me.licenseReason || "추가 정보에서 다시 인증해 주세요.", btn: "다시 인증" }
      : { h4: "사업자 인증이 필요합니다", p: "사업자등록증을 등록하면 공고에 인증 마크가 노출됩니다.", btn: "인증하기" };

  return (
    <>
      <div className="mp-page-head">
        <div>
          <h2>{me.name}님, 안녕하세요</h2>
          <div className="sub">기업회원 마이페이지에서 채용을 효율적으로 관리하세요.</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-row">
        <div className="quick-card">
          <div className="qc-text">
            <h4>좋은 인재를 찾고 계신가요?</h4>
            <p>채용 공고를 등록하고 치과 종사자에게 바로 노출하세요.</p>
          </div>
          <Link href="/mypage/jobs/new" className="qc-btn">
            채용 공고 등록
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="info-strip">
          <div>
            <h4>{strip.h4}</h4>
            <p>{strip.p}</p>
          </div>
          <Link href="/mypage/extra" className="info-btn">
            {strip.btn}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-grid">
        <Link href="/mypage/jobs?tab=active" className="stat-card">
          <div className="lbl">진행중 채용</div>
          <div className="val">{counts?.jobsActive ?? 0}<span className="unit">건</span></div>
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </div>
        </Link>
        <Link href="/mypage/jobs?tab=closed" className="stat-card muted">
          <div className="lbl">마감된 채용</div>
          <div className="val">{counts?.jobsClosed ?? 0}<span className="unit">건</span></div>
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18" /><path d="M5 7v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7" /><path d="M10 11v6M14 11v6" /></svg>
          </div>
        </Link>
        <Link href="/mypage/jobs?tab=draft" className="stat-card warn">
          <div className="lbl">임시저장</div>
          <div className="val">{counts?.jobsDraft ?? 0}<span className="unit">건</span></div>
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
          </div>
        </Link>
      </div>

      {/* Recent active jobs */}
      <div className="recent-section">
        <h3>최근 진행중 채용</h3>
        {recentJobs && recentJobs.length > 0 ? (
          <div className="mini-list">
            {recentJobs.map((j) => {
              const dday = calcDDay(j.expiredAt);
              const showDday = dday != null && dday >= 0;
              const always = isAlwaysHiring(j);
              return (
                <div
                  className="row"
                  key={j.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/jobs/${j.id}`)}
                >
                  {always ? (
                    <span className="tag dday far">상시채용</span>
                  ) : showDday ? (
                    <span className="tag dday">{dday === 0 ? "D-Day" : `D-${dday}`}</span>
                  ) : (
                    <span className="tag active">진행중</span>
                  )}
                  <div className="title">{j.title}</div>
                  <div className="meta">{jobPeriodLabel(j, formatDate)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mini-list">
            <div className="mp-empty">진행중인 채용이 없습니다.</div>
          </div>
        )}
      </div>
    </>
  );
}
