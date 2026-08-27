// Candour 프리즘 심볼 (흰색 단색, 세로 중앙 대칭). 배지 안에 넣어 사용.
// width/height 기본값을 속성으로 명시 — styled-jsx 외부상수의 :global(svg) 크기 규칙 누락 시에도
// 팽창하지 않게(사이클9 버그4 "로고가 랜딩과 다름"의 원인). CSS 규칙이 있으면 CSS 가 우선한다.
export function Prism({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 6 L19 18 H5 Z" strokeWidth="1.7" />
      <path d="M1.5 12 H8.5" strokeWidth="1.7" />
      <path d="M15.5 12 L22.35 8.95" strokeWidth="1.5" />
      <path d="M15.5 12 H23" strokeWidth="1.5" />
      <path d="M15.5 12 L22.35 15.05" strokeWidth="1.5" />
    </svg>
  );
}
