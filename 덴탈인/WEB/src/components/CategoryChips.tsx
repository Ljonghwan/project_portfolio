"use client";

import { TALK_CATEGORIES, TALK_CATEGORY_LABELS, type TalkCategory } from "@/lib/talks";

type Props = {
  value: TalkCategory | "";
  onChange: (next: TalkCategory) => void;
  includeAll?: boolean;
  onSelectAll?: () => void;
};

export default function CategoryChips({ value, onChange, includeAll, onSelectAll }: Props) {
  return (
    <div className="cat-chips" role="radiogroup" aria-label="카테고리">
      {includeAll && (
        <label>
          <input
            type="radio"
            name="talk-cat"
            checked={value === ""}
            onChange={() => onSelectAll?.()}
          />
          <span className="pill">전체</span>
        </label>
      )}
      {TALK_CATEGORIES.map((c) => (
        <label key={c}>
          <input
            type="radio"
            name="talk-cat"
            value={c}
            checked={value === c}
            onChange={() => onChange(c)}
          />
          <span className="pill">{TALK_CATEGORY_LABELS[c]}</span>
        </label>
      ))}
    </div>
  );
}
