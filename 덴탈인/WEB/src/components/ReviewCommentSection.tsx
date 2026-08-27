"use client";

// P1-reviews FIX(Q7.A): review 전용 댓글 영역. 퍼블 시안 `.rv-cmt-input` / `.rv-cmt-head` / `.rv-cmt-list` / `.rv-cmt` 패턴.
// like/dislike + 답글 1단계 + 본인 댓글 3-dot 메뉴(수정/삭제). 타인 댓글은 메뉴 미노출(신고 기능 제거).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CommentBoardType,
  type CommentItem,
  type CommentNode,
  createComment,
  deleteComment,
  dislikeComment,
  formatRelative,
  likeComment,
  listComments,
  undislikeComment,
  unlikeComment,
  updateComment,
} from "@/lib/comments";
import ConfirmModal from "./ConfirmModal";
import ReportModal from "./ReportModal";

type Props = {
  boardId: number;
  meId: number | null;
  meUserType: "personal" | "corp" | null;
  meLoaded: boolean;
  onCountChange?: (delta: 1 | -1) => void;
  // 헤더 "댓글 N"에 쓸 총 댓글 수(부모+답글, 살아있는 것만 = denormalized commentCount).
  // 목록 카드와 동일 출처로 카운트 불일치 방지. total(부모 행 수)은 페이지네이션 전용.
  commentCount?: number;
  // p2-talk-urgent-pixel-fix 작업2: 후기 댓글 UI(rv-cmt)를 talk/urgent에도 공통 사용.
  boardType?: CommentBoardType;
};

const COMMENT_MAX = 1000;

