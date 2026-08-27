// G6 N5: admin → 사용자페이지(front) 절대 URL 생성.
//   front 도메인은 dev(http://localhost:3001)와 라이브가 다르므로 환경변수로 주입(하드코딩 금지).
//   NEXT_PUBLIC_FRONT_BASE_URL 미설정 시 dev 기본값. 빌드 시 인라인되는 NEXT_PUBLIC_* 변수.
const FRONT_BASE_URL = (
  process.env.NEXT_PUBLIC_FRONT_BASE_URL || "http://localhost:3001"
).replace(/\/+$/, "");

// 신고 대상 board → front 상세 경로 매핑.
const BOARD_PATH: Record<string, string> = {
  job: "/jobs",
  review: "/reviews",
  talk: "/talks",
  urgent: "/urgents",
};

/** front 절대 URL. path는 "/jobs/12" 같은 절대경로. */
export function frontUrl(path: string): string {
  return `${FRONT_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** board(job|review|talk|urgent) + id → front 상세 절대 URL. 미지원 board는 빈 문자열. */
export function frontPostUrl(board: string, id: number): string {
  const base = BOARD_PATH[board];
  return base ? frontUrl(`${base}/${id}`) : "";
}

/** 새 탭으로 front 상세 열기(noopener). */
export function openFrontPost(board: string, id: number): void {
  const url = frontPostUrl(board, id);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
