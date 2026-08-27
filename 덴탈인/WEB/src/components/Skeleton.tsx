"use client";

// Sprint p2-3 작업4 — 리스트 로딩 스켈레톤 (프로젝트 공통).
// 실제 카드와 같은 그리드 컨테이너 안에 렌더해 컬럼/여백을 맞춰 CLS를 최소화한다.
// shimmer 애니메이션 + 디자인 토큰(--surface/--line). globals.css `.sk-*` 참조.

type BoxProps = {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export function SkeletonBox({ w, h, r, className = "", style }: BoxProps) {
  return (
    <span
      className={`sk-box ${className}`}
      style={{ width: w, height: h, borderRadius: r, ...style }}
      aria-hidden="true"
    />
  );
}

// 썸네일 + 제목/메타 라인으로 구성된 범용 카드 스켈레톤.
export function CardSkeleton({ thumb = true }: { thumb?: boolean }) {
  return (
    <div className="sk-card" aria-hidden="true">
      {thumb && <SkeletonBox h={140} r={12} className="sk-thumb" />}
      <div className="sk-lines">
        <SkeletonBox w="40%" h={12} r={4} />
        <SkeletonBox w="90%" h={16} r={4} />
        <SkeletonBox w="70%" h={16} r={4} />
        <div className="sk-row">
          <SkeletonBox w={54} h={20} r={999} />
          <SkeletonBox w={54} h={20} r={999} />
        </div>
      </div>
    </div>
  );
}

// 행(row)형 스켈레톤 (썸네일 없는 목록 — 후기/수다방 등).
export function RowSkeleton() {
  return (
    <div className="sk-rowcard" aria-hidden="true">
      <SkeletonBox w={44} h={44} r={999} />
      <div className="sk-lines">
        <SkeletonBox w="35%" h={12} r={4} />
        <SkeletonBox w="85%" h={15} r={4} />
        <SkeletonBox w="60%" h={15} r={4} />
      </div>
    </div>
  );
}

// 그리드/리스트 컨테이너 없이 카드 N개만 반환 — 페이지의 기존 그리드 div 안에서 사용.
export function SkeletonCards({ count = 8, thumb = true }: { count?: number; thumb?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} thumb={thumb} />
      ))}
    </>
  );
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </>
  );
}

export default SkeletonCards;
