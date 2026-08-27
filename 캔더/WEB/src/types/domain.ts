// AI-Resume 도메인 데이터 모델 (기획 v1)
// 이번 사이클은 목업이지만, 다음 사이클 RAG/DB 전환 대비해 화면이 이 타입을 소비하도록 정의.
// 실제 저장은 PostgreSQL + pgvector. 아래 타입은 API/화면 계층에서 쓰는 형태.

export type ISODate = string; // ISO 8601 문자열

// ── 사용자 / 프로필 ────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: ISODate;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  headline?: string; // 한 줄 소개
  summary?: string; // 핵심 요약 (인사담당자 좌측 패널)
  age?: number;
  education?: string;
  certifications?: string[];
  skills?: string[];
  phone?: string;
  location?: string;
  updatedAt: ISODate;
}

// ── 자료(asset) / 청크(chunk) ──────────────────────
export type AssetKind = "resume" | "career" | "portfolio" | "file" | "image" | "video";

export interface Asset {
  id: string;
  profileId: string;
  kind: AssetKind;
  title: string;
  fileUrl?: string; // S3 등
  thumbnailUrl?: string; // 이미지/영상 썸네일
  caption?: string; // 이미지 AI 캡션 / 영상 트랜스크립트 요약
  pageCount?: number;
  soft_deleted: boolean; // 증빙: soft-delete만
  createdAt: ISODate;
}

// 멀티모달 인제스션 결과 청크 (임베딩은 서버 전용, 화면엔 노출 안 함)
export interface Chunk {
  id: string;
  assetId: string;
  content: string; // 비전 LLM이 이해한 텍스트
  page?: number; // 근거 표기용 (예: 경력기술서 2p)
  // embedding: number[] — pgvector 컬럼, 화면 타입에는 미포함
}

// 청크 ↔ 시각자료 N:N (답변 시 동반 렌더링용)
export interface ChunkAsset {
  chunkId: string;
  assetId: string;
}

// ── 링크 ───────────────────────────────────────────
export type LinkType = "universal" | "company"; // 범용 / 회사타겟
// 만료기간 개념 폐기 → 상태로만 통제. active(공개) / disabled(구직자 off·악용 자동차단) / revoked(재발급 무효)
export type LinkStatus = "active" | "disabled" | "revoked";

export interface Link {
  id: string;
  profileId: string;
  userId?: string; // 소유 구직자(대시보드 인가 기준)
  type: LinkType;
  slug: string; // 공유 URL slug
  label: string; // 구직자 관리용 이름
  companyName?: string; // 회사타겟 링크에만
  status: LinkStatus;
  createdAt: ISODate;
}

// 회사별 Q&A / 메모 (회사타겟 맞춤답변용)
export interface CompanyContext {
  id: string;
  linkId: string;
  question: string;
  answer: string;
  updatedAt: ISODate;
}

// ── 대화 / 메시지 ──────────────────────────────────
export type MessageRole = "hr" | "ai";
export type AiAnswerKind =
  | "answer" // 정상 답변 (토큰 차감)
  | "no_info" // 보유 정보 없음 (토큰 차감)
  | "blocked"; // 인사/구인 무관 → 거절 (무료)

// 답변 동반 리치 컨텐츠
export type RichBlock =
  | { type: "text"; text: string }
  | { type: "image"; assetId: string; url: string; caption?: string }
  | { type: "file"; assetId: string; title: string; url: string; kind: AssetKind }
  | { type: "link"; assetId?: string; url: string; title: string };

// 증빙: 답변 근거를 immutable 동결 (asset/chunk 나중에 바뀌어도 이 스냅샷 유지)
export interface SourceRef {
  // 인용 페이지 썸네일용(카드#006). 이 필드가 생기기 전에 동결된 sources 에는 없다 → 자료 단위 폴백.
  assetId?: string | null;
  assetTitle: string; // 예: "경력기술서"
  page?: number; // 예: 2
  chunkId: string;
  frozenAt: ISODate; // "2026-07-07 기준"
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  text: string; // HR 질문 or AI 답변 본문
  answerKind?: AiAnswerKind; // AI 메시지에만
  blocks?: RichBlock[]; // AI 답변의 리치 컨텐츠
  sources?: SourceRef[]; // AI 답변 근거 스냅샷
  creditCost?: number | null; // 이 답변에 차감된 크레딧 (blocked=0, null=기록 이전 데이터)
  createdAt: ISODate;
}

export interface Conversation {
  id: string;
  linkId: string;
  hrName?: string; // 범용 링크: 게이트에서 입력받음
  hrCompany?: string;
  startedAt: ISODate;
}

// ── 토큰 ───────────────────────────────────────────
export interface TokenWallet {
  id: string;
  profileId: string;
  balance: number;
}

export type LedgerReason = "purchase" | "answer" | "refund";

export interface TokenLedger {
  id: string;
  walletId: string;
  reason: LedgerReason;
  amount: number; // 충전 +, 차감 -
  messageId?: string; // answer일 때 연결
  createdAt: ISODate;
}

// ── 알림 / 악용 방지 ───────────────────────────────
// 서버 server/src/models/Alert.ts ALERT_KINDS 와 1:1. 대시보드 알림함이 이 값으로 문구를 고른다.
export type AlertKind =
  | "first_chat"
  | "auto_disabled"
  | "resume_download"
  | "asset_download";

export interface Alert {
  id: string;
  profileId: string;
  linkId: string;
  kind: AlertKind;
  sentAt: ISODate | null; // 알림톡 발송 시각 (다음 사이클 실제 발송; 레코드 시점엔 null)
}

export interface AbuseCounter {
  id: string;
  linkId: string;
  count: number; // 악의/무관 질문 누적
  threshold: number; // 초과 시 자동 비활성화(disabled)
}

// ── 지원서 초안(카드#035) ──────────────────────────────
// 서버 server/src/models/Draft.ts DRAFT_STYLES·DRAFT_LENGTHS 와 1:1 — 버튼 값이 곧 서버 스키마 값이다.
export type DraftStyle = "plain" | "passionate" | "logical";
export type DraftLength = "short" | "medium" | "long";

export interface DraftOptions {
  style: DraftStyle;
  length: DraftLength;
  extra: string | null; // 자유 지시("팀 협업 경험을 더 넣어줘")
}

// 공고 매칭 리포트(카드#036) — 이 답변이 증명한 / 이 문항으로는 못 다룬 공고 요구역량.
// 🔒 두 배열의 항목은 서버가 공고 요구역량 **원문으로 치환**해 저장한 값이다(모델이 지어낸 항목은 버려진다).
//    화면은 받은 문자열을 그대로 그리기만 한다 — 여기서 가공하면 그 보장이 깨진다.
export interface DraftCoverage {
  targets: string[];
  missing: string[];
}
