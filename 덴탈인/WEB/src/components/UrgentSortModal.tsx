"use client";

import { useEffect, useState } from "react";
import { URGENT_SORT_OPTIONS, type UrgentSort } from "@/lib/urgents";

type Props = {
  open: boolean;
  value: UrgentSort;
  onClose: () => void;
  onApply: (next: UrgentSort) => void;
};

export default function UrgentSortModal({ open, value, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<UrgentSort>(value);

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
          {URGENT_SORT_OPTIONS.map((o) => (
            <label key={o.value} className="opt">
              <input
                type="radio"
                name="urgent-sort"
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
