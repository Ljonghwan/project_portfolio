"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ConfirmModal from "@/components/ConfirmModal";
import { useMe } from "@/lib/useMe";
import {
  deleteQna,
  getQna,
  QNA_STATUS_LABELS,
  updateQna,
  type SupportQnaItem,
} from "@/lib/qna";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function QnaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, loading: meLoading } = useMe(true);
  const [qna, setQna] = useState<SupportQnaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 삭제 컨펌: native confirm → 공통 ConfirmModal(보드 표준 패턴)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmRef = useRef(false);

  useEffect(() => {
    if (meLoading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await getQna(Number(id));
      if (!alive) return;
      if (res.success && res.data) {
        setQna(res.data);
        setTitle(res.data.title);
        setContent(res.data.content);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id, meLoading, me, router]);

  const handleUpdate = async () => {
    if (!qna) return;
    const t = title.trim();
    const c = content.trim();
    if (!t) { alert("제목을 입력하세요."); return; }
    if (!c) { alert("내용을 입력하세요."); return; }
    if (t.length > TITLE_MAX) { alert(`제목은 ${TITLE_MAX}자 이내여야 합니다.`); return; }
    if (c.length > CONTENT_MAX) { alert(`내용은 ${CONTENT_MAX}자 이내여야 합니다.`); return; }
    setSubmitting(true);
    const res = await updateQna(qna.id, { title: t, content: c });
    setSubmitting(false);
    if (!res.success) {
      alert(res.message || "수정에 실패했습니다.");
      return;
    }
    if (res.data) setQna(res.data);
    setEditing(false);
    alert("문의가 수정되었습니다.");
  };

  const runDelete = async () => {
    if (!qna || confirmRef.current) return;
    confirmRef.current = true;
    setConfirmBusy(true);
    const res = await deleteQna(qna.id).finally(() => { confirmRef.current = false; });
    setConfirmBusy(false);
    setConfirmOpen(false);
    if (!res.success) {
      alert(res.message || "삭제에 실패했습니다.");
      return;
    }
    alert("문의를 삭제했습니다.");
    router.push("/support/qna");
  };

  if (meLoading || loading) {
    return (
      <>
        <SiteHeader />
        <main className="wrap"><div style={{ padding: 60, textAlign: "center" }}>불러오는 중…</div></main>
        <SiteFooter />
      </>
    );
  }

  if (notFound || !qna) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <div style={{ padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>문의를 찾을 수 없습니다.</p>
            <Link href="/support/qna" className="btn cancel" style={{ marginTop: 16, display: "inline-flex" }}>
              목록으로
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const canEdit = qna.isMine && qna.status === "open";

  return (
    <>
      <SiteHeader />
      <main className="wrap support-shell" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/support/qna">1:1 문의</Link> · <b>상세</b>
        </div>

        <article className="qna-detail">
          <div className="qna-detail-head">
            <span className={`qna-status ${qna.status}`}>{QNA_STATUS_LABELS[qna.status]}</span>
            <span className="qna-date">{formatDate(qna.createdAt)}</span>
            {qna.isMine && (
              <div className="qna-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {canEdit && !editing && (
                  <button type="button" className="btn cancel" onClick={() => setEditing(true)}>수정</button>
                )}
                {qna.isMine && (
                  <button type="button" className="btn cancel" onClick={() => setConfirmOpen(true)} style={{ color: "#B5421F", borderColor: "#FFD4C2" }}>삭제</button>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="form-card qna-form" style={{ marginTop: 12 }}>
              <div className="form-row">
                <label className="lab">제목 <span className="req">*</span></label>
                <input className="input" type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))} maxLength={TITLE_MAX} />
                <div className="ct">{title.length}/{TITLE_MAX}</div>
              </div>
              <div className="form-row">
                <label className="lab">내용 <span className="req">*</span></label>
                <textarea className="textarea" rows={8} value={content} onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))} maxLength={CONTENT_MAX} />
                <div className="ct">{content.length}/{CONTENT_MAX}</div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn cancel" onClick={() => { setEditing(false); setTitle(qna.title); setContent(qna.content); }}>취소</button>
                <button type="button" className="btn submit" disabled={submitting} onClick={handleUpdate}>
                  {submitting ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="qna-detail-title">{qna.title}</h1>
              <div className="qna-detail-body">{qna.content}</div>
            </>
          )}

          {qna.answer && !editing && (
            <div className="qna-answer">
              <div className="qna-answer-head">
                <span className="badge">운영팀 답변</span>
                <span className="qna-date">{formatDate(qna.answeredAt)}</span>
              </div>
              <div className="qna-answer-body">{qna.answer}</div>
            </div>
          )}

          {qna.status === "open" && !qna.answer && !editing && (
            <div className="qna-waiting">
              아직 답변이 등록되지 않았습니다. 평일 기준 24시간 이내 답변드리겠습니다.
            </div>
          )}
        </article>

        <div style={{ marginTop: 16 }}>
          <Link href="/support/qna" className="btn cancel" style={{ display: "inline-flex" }}>
            목록으로
          </Link>
        </div>
      </main>
      <SiteFooter />

      <ConfirmModal
        open={confirmOpen}
        variant="danger"
        title="문의를 삭제하시겠습니까?"
        description="삭제 후에는 복구할 수 없습니다."
        busy={confirmBusy}
        onCancel={() => !confirmBusy && setConfirmOpen(false)}
        onConfirm={runDelete}
      />
    </>
  );
}
