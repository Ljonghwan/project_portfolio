"use client";

// msg-g3 정정: 가입 직종칩 = 시안 6칩(reviewJobType 도메인: 치과 위생사·치과기공사·치과 의사·코디네이터·학생·기타 진료스탭).
// codes jobType(8셋, desk 등 + student 없음)이 아니라 reviewJobType(6키, student 포함)을 사용. 라벨/키는 codes hydrate.
// msg-g3-signup-low-fix LOW-1=B: 가입 화면 표시 순서만 signup 시안 순서(위생사 먼저)로 재정렬.
//   codes/reviews(후기 작성)는 reviewJobType 원순서(의사 먼저) 유지 → 가입·후기 양쪽 시안 1:1. 라벨/키 하드코딩 없음(순서만).
import { REVIEW_JOB_TYPE_OPTIONS, type ReviewJobType } from "@/lib/reviews";
import { useCodeStore } from "@/stores/codeStore";

export type { ReviewJobType as JobType };

// 가입/후기 직종칩 순서(표시 전용, 2026-07-09 신규 6종). 키만 정의 — 라벨은 codes에서 가져옴.
// 치과위생사/치과기공사/치과의사/간호조무사/코디네이터/기타진료스탭. (student는 codes 옵션서 제거 — 기존 후기 표시만 유지)
const SIGNUP_JOB_ORDER: ReviewJobType[] = ["hygienist", "technician", "clinical", "nurse_assistant", "coordinator", "management"];

export default function JobTypePicker({ value, onChange }: { value: ReviewJobType | ""; onChange: (v: ReviewJobType) => void }) {
  // codes hydrate 완료 시 리렌더 보장(서버 라벨 변경 → 새로고침 반영).
  useCodeStore((s) => s.loaded);
  // codes 옵션을 signup 시안 순서로 재배열(SIGNUP_JOB_ORDER에 없는 키는 원순서 뒤에 보존 — codes 변경에 안전).
  const ordered = [
    ...SIGNUP_JOB_ORDER.map((k) => REVIEW_JOB_TYPE_OPTIONS.find((o) => o.value === k)).filter((o): o is { value: ReviewJobType; label: string } => !!o),
    ...REVIEW_JOB_TYPE_OPTIONS.filter((o) => !SIGNUP_JOB_ORDER.includes(o.value)),
  ];
  return (
    <div className="job-grid">
      {ordered.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`job-chip ${value === o.value ? "on" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
