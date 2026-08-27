"use client";

import { URGENT_WORK_TYPES, URGENT_WORK_TYPE_LABELS, type UrgentWorkType } from "@/lib/urgents";

type Props = {
  values: UrgentWorkType[];
  onChange: (next: UrgentWorkType[]) => void;
};

export default function WorkTypeCheckChips({ values, onChange }: Props) {
  function toggle(v: UrgentWorkType) {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  }
  return (
    <div className="check-chips accent">
      {URGENT_WORK_TYPES.map((v) => {
        const checked = values.includes(v);
        return (
          <label key={v}>
            <input type="checkbox" checked={checked} onChange={() => toggle(v)} />
            <span className="pill">{URGENT_WORK_TYPE_LABELS[v]}</span>
          </label>
        );
      })}
    </div>
  );
}
