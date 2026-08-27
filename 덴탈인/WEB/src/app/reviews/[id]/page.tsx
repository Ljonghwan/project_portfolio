"use client";

// P1-reviews FIX: 후기 상세 (Q4/Q7/Q8/Q9/Q11/Q12 적용)
// - jobType 라벨은 REVIEW_JOB_LABEL_OVERRIDE 사용 (치과 의사/위생사/...)
// - rv-react-bar는 like+dislike 2개만 (병원/포스트 북마크 UI 제거)
// - .hosp-row 병원 즐겨찾기 버튼 제거 (hospitalBookmarks 시스템 전체 제거)
// - 4축 별점 RENAME (ratingSalary/Atmosphere/Workload/Welfare)
// - 직원수/원장수 RENAME (staffCount/doctorCount)
// - 근무년차/급여 RENAME (careerType/salaryType)
// - 3-dot more 메뉴: 본인 글 수정/삭제, 타인 글 신고
// - 삭제는 ConfirmModal(variant=danger), 신고는 ReportModal(targetType=post)
// - 댓글은 ReviewCommentSection 사용 (퍼블 .rv-cmt-* 마크업 + 좋아요/싫어요 + 3-dot)
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RatingInput from "@/components/RatingInput";
import ConfirmModal from "@/components/ConfirmModal";
import ReportModal from "@/components/ReportModal";
import ReviewCommentSection from "@/components/ReviewCommentSection";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import {
  type Review,
  RATING_AXES,
  REVIEW_JOB_LABEL_OVERRIDE,
  REVIEW_CAREER_TYPE_LABELS,
  REVIEW_SALARY_TYPE_LABELS,
  type RatingAxisKey,
  formatRelative,
  dislikeReview as apiDislikeReview,
  undislikeReview as apiUndislikeReview,
} from "@/lib/reviews";

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  // 2026-07-09 항목3: 후기 상세 열람은 로그인 필수(개인·기업 공통) → 비로그인은 useMe(true)가 /login으로 리다이렉트.
  const { me, loading: meLoading } = useMe(true);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading);
  const [notFound, setNotFound] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (meLoading) return;
    if (!me) return; // 항목3: 비로그인은 useMe(true)가 /login으로 리다이렉트 — 상세 fetch 생략(401 방지)
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<Review>(`/api/reviews/${id}`, !!me);
      if (!alive) return;
      if (res.success && res.data) setReview(res.data);
      else setNotFound(true);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, me, meLoading]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const guardPersonal = (msg = "개인 회원만 사용할 수 있습니다."): boolean => {
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return false;
    }
    if (me.userType !== "personal") {
      alert(msg);
      return false;
    }
    return true;
  };

  const toggleLike = async () => {
    if (!review) return;
    if (!guardPersonal("개인 회원만 좋아요를 누를 수 있습니다.")) return;
    const willLike = !review.likedByMe;
    setReview({
      ...review,
      likedByMe: willLike,
      likeCount: Math.max(0, review.likeCount + (willLike ? 1 : -1)),
      // 좋아요/싫어요 상호 배타: 좋아요 켜는데 싫어요가 켜져 있었으면 같이 해제
      ...(willLike && review.dislikedByMe
        ? { dislikedByMe: false, dislikeCount: Math.max(0, review.dislikeCount - 1) }
        : {}),
    });
    const res = willLike
      ? await api.post(`/api/reviews/${review.id}/like`, undefined, true)
      : await api.del(`/api/reviews/${review.id}/like`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      setReview({
        ...review,
        likedByMe: !willLike,
        likeCount: Math.max(0, review.likeCount + (willLike ? -1 : 1)),
      });
    }
  };

  const toggleDislike = async () => {
    if (!review) return;
    if (!guardPersonal("개인 회원만 싫어요를 누를 수 있습니다.")) return;
    const willDislike = !review.dislikedByMe;
    setReview({
      ...review,
      dislikedByMe: willDislike,
      dislikeCount: Math.max(0, review.dislikeCount + (willDislike ? 1 : -1)),
      // 상호 배타
      ...(willDislike && review.likedByMe
        ? { likedByMe: false, likeCount: Math.max(0, review.likeCount - 1) }
        : {}),
    });
    try {
      if (willDislike) await apiDislikeReview(review.id);
      else await apiUndislikeReview(review.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
      setReview({
        ...review,
        dislikedByMe: !willDislike,
        dislikeCount: Math.max(0, review.dislikeCount + (willDislike ? -1 : 1)),
      });
    }
  };

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    const res = await api.del(`/api/reviews/${review.id}`, true);
    setDeleting(false);
    if (!res.success) {
      alert(res.message || "삭제에 실패했습니다.");
      return;
    }
    setDeleteOpen(false);
    router.push("/reviews");
  };

  if (showLoading) {
    return (
      <>
        <SiteHeader />
        <main className="wrap"><div className="noti-state load-state"><LoadingIndicator fullPage={false} /></div></main>
        <SiteFooter />
      </>
    );
  }

  if (notFound || !review) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <div style={{ padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>후기를 찾을 수 없습니다.</p>
            <Link href="/reviews" className="rv-cancel" style={{ marginTop: 16, display: "inline-flex" }}>
              목록으로
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const showMetrics = review.staffCount != null || review.doctorCount != null;
  const openReport = () => {
    setMenuOpen(false);
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    setReportOpen(true);
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/reviews">병원후기</Link> · <b>상세</b>
        </div>

        <article className="rv-detail">
          <div className="rv-detail-top">
            <div className="ava">{review.authorAlias.charAt(0)}</div>
            <div className="who">
              <div className="who-row">
                <span className="nick">{review.authorAlias}</span>
                {review.authorLicenseVerified && (
                  <span className="verify" title="면허증 인증 완료">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 12l2 2 4-4M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                    </svg>
                  </span>
                )}
                {review.isMine && (
                  <span style={{ color: "var(--brand-ink)", fontWeight: 700, fontSize: 12 }}>(내 글)</span>
                )}
                <span className="time">· {formatRelative(review.createdAt)}</span>
              </div>
              <div className="hosp-row">
                <span className="loc">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {review.region}
                </span>
                <span className="hosp">{review.hospitalName}</span>
              </div>
              <div className="rv-meta-extra">
                <span>{REVIEW_JOB_LABEL_OVERRIDE[review.jobType] ?? review.jobType}</span>
                {review.careerType && (
                  <>
                    <span>·</span>
                    <span>{REVIEW_CAREER_TYPE_LABELS[review.careerType]}</span>
                  </>
                )}
                {review.salaryType && (
                  <>
                    <span>·</span>
                    <span>{REVIEW_SALARY_TYPE_LABELS[review.salaryType]}</span>
                  </>
                )}
              </div>
            </div>
            <div className="more-wrap" ref={menuRef}>
              <button
                type="button"
                className="icon-btn more-btn"
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <div className="rv-more-menu" role="menu">
                  {review.isMine ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(`/reviews/${review.id}/edit`);
                        }}
                      >
                        {/* 시안 review-list.html 아이콘 복원 (수정) */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        수정하기
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={() => {
                          setMenuOpen(false);
                          setDeleteOpen(true);
                        }}
                      >
                        {/* 시안 아이콘 복원 (삭제) */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                        삭제하기
                      </button>
                      {/* p2-3 작업2: 사용자 결정 — 작성자 본인 글에는 신고하기 미노출(시안 4항목과 의도적 불일치). */}
                    </>
                  ) : (
                    <button type="button" role="menuitem" className="danger" onClick={openReport}>
                      {/* 시안 아이콘 복원 (신고) */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 22V4M4 16h13l3-6-3-6H4" />
                      </svg>
                      신고하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {showMetrics && (
            <div className="rv-metrics">
              <div className="rv-metric">
                <div className="k">직원수</div>
                <div className="v">
                  {review.staffCount ?? "—"}
                  <em>명</em>
                </div>
              </div>
              <div className="rv-metric">
                <div className="k">원장수</div>
                <div className="v">
                  {review.doctorCount ?? "—"}
                  <em>명</em>
                </div>
              </div>
            </div>
          )}

          <div className="rv-stars-block">
            {RATING_AXES.map((ax) => {
              const v = (review[ax.key as RatingAxisKey] as number | null) ?? 0;
              return (
                <div key={ax.key} className="rv-star-row">
                  <span className="k">{ax.label}</span>
                  <RatingInput value={v} readOnly size="sm" />
                  <span className="v">{v ? v.toFixed(1) : "—"}</span>
                </div>
              );
            })}
          </div>

          <div className="rv-body">{review.content}</div>

          <div className="rv-react-bar">
            <button
              type="button"
              className={review.likedByMe ? "up" : ""}
              onClick={toggleLike}
              aria-label={review.likedByMe ? "좋아요 해제" : "좋아요"}
            >
              <svg viewBox="0 0 24 24" fill={review.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
              </svg>
              {review.likeCount}
            </button>
            <button
              type="button"
              className={review.dislikedByMe ? "down on" : "down"}
              onClick={toggleDislike}
              aria-label={review.dislikedByMe ? "싫어요 해제" : "싫어요"}
            >
              <svg
                viewBox="0 0 24 24"
                fill={review.dislikedByMe ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: "rotate(180deg)" }}
              >
                <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
              </svg>
              {review.dislikeCount}
            </button>
          </div>

          <ReviewCommentSection
            boardId={review.id}
            meId={me?.id ?? null}
            meUserType={me?.userType ?? null}
            meLoaded={!meLoading}
            commentCount={review.commentCount}
            onCountChange={(delta) =>
              setReview((cur) =>
                cur ? { ...cur, commentCount: Math.max(0, cur.commentCount + delta) } : cur
              )
            }
          />
        </article>
      </main>
      <SiteFooter />

      <ConfirmModal
        open={deleteOpen}
        variant="danger"
        title="글을 삭제하시겠습니까?"
        description="삭제된 글은 복구할 수 없습니다."
        cancelLabel="아니오"
        confirmLabel="확인"
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={handleDelete}
        busy={deleting}
      />

      <ReportModal
        open={reportOpen}
        boardType="review"
        targetType="post"
        boardId={review.id}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
