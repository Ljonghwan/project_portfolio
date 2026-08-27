"use client";

// Sprint p2-3 작업5 — 상세 페이지 로딩 인디케이터 (프로젝트 공통).
// 중앙 정렬 스피너 + 선택 라벨. 디자인 토큰(--brand). globals.css `.loading-indicator` 참조.

type Props = {
  label?: string;
  /** 페이지 전체 높이 중앙 정렬(상세 진입 로딩). false면 inline 블록. */
  fullPage?: boolean;
};

export default function LoadingIndicator({ label = "불러오는 중…", fullPage = true }: Props) {
  return (
    <div className={`loading-indicator${fullPage ? " full" : ""}`} role="status" aria-live="polite">
      <span className="li-spinner" aria-hidden="true" />
      {label && <span className="li-label">{label}</span>}
    </div>
  );
}

// p2-5 작업2 — "전체 N건" 카운트 영역용 작은 인라인 스피너. 로딩 중 N 자리에 표시.
export function InlineSpinner() {
  return <span className="li-spinner-sm" role="status" aria-label="불러오는 중" />;
}
