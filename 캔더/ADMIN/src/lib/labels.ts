// 관리자 화면 라벨·표기 단일 출처(카드#009 F-1).
// 화면에서 라벨 문자열을 하드코딩하지 말고 전부 여기를 참조한다 — 한 곳만 고치면 3개 화면이 따라온다.
//
// ⚠️ 서버 `services/ai/usage.ts` 의 ACTION_LABEL 과 **별개**다. 그쪽은 사용자(구직자) 대면
//    크레딧 원장 문구이고, 여기는 운영자가 보는 관제 화면 문구다. 용도가 다르니 같이 고치지 말 것.

export const ACTION_LABEL: Record<string, string> = {
  ingest: "자료 분석(문서 읽기)",
  embedding: "검색 색인",
  answer: "AI 답변",
  parse_resume: "이력서 파싱(무과금)",
  starter_questions: "추천 질문 생성(무과금)",
  draft: "지원서 초안",
};

export const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Anthropic",
  voyage: "Voyage",
};

// AI provider 가 돌려준 실패 사유(ai_usage_logs.error_code).
// `classifyAiError`(server) 는 아래 3종에 해당하지 않는 실패를 전부 'ERROR' 로 기록한다 —
// 매핑이 없으면 관제 화면의 한글 라벨 사이에 영문 "ERROR" 가 그대로 노출된다.
export const ERROR_LABEL: Record<string, string> = {
  NO_PROVIDER_CREDIT: "공급사 잔액 부족",
  RATE_LIMIT: "호출 한도 초과",
  TIMEOUT: "응답 시간 초과",
  ERROR: "알 수 없는 오류",
};

// ── 오류 관제(카드#010) ─────────────────────────────────────────────────────
// 오류가 난 곳(error_logs.source).
export const ERROR_SOURCE_LABEL: Record<string, string> = {
  server: "서버",
  client_front: "이용자 화면",
  client_admin: "관리자 화면",
  job: "백그라운드 작업",
};

// 오류 종류(error_logs.code).
// ⚠️ 키 목록은 타입 선언이 아니라 **서버에서 값을 만드는 곳 전부**에서 뽑았다 —
//    `recordError({ code: … })` 호출부 전수 + errorHandler 가 그대로 싣는 5xx `HttpError` 코드 전수
//    (PARSE_FAILED/PAYMENT_UNAVAILABLE/OAUTH_NOT_CONFIGURED) + dbErrorCode 의 반환값.
//    하나라도 빠지면 한글 라벨 사이에 영문 code 가 그대로 노출된다.
export const ERROR_CODE_LABEL: Record<string, string> = {
  // 서버·인프라
  INTERNAL: "서버 내부 오류",
  DB_TIMEOUT: "DB 응답 지연",
  DB_UNAVAILABLE: "DB 연결 실패",
  AI_UNAVAILABLE: "AI 서비스 장애",
  RATE_LIMITED: "요청 과다",
  PAYLOAD_TOO_LARGE: "요청 용량 초과",
  UPLOAD_ERROR: "파일 업로드 실패",
  INSUFFICIENT_CREDITS: "크레딧 부족",
  PARSE_FAILED: "이력서 분석 실패",
  PAYMENT_UNAVAILABLE: "결제 기능 중지",
  OAUTH_NOT_CONFIGURED: "소셜 로그인 미설정",
  AUDIT_WRITE_FAILED: "감사 기록 실패",
  BILLING_SETTLE_FAILED: "크레딧 정산 실패",
  // 백그라운드 작업
  INGEST_FAILED: "자료 분석 실패",
  THUMBNAIL_FAILED: "미리보기 생성 실패",
  USAGE_LOG_FAILED: "사용량 기록 실패",
  UNHANDLED_REJECTION: "처리되지 않은 오류",
  UNCAUGHT_EXCEPTION: "처리되지 않은 예외",
  // 브라우저
  CLIENT_RUNTIME: "화면 실행 오류",
  CLIENT_UNHANDLED_REJECTION: "화면 비동기 오류",
  CLIENT_RENDER: "화면 표시 실패",
};

