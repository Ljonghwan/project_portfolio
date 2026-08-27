"use client";

// P1-reviews FIX(Q11.A 신고하기 모달): 퍼블 시안 `.demo-modal` 신고 패턴.
// 4 라디오 + 기타 시 textarea + 취소/신고하기. 신고 완료 시 confirm 토스트로 전환.
import { useEffect, useMemo, useState } from "react";
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  type ReportBoardType,
  type ReportReason,
  type ReportTargetType,
  reportContent,
} from "@/lib/reports";

type SubmitResult = { success: boolean; code?: string; data?: { alreadyReported: boolean } | null; message?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  // 기본(커뮤니티) 모드: boardType/targetType/boardId로 /api/reports 호출
  boardType?: ReportBoardType;
  targetType?: ReportTargetType;
  boardId?: number;
  // 커스텀 모드(F-C item11 채용 신고 등): 사유 목록 + 제출 핸들러 주입
  reasonOptions?: ReadonlyArray<{ key: string; label: string }>;
  onSubmitReport?: (reasonKey: string, detail: string) => Promise<SubmitResult>;
};

export default function ReportModal({ open, boardType, targetType, boardId, onClose, reasonOptions, onSubmitReport }: Props) {
  // 사유 목록: 커스텀 주입 우선, 없으면 커뮤니티 코드(REPORT_REASONS) 사용.
  const opts = useMemo(
    () => reasonOptions ?? REPORT_REASONS.map((r) => ({ key: r as string, label: REPORT_REASON_LABELS[r] })),
    [reasonOptions]
  );
  const firstKey = opts[0]?.key ?? "ad";
  const [reason, setReason] = useState<string>(firstKey);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { alreadyReported: boolean }>(null);
  const needsDetail = reason === "etc" || reason === "other";

  useEffect(() => {
    if (!open) return;
    setReason(firstKey);
    setDetail("");
    setDone(null);
    setBusy(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose, firstKey]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (needsDetail && detail.trim().length < 4) {
      alert("기타 사유 내용을 4자 이상 입력해 주세요.");
      return;
    }
    setBusy(true);
    const res: SubmitResult = onSubmitReport
      ? await onSubmitReport(reason, detail.trim())
      : await reportContent({
          boardType: boardType!,
          targetType: targetType!,
          boardId: boardId!,
          reason: reason as ReportReason,
          detail: detail.trim() || undefined,
        });
    setBusy(false);
    if (!res.success || !res.data) {
      // P1-reviews FIX 사이클 #4 (BUG-B1): 본인 글/댓글 신고는 서버에서 CANNOT_REPORT_SELF로 차단.
      if (res.code === "CANNOT_REPORT_SELF") {
        alert(targetType === "comment" ? "본인 댓글은 신고할 수 없습니다." : "본인 글은 신고할 수 없습니다.");
        onClose();
        return;
      }
      alert(res.message || "신고 처리에 실패했습니다.");
      return;
    }
    setDone({ alreadyReported: res.data.alreadyReported });
  };

  return (
    <div
      className="rv-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      {done ? (
        <div className="rv-modal rv-modal-confirm">
          <div className="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="msg">{done.alreadyReported ? "이미 신고하셨습니다." : "신고되었습니다."}</div>
          <div className="sub">
            {done.alreadyReported
              ? "동일 게시물에 대한 추가 신고는 접수되지 않았습니다."
              : "검토 후 처리 결과를 알려드릴게요."}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ok" style={{ flex: 1 }} onClick={onClose}>
              확인
            </button>
          </div>
        </div>
      ) : (
        <div className="rv-modal rv-modal-report">
          <h4>신고 사유를 선택해 주세요.</h4>
          <div className="reason-list">
            {opts.map((o) => (
              <label key={o.key} className={`opt${reason === o.key ? " on" : ""}`}>
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === o.key}
                  onChange={() => {
                    setReason(o.key);
                    if (o.key !== "etc" && o.key !== "other") setDetail("");
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
          {needsDetail && (
            <>
              <textarea
                className="other-input"
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 500))}
                placeholder="내용을 입력하세요."
                maxLength={500}
                rows={3}
              />
              <div className="rv-modal-helper">{detail.length}/500</div>
            </>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-reset" onClick={onClose} disabled={busy}>
              취소
            </button>
            <button type="button" className="btn-ok" onClick={handleSubmit} disabled={busy}>
              {busy ? "신고 중…" : "신고하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
