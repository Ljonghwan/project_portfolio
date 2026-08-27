// 대시보드/로그인 아이콘 — 이모지 금지, 인라인 SVG(기존 ChatWorkspace stroke 컨벤션).
// 액션 아이콘은 currentColor stroke, 소셜 브랜드 마크는 고정 컬러.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...p }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconReissue = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </Stroke>
);

// 도움말 — 라벨 옆 `?`. 툴팁 트리거 전용이라 aria-label 은 쓰는 쪽 버튼에 붙인다.
export const IconHelp = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 1 1 3.2 2.5c-.7.3-1 .8-1 1.5v.4" />
    <path d="M12 17.2h.01" />
  </Stroke>
);

export const IconCopy = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
  </Stroke>
);

export const IconChat = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
  </Stroke>
);

export const IconPlus = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const IconMinus = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 12h14" />
  </Stroke>
);

export const IconLogout = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Stroke>
);

export const IconTrash = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Stroke>
);

export const IconCheck = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Stroke>
);

export const IconClose = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Stroke>
);

export const IconInfo = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Stroke>
);

export const IconLink = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
  </Stroke>
);

export const IconUser = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Stroke>
);

export const IconFile = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Stroke>
);

export const IconUpload = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5M12 3v12" />
  </Stroke>
);

export const IconEdit = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Stroke>
);

export const IconBack = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Stroke>
);

export const IconCoin = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
  </Stroke>
);

export const IconDownload = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </Stroke>
);

// 알림함(카드#031) — 상단바 벨. 미읽음 배지는 CSS(.bdot)로 겹쳐 그린다.
export const IconBell = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Stroke>
);

// 본문 복사(카드#035) — IconCopy 는 체인(링크) 모양이라 "링크 복사" 전용이다.
// 글을 복사하는 버튼에 체인을 쓰면 링크 복사로 읽히므로 겹친 종이 모양을 따로 둔다.
export const IconClipboard = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
  </Stroke>
);

// 지원서 작성 탭(카드#035) — 문서 위의 펜. IconFile(모서리 접힌 파일)·IconEdit(펜만)과 구분된다.
export const IconDraft = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6" />
    <path d="M8 8h5M8 12h3" />
    <path d="M18.5 3.2a1.9 1.9 0 0 1 2.7 2.7L15.4 11.6l-3.1.8.8-3z" />
  </Stroke>
);

export const IconExternal = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6M10 14 21 3" />
  </Stroke>
);

// ── 소셜 브랜드 마크(고정 컬러, 버튼 배경색과 대비) ──
export const KakaoMark = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="#000000" aria-hidden="true" {...p}>
    <path d="M12 4C7 4 3 7.13 3 11c0 2.5 1.67 4.68 4.18 5.92-.18.65-.66 2.4-.76 2.77-.12.46.17.45.36.33.15-.1 2.35-1.6 3.3-2.24.62.09 1.26.14 1.92.14 5 0 9-3.13 9-7C21 7.13 17 4 12 4z" />
  </svg>
);

export const NaverMark = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="#ffffff" aria-hidden="true" {...p}>
    <path d="M6 5h4.4l3.1 4.6V5H18v14h-4.4l-3.1-4.6V19H6z" />
  </svg>
);

export const GoogleMark = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" {...p}>
    <path fill="#4285F4" d="M23 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.16a5.27 5.27 0 0 1-2.28 3.46v2.88h3.68C21.71 18.78 23 15.82 23 12.27z" />
    <path fill="#34A853" d="M12 24c3.08 0 5.66-1.02 7.55-2.76l-3.68-2.88c-1.02.69-2.33 1.09-3.87 1.09-2.97 0-5.49-2-6.39-4.7H1.8v2.96A11.98 11.98 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.61 14.75A7.2 7.2 0 0 1 5.23 12c0-.95.16-1.88.38-2.75V6.29H1.8A11.98 11.98 0 0 0 .53 12c0 1.94.47 3.77 1.28 5.71z" />
    <path fill="#EA4335" d="M12 4.75c1.68 0 3.18.58 4.36 1.71l3.27-3.27C17.65 1.24 15.07 0 12 0 7.32 0 3.28 2.69 1.8 6.29l3.81 2.96C6.51 6.55 9.03 4.75 12 4.75z" />
  </svg>
);

// 영상 자료(카드#009 D) — 재생 표식. 이모지(▶) 대신 인라인 SVG.
export const IconPlay = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10.5 8.8v6.4l5-3.2-5-3.2Z" />
  </Stroke>
);
