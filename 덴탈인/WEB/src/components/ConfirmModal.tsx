"use client";

// P1-reviews FIX(Q12.A 등록확인 + 삭제확인): 퍼블 시안 `.demo-modal.confirm` 패턴 React화.
// ic + msg + sub + btn-reset(아니오) + btn-ok(확인). variant=danger 면 ic 빨간색.
import { useEffect } from "react";

type Props = {
  open: boolean;
  variant?: "default" | "danger";
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

export default function ConfirmModal({
  open,
  variant = "default",
  title,
  description,
  cancelLabel = "아니오",
  confirmLabel = "확인",
  onCancel,
  onConfirm,
  busy,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="rv-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`rv-modal rv-modal-confirm${variant === "danger" ? " danger" : ""}`}>
        <div className="ic" aria-hidden="true">
          {variant === "danger" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </div>
        <div className="msg">{title}</div>
        {description && <div className="sub">{description}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-reset" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-ok"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "처리 중…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