export default function ReviewCommentSection({ boardId, meId, meUserType, meLoaded, onCountChange, commentCount, boardType = "review" }: Props) {
  const router = useRouter();
  // G1 F3: 댓글 작성/답글은 전 게시판 로그인(개인+기업) 허용(구 review·talk personal 전용 폐기).
  // 좋아요/싫어요는 여전히 서버 personal 전용(guardPersonal 직접 사용).
  const authPersonalOnly = false;
  // 비owner 댓글 신고: urgent만 실 ReportModal(기존 정책). review/talk 댓글은 신고 미노출.
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [items, setItems] = useState<CommentNode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // FULLQA #1 CRITICAL-2: 댓글/답글/수정 모두 동기 락으로 3회 연타 중복 차단.
  const submitLockRef = useRef(false);
  const replyLockRef = useRef(false);
  const editLockRef = useRef(false);

  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  // 작업1 FIX: @alias prefix를 입력값에 prefill하지 않고 별도 보관 → 빈 본문 검증이 정확히 동작.
  const [replyToAlias, setReplyToAlias] = useState<string>("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      const res = await listComments(boardType, boardId, p, pageSize);
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
        setPage(res.data.page);
      } else {
        setItems([]);
        setTotal(0);
      }
      setLoading(false);
    },
    [boardId, boardType]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    if (menuOpen == null) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const guardPersonal = useCallback(
    (msg = "개인 회원만 사용할 수 있습니다."): boolean => {
      if (!meLoaded) return false;
      if (!meId) {
        if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
        return false;
      }
      if (meUserType !== "personal") {
        alert(msg);
        return false;
      }
      return true;
    },
    [meId, meUserType, meLoaded, router]
  );

  // urgent 댓글 작성은 로그인만(개인+기업). 비로그인은 confirm→login.
  const requireLogin = useCallback((): boolean => {
    if (!meLoaded) return false;
    if (!meId) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      return false;
    }
    return true;
  }, [meId, meLoaded, router]);

  const guardAuthor = useCallback(
    (msg?: string): boolean => (authPersonalOnly ? guardPersonal(msg) : requireLogin()),
    [authPersonalOnly, guardPersonal, requireLogin]
  );

  const patchItem = (id: number, patch: Partial<CommentItem>) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id === id) return { ...p, ...patch } as CommentNode;
        if (p.replies.some((r) => r.id === id)) {
          return {
            ...p,
            replies: p.replies.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          } as CommentNode;
        }
        return p;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    if (!guardAuthor("개인 회원만 댓글을 작성할 수 있습니다.")) return;
    const c = content.trim();
    if (!c) {
      alert("댓글 내용을 입력하세요.");
      return;
    }
    submitLockRef.current = true;
    setSubmitting(true);
    const res = await createComment({ boardType, boardId, content: c });
    setSubmitting(false);
    if (!res.success) {
      submitLockRef.current = false;
      alert(res.message || "댓글 등록에 실패했습니다.");
      return;
    }
    setContent("");
    onCountChange?.(1);
    await load(page);
    submitLockRef.current = false;
  };

  const handleReplySubmit = async (parentId: number) => {
    if (replyLockRef.current) return;
    if (!guardAuthor("개인 회원만 답글을 작성할 수 있습니다.")) return;
    // 순수 본문(@alias 미포함) 기준으로 빈 값 차단 — 멘션만으로는 등록 불가.
    const body = replyContent.trim();
    if (!body) {
      alert("답글 내용을 입력하세요.");
      return;
    }
    const fullContent = replyToAlias ? `@${replyToAlias} ${body}` : body;
    if (fullContent.length > COMMENT_MAX) {
      alert(`답글은 ${COMMENT_MAX}자 이내여야 합니다.`);
      return;
    }
    replyLockRef.current = true;
    const res = await createComment({ boardType, boardId, parentId, content: fullContent });
    if (!res.success) {
      replyLockRef.current = false;
      alert(res.message || "답글 등록에 실패했습니다.");
      return;
    }
    setReplyTo(null);
    setReplyContent("");
    setReplyToAlias("");
    onCountChange?.(1);
    await load(page);
    replyLockRef.current = false;
  };

  const handleEditSubmit = async (id: number) => {
    if (editLockRef.current) return;
    const c = editContent.trim();
    if (!c) {
      alert("댓글 내용을 입력하세요.");
      return;
    }
    editLockRef.current = true;
    const res = await updateComment(id, c);
    if (!res.success) {
      editLockRef.current = false;
      alert(res.message || "수정에 실패했습니다.");
      return;
    }
    setEditId(null);
    setEditContent("");
    await load(page);
    editLockRef.current = false;
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteComment(deleteTarget.id);
    setDeleting(false);
    if (!res.success) {
      alert(res.message || "삭제에 실패했습니다.");
      return;
    }
    setDeleteTarget(null);
    onCountChange?.(-1);
    await load(page);
  };

  const toggleLike = async (c: CommentItem) => {
    if (!guardPersonal("개인 회원만 좋아요를 누를 수 있습니다.")) return;
    const willLike = !c.likedByMe;
    // 상호 배타는 서버 트랜잭션이 보장 — 클라이언트는 optimistic UI만 같이 갱신.
    const willClearDislike = willLike && c.dislikedByMe;
    patchItem(c.id, {
      likedByMe: willLike,
      likeCount: Math.max(0, c.likeCount + (willLike ? 1 : -1)),
      dislikedByMe: willClearDislike ? false : c.dislikedByMe,
      dislikeCount: willClearDislike ? Math.max(0, c.dislikeCount - 1) : c.dislikeCount,
    });
    try {
      if (willLike) await likeComment(c.id);
      else await unlikeComment(c.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
      await load(page);
    }
  };

  const toggleDislike = async (c: CommentItem) => {
    if (!guardPersonal("개인 회원만 싫어요를 누를 수 있습니다.")) return;
    const willDislike = !c.dislikedByMe;
    const willClearLike = willDislike && c.likedByMe;
    patchItem(c.id, {
      dislikedByMe: willDislike,
      dislikeCount: Math.max(0, c.dislikeCount + (willDislike ? 1 : -1)),
      likedByMe: willClearLike ? false : c.likedByMe,
      likeCount: willClearLike ? Math.max(0, c.likeCount - 1) : c.likeCount,
    });
    try {
      if (willDislike) await dislikeComment(c.id);
      else await undislikeComment(c.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
      await load(page);
    }
  };

  // 답글 본문의 선행 @alias는 시안 `.at` 스팬으로 강조(나머지는 일반 텍스트).
  const renderMent = (c: CommentItem, isReply: boolean) => {
    if (isReply) {
      const m = c.content.match(/^@(\S+)\s+([\s\S]*)$/);
      if (m) {
        return (
          <>
            <span className="at">@{m[1]}</span> {m[2]}
          </>
        );
      }
    }
    return c.content;
  };

  const renderItem = (c: CommentItem, isReply: boolean) => {
    const isEditing = editId === c.id && !c.isDeleted;
    // G1 F2: 익명닉네임 첫 글자를 이니셜 아바타로.
    const avaTag = c.authorAlias.charAt(0);
    return (
      <div key={c.id} className={`rv-cmt${isReply ? " reply" : ""}${c.isDeleted ? " deleted" : ""}`}>
        <div className="ava" aria-hidden="true">{c.isDeleted ? "—" : avaTag}</div>
        <div className="body">
          <div className="row1">
            <span className="nick">{c.isDeleted ? "삭제된 댓글" : c.authorAlias}</span>
            {/* G1 F3: 작성자 면허/사업자 인증뱃지(글 뱃지와 동일 기준 licenseStatus='verified'). */}
            {!c.isDeleted && c.authorVerified && (
              <span className="cmt-verify" title="인증 회원" aria-label="인증 회원">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
              </span>
            )}
            {c.isMine && !c.isDeleted && <span className="mine-tag">내 댓글</span>}
            <span className="time">{formatRelative(c.createdAt)}</span>
          </div>
          {isEditing ? (
            <div className="rv-cmt-edit">
              <textarea
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value.slice(0, COMMENT_MAX))}
                maxLength={COMMENT_MAX}
              />
              <div className="rv-cmt-edit-actions">
                <span className="ct">{editContent.length}/{COMMENT_MAX}</span>
                <button type="button" onClick={() => { setEditId(null); setEditContent(""); }}>취소</button>
                <button type="button" className="primary" onClick={() => handleEditSubmit(c.id)}>저장</button>
              </div>
            </div>
          ) : (
            <div className="ment">{renderMent(c, isReply)}</div>
          )}
          {!c.isDeleted && !isEditing && (
            <div className="row2">
              <button type="button" className={c.likedByMe ? "on" : ""} onClick={() => toggleLike(c)} aria-label="좋아요">
                <svg viewBox="0 0 24 24" fill={c.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
                </svg>
                {c.likeCount}
              </button>
              <button type="button" className={c.dislikedByMe ? "on" : ""} onClick={() => toggleDislike(c)} aria-label="싫어요">
                <svg
                  viewBox="0 0 24 24"
                  fill={c.dislikedByMe ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ transform: "rotate(180deg)" }}
                >
                  <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
                </svg>
                {c.dislikeCount}
              </button>
              {!isReply && (
                <button
                  type="button"
                  className="reply-btn"
                  onClick={() => {
                    if (!guardAuthor("개인 회원만 답글을 작성할 수 있습니다.")) return;
                    const open = replyTo !== c.id;
                    setReplyTo(open ? c.id : null);
                    setReplyContent("");
                    setReplyToAlias(open ? c.authorAlias : "");
                  }}
                >
                  답글달기
                </button>
              )}
              {c.isMine && (
                <>
                  <button
                    type="button"
                    className="more"
                    onClick={() => setMenuOpen((cur) => (cur === c.id ? null : c.id))}
                    aria-label="더보기"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen === c.id}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                  {menuOpen === c.id && (
                    <div className="rv-more-menu" ref={menuRef} role="menu">
                      {/* 작업6: 글 컨텍스트메뉴와 동일한 시안 아이콘/마크업 사용 */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setEditId(c.id);
                          setEditContent(c.content);
                          setMenuOpen(null);
                        }}
                      >
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
                          setDeleteTarget(c);
                          setMenuOpen(null);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                        삭제하기
                      </button>
                    </div>
                  )}
                </>
              )}
              {/* urgent 댓글: 비owner 신고(실 ReportModal). review/talk은 미노출. */}
              {!c.isMine && boardType === "urgent" && (
                <button
                  type="button"
                  className="reply-btn"
                  onClick={() => {
                    if (!requireLogin()) return;
                    setReportCommentId(c.id);
                  }}
                >
                  신고
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="rv-cmt-area" aria-label="댓글">
      <form className="rv-cmt-input" onSubmit={handleSubmit}>
        <textarea
          rows={3}
          placeholder={meId ? "댓글을 입력하세요." : "로그인 후 댓글을 작성할 수 있습니다."}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, COMMENT_MAX))}
          maxLength={COMMENT_MAX}
        />
        <button
          type="submit"
          className="rv-cmt-submit"
          disabled={submitting || !meLoaded}
        >
          {submitting ? "등록 중…" : "등록"}
        </button>
      </form>

      {/* 헤더는 목록 카드와 동일 denormalized commentCount(부모+답글). total은 페이지네이션 전용. */}
      <div className="rv-cmt-head">댓글 <em>{commentCount ?? total}</em></div>

      {loading ? (
        <div className="rv-cmt-empty">댓글을 불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="rv-cmt-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>
      ) : (
        <div className="rv-cmt-list">
          {items.map((c) => (
            <div key={c.id}>
              {renderItem(c, false)}
              {replyTo === c.id && !c.isDeleted && (
                <div className="rv-reply-input">
                  <textarea
                    rows={2}
                    placeholder={`@${c.authorAlias} 답글을 입력하세요.`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value.slice(0, COMMENT_MAX))}
                    maxLength={COMMENT_MAX}
                  />
                  <div className="rv-reply-actions">
                    <button type="button" onClick={() => { setReplyTo(null); setReplyContent(""); setReplyToAlias(""); }}>취소</button>
                    <button type="button" className="primary" onClick={() => handleReplySubmit(c.id)}>등록</button>
                  </div>
                </div>
              )}
              {c.replies.length > 0 && c.replies.map((r) => renderItem(r, true))}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="rv-page">
          <button
            type="button"
            className="nav"
            onClick={() => void load(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="이전"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                type="button"
                className={p === page ? "on" : ""}
                onClick={() => void load(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            className="nav"
            onClick={() => void load(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="다음"
          >
            ›
          </button>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget != null}
        variant="danger"
        title="댓글을 삭제하시겠습니까?"
        description="삭제된 댓글은 복구할 수 없습니다."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        busy={deleting}
      />

      {boardType === "urgent" && (
        <ReportModal
          open={reportCommentId != null}
          boardType="urgent"
          targetType="comment"
          boardId={reportCommentId ?? 0}
          onClose={() => setReportCommentId(null)}
        />
      )}
    </section>
  );
}
