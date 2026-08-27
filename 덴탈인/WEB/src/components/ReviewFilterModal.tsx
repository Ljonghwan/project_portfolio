"use client";

// P1-reviews FIX 사이클 #4 (BUG-A): 후기 목록 toolbar의 native <select> 3종을
// 퍼블 시안 `.demo-modal` 패턴(지역/직종/정렬)으로 교체.
// - 지역: sido 17 → sigungu cascade + 누적 다중 체크박스
// - 직종: 6 다중 체크박스
// - 정렬: 3 단일 라디오
// 모달 패턴: `.rv-modal-backdrop > .rv-modal.rv-modal-filter`. backdrop/ESC/body lock 일치.
import { useEffect, useMemo, useState } from "react";
// Sprint p2-2 작업 4: 구 하드코딩 지역 목록 제거 → regionStore(DONG_TB 전역 store)로 교체.
import { useRegionStore, useSigunguList, sidoDisplay, formatRegionLabel } from "@/stores/regionStore";
import { REVIEW_JOB_TYPE_OPTIONS, REVIEW_SORT_OPTIONS, type ReviewSort } from "@/lib/reviews";

type BaseProps = {
  open: boolean;
  onClose: () => void;
};

export type RegionModalProps = BaseProps & {
  selected: string[];
  onApply: (next: string[]) => void;
};

export function ReviewRegionModal({ open, onClose, selected, onApply }: RegionModalProps) {
  const sidos = useRegionStore((s) => s.sidos);
  const regionLoaded = useRegionStore((s) => s.loaded);
  const initRegion = useRegionStore((s) => s.init);

  const [draft, setDraft] = useState<string[]>([]);
  const [sido, setSido] = useState<string>("");
  const [sigungu, setSigungu] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    // store 미로드 상태로 모달이 열리면 방어적으로 1회 init (멱등).
    void initRegion();
    setDraft(selected);
    setSido((prev) => (sidos.includes(prev) ? prev : sidos[0] ?? ""));
    setSigungu("");
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
  }, [open, selected, onClose, initRegion, sidos]);

  const sigunguList = useSigunguList(sido);

  const draftSet = useMemo(() => new Set(draft), [draft]);

  const toggleItem = (label: string) => {
    setDraft((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  };

  const handleSidoChange = (value: string) => {
    setSido(value);
    setSigungu("");
  };

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
      <div className="rv-modal rv-modal-filter">
        <h4>지역 선택</h4>
        <div className="frow">
          <select
            className="rv-select"
            value={sido}
            onChange={(e) => handleSidoChange(e.target.value)}
          >
            {sidos.map((s) => (
              <option key={s} value={s}>
                {sidoDisplay(s)}
              </option>
            ))}
          </select>
          <select
            className="rv-select"
            value={sigungu}
            onChange={(e) => {
              const v = e.target.value;
              setSigungu(v);
              if (v) {
                const label = formatRegionLabel(sido, v);
                if (!draftSet.has(label)) setDraft((prev) => [...prev, label]);
                setSigungu("");
              }
            }}
          >
            <option value="">시군구 선택</option>
            {sigunguList.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="opt-list">
          {!regionLoaded && draft.length === 0 ? (
            <div className="opt opt-empty">지역 정보를 불러오는 중…</div>
          ) : draft.length === 0 ? (
            <div className="opt opt-empty">시도/시군구를 선택해 추가하세요.</div>
          ) : (
            draft.map((label) => (
              <label key={label} className="opt">
                <input type="checkbox" checked readOnly onClick={() => toggleItem(label)} />
                {label}
              </label>
            ))
          )}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-reset"
            onClick={() => setDraft([])}
            disabled={draft.length === 0}
          >
            초기화
          </button>
          <button
            type="button"
            className="btn-ok"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export type JobTypeModalProps = BaseProps & {
  selected: string[];
  onApply: (next: string[]) => void;
};

export function ReviewJobTypeModal({ open, onClose, selected, onApply }: JobTypeModalProps) {
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(selected);
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
  }, [open, selected, onClose]);

  if (!open) return null;

  const toggle = (value: string) => {
    setDraft((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  return (
    <div
      className="rv-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="rv-modal rv-modal-filter">
        <h4>직종 선택</h4>
        <div className="opt-list">
          {REVIEW_JOB_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="opt">
              <input
                type="checkbox"
                checked={draft.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-reset"
            onClick={() => setDraft([])}
            disabled={draft.length === 0}
          >
            초기화
          </button>
          <button
            type="button"
            className="btn-ok"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export type SortModalProps = BaseProps & {
  value: ReviewSort;
  onApply: (next: ReviewSort) => void;
};

export function ReviewSortModal({ open, onClose, value, onApply }: SortModalProps) {
  const [draft, setDraft] = useState<ReviewSort>(value);

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
          {REVIEW_SORT_OPTIONS.map((o) => (
            <label key={o.value} className="opt">
              <input
                type="radio"
                name="rv-sort"
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