export function errorSourceLabel(v?: string | null): string {
  return v ? (ERROR_SOURCE_LABEL[v] ?? v) : "-";
}
export function errorCodeLabel(v?: string | null): string {
  return v ? (ERROR_CODE_LABEL[v] ?? v) : "-";
}

export const ERROR_SOURCE_OPTIONS = Object.entries(ERROR_SOURCE_LABEL).map(([value, label]) => ({
  value,
  label,
}));
export const ERROR_CODE_OPTIONS = Object.entries(ERROR_CODE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// 표·지표 제목 — "토큰"·"비용" 같은 개발자 어휘를 운영자 어휘로.
export const COL = {
  time: "시각",
  user: "회원",
  action: "행동",
  providerModel: "AI 공급사 · 모델",
  tokensIn: "입력 토큰",
  tokensOut: "출력 토큰",
  tokens: "토큰(AI 처리량)",
  cost: "원가(USD)",
  calls: "AI 호출 수",
  result: "결과",
  target: "대상",
  // 오류 관제(카드#010)
  errorMessage: "오류 내용",
  errorSource: "발생 위치",
  errorCode: "종류",
  occurrences: "발생 횟수",
  affectedUsers: "영향 회원 수",
  lastSeen: "최근 발생",
  firstSeen: "최초 발생",
  requestPath: "요청 경로",
  browser: "브라우저",
} as const;

export const GROUP_BY_OPTIONS = [
  { value: "day", label: "일자별" },
  { value: "user", label: "회원별" },
  { value: "provider", label: "AI 공급사별" },
  { value: "action", label: "행동별" },
  { value: "model", label: "모델별" },
];

export const ACTION_OPTIONS = Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label }));
export const PROVIDER_OPTIONS = Object.entries(PROVIDER_LABEL).map(([value, label]) => ({ value, label }));

// AI 답변 종류(messages.answer_kind).
export const ANSWER_KIND_LABEL: Record<string, string> = {
  answer: "답변",
  no_info: "정보 없음",
  blocked: "차단됨",
  insufficient: "잔액 부족",
};

export function actionLabel(v?: string | null): string {
  return v ? (ACTION_LABEL[v] ?? v) : "-";
}
export function providerLabel(v?: string | null): string {
  return v ? (PROVIDER_LABEL[v] ?? v) : "-";
}
export function errorLabel(v?: string | null): string {
  return v ? (ERROR_LABEL[v] ?? v) : "실패";
}
export function answerKindLabel(v?: string | null): string {
  return v ? (ANSWER_KIND_LABEL[v] ?? v) : "";
}
// "Anthropic · claude-sonnet-5" — 여러 값이 섞인 묶음 행은 provider 가 "anthropic, voyage" 로 온다.
export function providerModel(provider?: string | null, model?: string | null): string {
  const p = (provider ?? "")
    .split(", ")
    .filter(Boolean)
    .map((x) => PROVIDER_LABEL[x] ?? x)
    .join(", ");
  return [p, model].filter(Boolean).join(" · ") || "-";
}

// ── 날짜·시각 표기 ──────────────────────────────────────────────────────────
// 화면에 개발자식 포맷(YYYY-MM-DD / HH:MM)을 쓰지 않는다. 시각은 12시간제이고 **시는 zero-pad 없음**,
// 분·초만 2자리. (데이터 파일로 내보낼 때만 24시각을 쓴다 — 정렬·필터 때문. 화면 규칙과 분리.)
function parts(v: string | Date): { d: Date } | null {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : { d };
}
export function fmtTime(v: string | Date, withSeconds = false): string {
  const p = parts(v);
  if (!p) return "-";
  const h = p.d.getHours();
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(p.d.getMinutes()).padStart(2, "0");
  const ss = String(p.d.getSeconds()).padStart(2, "0");
  return `${period} ${h12}:${mm}${withSeconds ? `:${ss}` : ""}`;
}
export function fmtDate(v: string | Date): string {
  const p = parts(v);
  return p ? `${p.d.getFullYear()}년 ${p.d.getMonth() + 1}월 ${p.d.getDate()}일` : "-";
}
export function fmtDateTime(v: string | Date, withSeconds = false): string {
  const p = parts(v);
  return p ? `${fmtDate(p.d)} ${fmtTime(p.d, withSeconds)}` : "-";
}
// 차트 축처럼 폭이 좁은 자리 — "7월 30일".
export function fmtDayKeyShort(v?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? "");
  return m ? `${Number(m[2])}월 ${Number(m[3])}일` : (v ?? "-");
}
// 서버가 'YYYY-MM-DD'(한국시간 날짜 키)로 주는 값 전용 — 타임존 재해석 없이 그대로 읽는다.
export function fmtDayKey(v?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? "");
  return m ? `${Number(m[1])}년 ${Number(m[2])}월 ${Number(m[3])}일` : (v ?? "-");
}

