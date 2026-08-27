"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import SiteFooter from "@/components/SiteFooter";
import UrgentApplyAside from "@/components/UrgentApplyAside";
import ConfirmModal from "@/components/ConfirmModal";
import ReportModal from "@/components/ReportModal";
import Lightbox from "@/components/Lightbox";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import {
  URGENT_JOB_TYPE_LABELS,
  URGENT_WORK_TYPE_LABELS,
  formatRelative,
  formatUrgentSalary,
  isExpired,
  type UrgentJobType,
  type UrgentPost,
  type UrgentWorkType,
} from "@/lib/urgents";
import ReviewCommentSection from "@/components/ReviewCommentSection";

export default function UrgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading: meLoading } = useMe(false);
  const [post, setPost] = useState<UrgentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 }); // 첨부 사진 확대보기

  useEffect(() => {
    if (meLoading) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<UrgentPost>(`/api/urgents/${id}`, !!me);
      if (!alive) return;
      if (res.success && res.data) setPost(res.data);
      else setNotFound(true);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, me, meLoading]);

  const toggleBookmark = async () => {
    if (!post) return;
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    setBookmarkBusy(true);
    const willOn = !post.bookmarked;
    setPost({
      ...post,
      bookmarked: willOn,
      bookmarkCount: Math.max(0, post.bookmarkCount + (willOn ? 1 : -1)),
    });
    const res = willOn
      ? await api.post(`/api/urgents/${post.id}/bookmark`, undefined, true)
      : await api.del(`/api/urgents/${post.id}/bookmark`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      setPost({
        ...post,
        bookmarked: !willOn,
        bookmarkCount: Math.max(0, post.bookmarkCount + (willOn ? -1 : 1)),
      });
    }
    setBookmarkBusy(false);
  };

  const handleDelete = async () => {
    if (!post) return;
    setDeleting(true);
    const res = await api.del(`/api/urgents/${post.id}`, true);
    setDeleting(false);
    if (!res.success) {
      alert(res.message || "삭제에 실패했습니다.");
      return;
    }
    setDeleteOpen(false);
    router.push("/urgents");
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

  if (notFound || !post) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <div style={{ padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>급구 공고를 찾을 수 없습니다.</p>
            <Link href="/urgents" className="btn cancel" style={{ marginTop: 16, display: "inline-flex" }}>
              목록으로
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const expired = isExpired(post.expiredAt);
  // BUG-1(p2-urgents-full-qa): address(다음 우편번호 roadAddress)가 시/도 포함한 전체주소 → 권위 소스.
  // region(sido)을 중복 prepend하면 "서울 서울 강남구…"(실데이터) 또는 "대구 경기…"(시드 시/도 불일치)로 깨짐.
  // 따라서 위치 표시는 address(+상세)를 단일 출처로. address 없을 때만 region fallback.
  const addrDetailSuffix = post.addressDetail ? `, ${post.addressDetail}` : "";
  const workLocation = post.address ? `${post.address}${addrDetailSuffix}` : (post.region || "-");

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/urgents">급구 게시판</Link> · <b>상세</b>
        </div>

        {expired && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#FFF1EE",
              border: "1px solid #FFD4C2",
              borderRadius: 8,
              color: "#B5421F",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            마감된 급구 공고입니다.
          </div>
        )}

        <div className="detail-grid">
          <article className="detail">
            <div className="detail-head">
              <span className="urgent-flag">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
                급구
              </span>
              <span className="clinic">{post.hospitalName}</span>
              <span className="time">{formatRelative(post.createdAt)} · 조회 {post.viewCount}</span>
              {/* 작업2: time이 .detail-head .time{margin-left:auto}로 우측 끝 → more-wrap 중복 marginLeft 제거(시안 일치).
                  버그2: position:relative를 인라인→CSS(.detail-head .more-wrap)로 이전 → 모바일 @640에서 absolute 오버라이드 가능(인라인은 미디어쿼리로 못 덮음). */}
              <div className="more-wrap">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="더보기"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="more-menu">
                    {post.isMine ? (
                      <>
                        <button
                          type="button"
                          onClick={() => router.push(`/urgents/${post.id}/edit`)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => {
                            setMenuOpen(false);
                            setDeleteOpen(true);
                          }}
                        >
                          삭제
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setMenuOpen(false);
                          if (!me) {
                            if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
                            return;
                          }
                          setReportOpen(true);
                        }}
                      >
                        신고
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h2 className="detail-title">{post.title}</h2>

            <div className="spec">
              <dl>
                <dt>병원명</dt>
                <dd>{post.hospitalName}</dd>

                <dt>근무지</dt>
                <dd>{workLocation}</dd>

                <dt>담당업무</dt>
                <dd>
                  {post.jobTypes.length === 0 && <span>-</span>}
                  {post.jobTypes.map((j) => (
                    <span key={j} className="pill-tag brand">
                      {URGENT_JOB_TYPE_LABELS[j as UrgentJobType]}
                    </span>
                  ))}
                </dd>

                <dt>근무형태</dt>
                <dd>
                  {post.workTypes.length === 0 && <span>-</span>}
                  {post.workTypes.map((w) => (
                    <span key={w} className="pill-tag">
                      {URGENT_WORK_TYPE_LABELS[w as UrgentWorkType]}
                    </span>
                  ))}
                </dd>

                <dt>모집인원</dt>
                <dd>{post.headcount}명</dd>

                <dt>급여</dt>
                <dd>
                  <span className="pay">
                    {formatUrgentSalary(post.salaryType, post.salaryAmount)}
                  </span>
                </dd>
              </dl>
            </div>

            <div className="detail-body">{post.content}</div>

            {post.images.length > 0 && (
              <div className="detail-images">
                {post.images.map((src, i) => (
                  <button
                    type="button"
                    className="ph"
                    key={`${src}-${i}`}
                    style={{ background: "none", padding: 0, border: 0, cursor: "pointer" }}
                    onClick={() => setLightbox({ open: true, index: i })}
                    aria-label={`첨부 이미지 ${i + 1} 확대보기`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`첨부 이미지 ${i + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "var(--r-md)",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div id="comments">
              {/* 작업2: 후기와 동일한 댓글 UI(rv-cmt) 공통 컴포넌트 사용. */}
              <ReviewCommentSection
                boardType="urgent"
                boardId={post.id}
                meId={me?.id ?? null}
                meUserType={me?.userType ?? null}
                meLoaded={!meLoading}
                commentCount={post.commentCount}
                onCountChange={(delta) =>
                  setPost((cur) =>
                    cur ? { ...cur, commentCount: Math.max(0, cur.commentCount + delta) } : cur
                  )
                }
              />
            </div>
          </article>

          <UrgentApplyAside post={post} onToggleBookmark={toggleBookmark} bookmarkBusy={bookmarkBusy} />
        </div>
      </main>
      <SiteFooter />

      <ConfirmModal
        open={deleteOpen}
        variant="danger"
        title="급구 공고를 삭제하시겠습니까?"
        description="삭제된 공고는 복구할 수 없습니다."
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
        boardType="urgent"
        targetType="post"
        boardId={post.id}
        onClose={() => setReportOpen(false)}
      />

      <Lightbox
        images={post.images}
        index={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
