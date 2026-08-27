"use client";

import { URGENT_JOB_TYPES, URGENT_JOB_TYPE_LABELS, type UrgentJobType } from "@/lib/urgents";

type Props = {
  values: UrgentJobType[];
  onChange: (next: UrgentJobType[]) => void;
};

export default function JobTypeCheckChips({ values, onChange }: Props) {
  function toggle(v: UrgentJobType) {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  }
  return (
    <div className="check-chips">
      {URGENT_JOB_TYPES.map((v) => {
        const checked = values.includes(v);
        return (
          <label key={v}>
            <input type="checkbox" checked={checked} onChange={() => toggle(v)} />
            <span className="pill">{URGENT_JOB_TYPE_LABELS[v]}</span>
          </label>
        );
      })}
    </div>
  );
}