// 관리자 계정 관리(카드#029) — 권한 등급·화면 문구.
export const ADMIN_ROLE_LABEL: Record<string, string> = {
  super: "슈퍼관리자",
  operator: "운영자",
};
export function adminRoleLabel(v?: string | null): string {
  return v ? (ADMIN_ROLE_LABEL[v] ?? v) : "-";
}
export const ADMIN_ROLE_OPTIONS = Object.entries(ADMIN_ROLE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const ADMIN_ACCOUNT_TEXT = {
  title: "관리자 계정",
  desc: "슈퍼관리자는 모든 메뉴와 계정 관리를, 운영자는 계정 관리를 뺀 나머지 메뉴를 사용합니다.",
  add: "관리자 추가",
  edit: "수정",
  resetPassword: "비밀번호 초기화",
  remove: "삭제",
  removeConfirm: "이 계정을 삭제할까요? 삭제하면 그 관리자는 즉시 로그아웃됩니다.",
  selfDeleteHint: "본인 계정은 삭제할 수 없습니다.",
  colUsername: "아이디",
  colName: "이름",
  colRole: "권한",
  colLastLogin: "마지막 로그인",
  colCreatedAt: "등록일",
  colState: "상태",
  locked: "로그인 잠김",
  normal: "정상",
  never: "기록 없음",
  passwordHint: "8자 이상이면 됩니다.",
  newPasswordHint: "8자 이상이면 됩니다. 초기화하면 로그인 잠김도 함께 풀립니다.",
  currentPassword: "현재 비밀번호",
  newPassword: "새 비밀번호",
  changeMyPassword: "비밀번호 변경",
  created: "관리자를 추가했습니다.",
  updated: "저장되었습니다.",
  removed: "삭제되었습니다.",
  passwordReset: "비밀번호를 초기화했습니다.",
  passwordChanged: "비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용해주세요.",
  loadFailed: "관리자 목록을 불러오지 못했습니다.",
} as const;

// 약관 관리(카드#016 3) — 종류·화면 문구.
export const LEGAL_KIND_LABEL: Record<string, string> = {
  terms: "이용약관",
  privacy: "개인정보처리방침",
};
export const LEGAL_KINDS = ["terms", "privacy"] as const;
// DatePicker 표시 포맷(화면에 YYYY-MM-DD 금지 — admin/CLAUDE.md).
export const DATE_FORMAT_KO = "YYYY년 M월 D일";
export const LEGAL_TEXT = {
  title: "약관 관리",
  desc: "지원자 화면 푸터의 이용약관·개인정보처리방침 본문입니다. 저장하면 즉시 반영됩니다.",
  revisedAt: "개정일",
  revisedHint: "비워두면 저장한 날짜로 기록됩니다.",
  save: "저장",
  saved: "저장되었습니다.",
  loadFailed: "약관을 불러오지 못했습니다.",
  saveFailed: "저장하지 못했습니다.",
  sanitizeNote:
    "제목은 1~3단계까지만 저장됩니다. 스크립트·iframe 등 위험한 태그는 저장 시 서버가 제거합니다.",
} as const;
