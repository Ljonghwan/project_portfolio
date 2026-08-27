"use client";

// HOTFIX #2(2026-06-11): /jobs 정렬을 다른 게시판(talks/urgents)과 동일한 rv-drop 버튼 + 정렬 모달 패턴으로 통일.
//   구 native <select>(K1 M5) 폐기. UrgentSortModal과 동일 마크업(.rv-modal.rv-modal-filter.rv-modal-sort).
import { useEffect, useState } from "react";

export const JOB_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "view", label: "인기순" },
  { value: "salary", label: "급여순" },
  { value: "expiring", label: "마감임박순" },
];

type Props = {
  open: boolean;
  value: string;
  onClose: () => void;
  onApply: (next: string) => void;
};

export default function JobSortModal({ open, value, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<string>(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, value, onClose]);

  if (!open) return null;

  return (
    <div
      className="rv-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="rv-modal rv-modal-filter rv-modal-sort">
        <h4>정렬</h4>
        <div className="opt-list">
          {JOB_SORT_OPTIONS.map((o) => (
            <label key={o.value} className="opt">
              <input
                type="radio"
                name="job-sort"
                checked={draft === o.value}
                onChange={() => setDraft(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-ok"
            style={{ flex: 1 }}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
