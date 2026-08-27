"use client";

// H7(G7 후속): 모바일 전용 우측 하단 고정 FAB(+). 데스크탑은 CSS로 숨김(기존 인라인 작성 버튼 유지).
//   리스트 작성 진입(글쓰기/급구 등록/채용 등록)을 모바일에서 FAB로 제공 — 인라인 버튼이 툴바를 깨뜨리는 문제 해소.
//   href만 주면 Link, onClick만 주면 button. 둘 다 주면 Link + onClick(가드 preventDefault 가능).
import Link from "next/link";

type Props = {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
};

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function MobileFab({ label, href, onClick }: Props) {
  if (href) {
    return (
      <Link href={href} className="mobile-fab" aria-label={label} onClick={onClick}>
        <PlusIcon />
      </Link>
    );
  }
  return (
    <button type="button" className="mobile-fab" aria-label={label} onClick={onClick}>
      <PlusIcon />
    </button>
  );
}
