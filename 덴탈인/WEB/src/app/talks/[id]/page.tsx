"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import SiteFooter from "@/components/SiteFooter";
import ConfirmModal from "@/components/ConfirmModal";
import ReportModal from "@/components/ReportModal";
import Lightbox from "@/components/Lightbox";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { TALK_CATEGORY_LABELS, type TalkPost, formatRelative, avatarColorClass } from "@/lib/talks";
import ReviewCommentSection from "@/components/ReviewCommentSection";
import VerifyBadge from "@/components/VerifyBadge";

export default function TalkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading: meLoading } = useMe(false);
  const [post, setPost] = useState<TalkPost | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinimumLoading(loading);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 }); // 첨부 사진 확대보기
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (meLoading) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await api.get<TalkPost>(`/api/talks/${id}`, !!me);
      if (!alive) return;
      if (res.success && res.data) setPost(res.data);
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
    if (!post) return;
    if (!guardPersonal("개인 회원만 좋아요를 누를 수 있습니다.")) return;
    const willLike = !post.likedByMe;
    const hadDislike = post.dislikedByMe;
    setPost({
      ...post,
      likedByMe: willLike,
      likeCount: Math.max(0, post.likeCount + (willLike ? 1 : -1)),
      dislikedByMe: willLike ? false : post.dislikedByMe,
      dislikeCount: willLike && hadDislike ? Math.max(0, post.dislikeCount - 1) : post.dislikeCount,
    });
    const res = willLike
      ? await api.post(`/api/talks/${post.id}/like`, undefined, true)
      : await api.del(`/api/talks/${post.id}/like`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      setPost(post);
      return;
    }
    if (willLike && hadDislike) {
      await api.del(`/api/talks/${post.id}/dislike`, true);
    }
  };

  const toggleDislike = async () => {
    if (!post) return;
    if (!guardPersonal("개인 회원만 싫어요를 누를 수 있습니다.")) return;
    const willDislike = !post.dislikedByMe;
    const hadLike = post.likedByMe;
    setPost({
      ...post,
      dislikedByMe: willDislike,
      dislikeCount: Math.max(0, post.dislikeCount + (willDislike ? 1 : -1)),
      likedByMe: willDislike ? false : post.likedByMe,
      likeCount: willDislike && hadLike ? Math.max(0, post.likeCount - 1) : post.likeCount,
    });
    const res = willDislike
      ? await api.post(`/api/talks/${post.id}/dislike`, undefined, true)
      : await api.del(`/api/talks/${post.id}/dislike`, true);
    if (!res.success) {
      alert(res.message || "처리에 실패했습니다.");
      setPost(post);
      return;
    }
    if (willDislike && hadLike) {
      await api.del(`/api/talks/${post.id}/like`, true);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    setDeleting(true);
    const res = await api.del(`/api/talks/${post.id}`, true);
    setDeleting(false);
    if (!res.success) {
      alert(res.message || "삭제에 실패했습니다.");
      return;
    }
    setDeleteOpen(false);
    router.push("/talks");
  };

  const openReport = () => {
    setMenuOpen(false);
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    setReportOpen(true);
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
            <p style={{ fontSize: 16, fontWeight: 700 }}>게시글을 찾을 수 없습니다.</p>
            <Link
              href="/talks"
              className="btn cancel"
              style={{ marginTop: 16, display: "inline-flex" }}
            >
              목록으로
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/talks">익명 수다방</Link> · <b>상세</b>
        </div>

        <article className="detail">
          <div className="detail-top">
            <div className={`ava ${avatarColorClass(post.authorAlias)}`} aria-hidden="true">{post.authorAlias.charAt(0)}</div>
            <div className="who">
              <span className="nick">
                {post.authorAlias}
                {post.authorLicenseVerified && <VerifyBadge title="인증 완료" />}
                {post.isMine && (
                  <span style={{ color: "var(--brand-ink)", fontWeight: 700, fontSize: 12, marginLeft: 6 }}>
                    (내 글)
                  </span>
                )}
              </span>
              <span className="time">
                {TALK_CATEGORY_LABELS[post.category]} · {formatRelative(post.createdAt)} · 조회 {post.viewCount}
              </span>
            </div>
            <div className="more-wrap" ref={menuRef}>
              <button
                type="button"
                className="icon-btn"
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className="rv-more-menu" role="menu">
                  {post.isMine ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(`/talks/${post.id}/edit`);
                        }}
                      >
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
                        삭제하기
                      </button>
                      {/* BUG-3(p2-home-talk-urgent-fullqa): owner 메뉴는 수정/삭제 2항목만(신고 제거).
                          CLAUDE.md "신고는 비owner" + 후기/급구 owner 메뉴 정합. 신고는 아래 비owner 분기에만. */}
                    </>
                  ) : (
                    <button type="button" role="menuitem" className="danger" onClick={openReport}>
                      신고하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <h1 className="detail-title">{post.title}</h1>
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

          <div className="detail-react">
            <button
              type="button"
              className={`react-btn ${post.likedByMe ? "on" : ""}`}
              onClick={toggleLike}
            >
              <svg viewBox="0 0 24 24" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
              </svg>
              좋아요 {post.likeCount}
            </button>
            <button
              type="button"
              className={`react-btn ${post.dislikedByMe ? "on" : ""}`}
              onClick={toggleDislike}
            >
              <svg
                viewBox="0 0 24 24"
                fill={post.dislikedByMe ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: "rotate(180deg)" }}
              >
                <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
              </svg>
              싫어요 {post.dislikeCount}
            </button>
          </div>

          <div id="comments">
            {/* 작업2: 후기와 동일한 댓글 UI(rv-cmt) 공통 컴포넌트 사용. */}
            <ReviewCommentSection
              boardType="talk"
              boardId={post.id}
              meId={me?.id ?? null}
              meUserType={me?.userType ?? null}
              meLoaded={!meLoading}
              commentCount={post.commentCount}
              onCountChange={(delta) => setPost((cur) => (cur ? { ...cur, commentCount: Math.max(0, cur.commentCount + delta) } : cur))}
            />
          </div>
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
        boardType="talk"
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
