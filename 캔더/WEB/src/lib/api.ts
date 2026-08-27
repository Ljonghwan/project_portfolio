// 백엔드(:4000) fetch 래퍼 — 성공 { data } 언랩, 실패 { error:{code,message} } → ApiError.
// shape 는 server/src/utils/serialize.ts 직렬화 계약과 1:1. (server 는 null 을 보내므로 null 허용.)
import type {
  AiAnswerKind,
  AlertKind,
  DraftCoverage,
  DraftOptions,
  LinkStatus,
  LinkType,
  RichBlock,
  SourceRef,
} from "@/types/domain";

// 배포(production)에서 NEXT_PUBLIC_API_BASE 미설정 시 상대경로("")=같은 오리진(nginx 리버스프록시 전제)로
// 안전하게 폴백. 개발에선 별도 포트(:4000) 서버라 localhost 기본값 유지(로컬 편의).
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");

export interface ApiProfile {
  id: string;
  displayName: string;
  headline?: string | null;
  summary?: string | null;
  age?: number | null; // 서버가 생년월일로 계산해 내려줌(미입력 옛 프로필은 저장값 폴백)
  birthDate?: string | null;
  education?: string | null;
  career?: string | null; // 성별(gender)과 달리 HR 대면·PDF 에도 노출(PM 결정 2026-07-28)
  certifications?: string[] | null;
  skills?: string[] | null;
  // HR 대면 응답에선 공개 플래그 on 인 것만 값이 오고, 비공개는 null(서버 fail-closed 게이팅).
  email?: string | null;
  phone?: string | null;
  hasPhoto?: boolean; // 사진 바이트는 /profile-photo 로 별도 서빙
}

export interface ApiAsset {
  id: string;
  kind: string;
  viewerKind: "image" | "pdf" | "link" | "file";
  title: string;
  sub: string;
  big: string;
  gradient?: string | null;
  hasFile?: boolean; // 원본 파일 존재 여부(HR 뷰어 원본열기/다운로드 활성 판단)
  hasThumb?: boolean; // 근거 썸네일 존재 여부(사이클10 — link=og:image, pdf=1p 래스터, image=축소본)
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  role: "hr" | "ai";
  text: string;
  answerKind?: AiAnswerKind | null;
  blocks?: RichBlock[] | null;
  sources?: SourceRef[] | null;
  suggestions?: string[] | null; // 후속 질문 추천(사이클9)
  createdAt: string;
}

export interface ApiLink {
  type: LinkType;
  slug: string;
  label: string;
  status: LinkStatus;
  companyName?: string | null;
}

export interface ApiConversation {
  id: string;
  resumeToken: string;
  companyName: string | null;
  startedAt: string;
  lastActivityAt: string;
}

export interface AssetView {
  assetId: string;
  viewedAt: string;
}

export interface SessionPayload {
  conversation: ApiConversation;
  profile: ApiProfile | null;
  assets: ApiAsset[];
  messages: ApiMessage[];
  assetViews: AssetView[];
  link: ApiLink;
}

// status/code 로 화면이 분기(COMPANY_REQUIRED/LINK_UNAVAILABLE/LINK_NOT_FOUND 등).
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include", // 방문자 쿠키(candour_vid) 왕복
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK", "서버에 연결할 수 없습니다");
  }
  const json = (await res.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string };
  } | null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? "요청을 처리하지 못했습니다",
    );
  }
  return json?.data as T;
}

export function createSession(
  slug: string,
  companyName?: string,
): Promise<SessionPayload> {
  return api<SessionPayload>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(companyName ? { slug, companyName } : { slug }),
  });
}

export function getResume(token: string): Promise<SessionPayload> {
  return api<SessionPayload>(`/api/resume/${encodeURIComponent(token)}`);
}

export function sendMessage(
  conversationId: string,
  text: string,
): Promise<{ messages: ApiMessage[]; link: ApiLink }> {
  return api(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// 빈 대화 첫 진입에 띄울 추천 질문(카드#030). 세션 payload 와 분리된 별도 호출이라 첫 화면을 막지 않는다.
// token 을 함께 실어 /r/[token](타기기, 방문자 쿠키 없음) 경로에서도 동작한다 — 다른 대화 스코프 GET 과 동일.
// 실패·미생성은 빈 배열(칩이 없는 것은 장애가 아니다).
export function fetchStarterQuestions(
  conversationId: string,
  token: string,
): Promise<{ questions: string[] }> {
  return api(
    `/api/conversations/${conversationId}/starter-questions?token=${encodeURIComponent(token)}`,
  );
}

export function recordAssetView(
  conversationId: string,
  assetId: string,
): Promise<{ ok: true }> {
  return api(`/api/conversations/${conversationId}/asset-views`, {
    method: "POST",
    body: JSON.stringify({ assetId }),
  });
}

// PDF 는 a[href download] 로 직접 받음(브라우저가 Content-Disposition 으로 저장).
export function pdfUrl(conversationId: string): string {
  return `${API_BASE}/api/conversations/${conversationId}/pdf`;
}

// HR 화면 지원자 사진 URL — 자료 파일과 동일한 대화 스코프 인가(사이클10 D).
export function conversationProfilePhotoUrl(conversationId: string, token: string): string {
  return `${API_BASE}/api/conversations/${conversationId}/profile-photo?token=${encodeURIComponent(token)}`;
}

// 근거 카드 썸네일 URL(사이클10 F) — 자료 파일과 동일한 대화 스코프 인가.
// page 를 주면 답변에 인용된 그 PDF 페이지(카드#006). 서버는 PDF 가 아니거나 렌더 실패면
// 자료 단위 썸네일로 폴백하므로 호출측이 형식을 따로 판정할 필요는 없다.
export function conversationAssetThumbUrl(
  conversationId: string,
  assetId: string,
  token: string,
  page?: number | null,
): string {
  const q = new URLSearchParams({ token });
  if (page) q.set("page", String(page));
  return `${API_BASE}/api/conversations/${conversationId}/assets/${encodeURIComponent(assetId)}/thumbnail?${q.toString()}`;
}

// HR(방문자)용 자료 원본 URL — 대화 스코프 인가(방문자 쿠키 또는 resumeToken capability, 사이클9).
// token 을 항상 실어 /r/[token](타기기, 쿠키 없음) 경로에서도 동작.
export function conversationAssetFileUrl(
  conversationId: string,
  assetId: string,
  token: string,
  download = false,
): string {
  const q = new URLSearchParams({ token });
  if (download) q.set("download", "1");
  return `${API_BASE}/api/conversations/${conversationId}/assets/${encodeURIComponent(assetId)}/file?${q.toString()}`;
}

// ── 인증 / 대시보드(사이클3) ─────────────────────────
export type OAuthProvider = "kakao" | "naver" | "google";

export interface ApiUser {
  id: string;
  displayName: string;
}

// 대시보드(소유자) 링크 — 공개 ApiLink 와 달리 id/createdAt 포함(제어 대상 식별).
export interface OwnedLink {
  id: string;
  type: LinkType;
  slug: string;
  label: string;
  status: LinkStatus;
  companyName?: string | null;
  createdAt: string;
}

export interface ApiCompanyContext {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

// 소셜 실연동(카카오 카드#017 · 네이버·구글 카드#037) — fetch 가 아니라 **브라우저를 통째로 보낸다**
// (서버가 provider 동의 화면으로 302).
export const oauthAuthorizeUrl = (provider: "kakao" | "naver" | "google") =>
  `${API_BASE}/api/auth/${provider}/authorize`;

// 소셜 로그인(개발 스텁 전용 — 실연동은 위 oauthAuthorizeUrl).
// demo(고정 데모유저) | dev1~3(고정 테스트 계정, 사이클9) | new(새 가상계정).
export type StubLoginMode = "demo" | "new" | "dev1" | "dev2" | "dev3";
export function socialLogin(
  provider: OAuthProvider,
  mode: StubLoginMode,
): Promise<{ user: ApiUser; isNew: boolean }> {
  return api(`/api/auth/${provider}/login`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export function logout(): Promise<{ ok: true }> {
  return api("/api/auth/logout", { method: "POST" });
}

export function getMe(): Promise<{ user: ApiUser }> {
  return api("/api/auth/me");
}

export function listMyLinks(): Promise<{ links: OwnedLink[] }> {
  return api("/api/me/links");
}

export function createLink(input: {
  type: LinkType;
  label: string;
  companyName?: string;
}): Promise<{ link: OwnedLink }> {
  return api("/api/me/links", { method: "POST", body: JSON.stringify(input) });
}

export function toggleLink(id: string, active: boolean): Promise<{ link: OwnedLink }> {
  return api(`/api/me/links/${id}/toggle`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}

export function reissueLink(id: string): Promise<{ link: OwnedLink }> {
  return api(`/api/me/links/${id}/reissue`, { method: "POST" });
}

export function listContexts(id: string): Promise<{ contexts: ApiCompanyContext[] }> {
  return api(`/api/me/links/${id}/contexts`);
}

export function addContext(
  id: string,
  input: { question: string; answer: string },
): Promise<{ context: ApiCompanyContext }> {
  return api(`/api/me/links/${id}/contexts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteContext(id: string, contextId: string): Promise<{ ok: true }> {
  return api(`/api/me/links/${id}/contexts/${contextId}`, { method: "DELETE" });
}

// ── 프로필 / 자료 / 대화 열람(사이클4) ────────────────
export interface ApiProfileFull {
  id: string;
  displayName: string;
  headline?: string | null;
  summary?: string | null;
  age?: number | null; // 계산값(읽기 전용)
  birthDate?: string | null;
  education?: string | null;
  certifications?: string[] | null;
  skills?: string[] | null;
  // 소유자 뷰 — 공개 여부와 무관하게 원본 + 공개 플래그(편집용).
  email?: string | null;
  phone?: string | null;
  emailPublic?: boolean;
  phonePublic?: boolean;
  hasPhoto?: boolean;
  // 온보딩 이력서 파싱으로 채워지는 필드(카드#002 E). 소유자 뷰에만 내려온다.
  gender?: "male" | "female" | null;
  career?: string | null;
}

// POST /api/me/profile/parse-resume 프리뷰 결과 — 저장 전 사용자가 확인·수정하는 값(DB 미저장).
export interface ParsedResume {
  displayName: string | null;
  gender: "male" | "female" | null;
  birthDate: string | null;
  education: string | null;
  certifications: string[];
  skills: string[];
  career: string | null;
}

export interface OwnedAsset {
  id: string;
  kind: string;
  title: string;
  sub?: string | null;
  viewerKind: "image" | "pdf" | "link" | "file";
  gradient?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  sourceUrl?: string | null;
  hasFile: boolean;
  hasThumb: boolean;
  // 인제스션(자료 분석) 상태 — 서버 serializeOwnedAsset 과 1:1. 30분 넘게 멈춘 processing 은 서버가 failed 로 내린다.
  ingestStatus: "pending" | "processing" | "ready" | "failed";
  ingestProgress?: string | null;
  ingestError?: string | null;
  createdAt: string;
}

// 자료 등록 한도(서버 services/uploadQuota.ts). 자료 업로드는 무과금이고 이 두 값이 유일한 상한이다.
// todayCount 는 한국시간 자정에 리셋된다.
export interface AssetQuota {
  usedBytes: number;
  limitBytes: number;
  todayCount: number;
  dailyLimit: number;
}

export interface ConversationSummary {
  id: string;
  companyName: string | null;
  startedAt: string;
  lastActivityAt: string;
  messageCount: number;
  // 인사담당자가 이력서 PDF 를 받아간 횟수(카드#027 A). 기록 도입 이전 대화는 0/null 이고
  // 화면은 그때 배지·문구를 아예 렌더하지 않는다("0회" 를 보여주지 않는다).
  downloadCount: number;
  lastDownloadedAt: string | null;
}

// 실제 차감된 크레딧. null=크레딧 기록 이전의 옛 데이터("-" 표시), 0=무료(blocked·잔액부족).
export interface OwnerMessage extends ApiMessage {
  creditCost?: number | null;
}

// FormData(파일 업로드) 전용 — Content-Type 을 브라우저가 multipart boundary 로 설정하도록 지정하지 않음.
async function apiForm<T>(path: string, body: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: "POST", credentials: "include", body });
  } catch {
    throw new ApiError(0, "NETWORK", "서버에 연결할 수 없습니다");
  }
  const json = (await res.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string };
  } | null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? "요청을 처리하지 못했습니다",
    );
  }
  return json?.data as T;
}

export function getMyProfile(): Promise<{ profile: ApiProfileFull }> {
  return api("/api/me/profile");
}

export function updateMyProfile(input: {
  displayName: string;
  headline?: string | null;
  summary?: string | null;
  birthDate?: string | null;
  education?: string | null;
  certifications?: string[];
  skills?: string[];
  email?: string | null;
  phone?: string | null;
  emailPublic?: boolean;
  phonePublic?: boolean;
  gender?: "male" | "female" | null;
  career?: string | null;
}): Promise<{ profile: ApiProfileFull }> {
  return api("/api/me/profile", { method: "PUT", body: JSON.stringify(input) });
}

// 온보딩 이력서 파싱(카드#002 E) — 추출 프리뷰만 받는다(서버는 저장하지 않음). 무과금·1일 5회.
export function parseResumeFile(file: File): Promise<{ parsed: ParsedResume }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiForm("/api/me/profile/parse-resume", fd);
}

// ── 프로필 사진(사이클10 D) ── 업로드는 이미지 mime 만(서버가 magic number 검증, 512² jpeg 정규화).
export function uploadProfilePhoto(file: File): Promise<{ profile: ApiProfileFull }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiForm("/api/me/profile/photo", fd);
}

export function deleteProfilePhoto(): Promise<{ profile: ApiProfileFull }> {
  return api("/api/me/profile/photo", { method: "DELETE" });
}

// 소유자 미리보기 URL(세션쿠키 인가). v 는 업로드 직후 캐시 무효화용.
export function profilePhotoUrl(v?: number): string {
  return `${API_BASE}/api/me/profile/photo${v ? `?v=${v}` : ""}`;
}

export function listAssets(): Promise<{ assets: OwnedAsset[]; quota: AssetQuota }> {
  return api("/api/me/assets");
}

export function uploadAsset(
  file: File,
  meta: { title: string; sub?: string },
): Promise<{ asset: OwnedAsset }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("title", meta.title);
  if (meta.sub) fd.append("sub", meta.sub);
  return apiForm("/api/me/assets", fd);
}

export function updateAsset(
  id: string,
  meta: { title: string; sub?: string },
): Promise<{ asset: OwnedAsset }> {
  return api(`/api/me/assets/${id}`, { method: "PUT", body: JSON.stringify(meta) });
}

// 링크(URL) 자료 등록 — 파일 아님. 서버가 http(s)+공인호스트 검증.
// kind:"video" 는 영상 링크(설명 필수) — 저장은 viewerKind:"link" 그대로다.
export function addLinkAsset(input: {
  title: string;
  sub?: string;
  url: string;
  kind?: "link" | "video";
}): Promise<{ asset: OwnedAsset }> {
  return api("/api/me/assets/link", { method: "POST", body: JSON.stringify(input) });
}

// 분석 실패한 자료 다시 분석. 이미 분석 중이면 409(INGEST_IN_PROGRESS).
export function reingestAsset(id: string): Promise<{ asset: OwnedAsset }> {
  return api(`/api/me/assets/${id}/reingest`, { method: "POST" });
}

export function deleteAsset(id: string): Promise<{ ok: true }> {
  return api(`/api/me/assets/${id}`, { method: "DELETE" });
}

// 자료 카드 썸네일 URL(소유자 전용 — 영상 og:image·PDF 1p·이미지 축소본). hasThumb 인 자료만.
export function assetThumbUrl(id: string): string {
  return `${API_BASE}/api/me/assets/${id}/thumbnail`;
}

// 자료 파일 미리보기 URL(소유자 전용 — 세션쿠키로 서버가 인가). <img src>/<a href> 로 사용.
export function assetFileUrl(id: string): string {
  return `${API_BASE}/api/me/assets/${id}/file`;
}

export function listLinkConversations(
  linkId: string,
): Promise<{ link: { id: string; label: string; slug: string }; conversations: ConversationSummary[] }> {
  return api(`/api/me/links/${linkId}/conversations`);
}

export function getConversationMessages(
  convId: string,
): Promise<{ conversation: ConversationSummary; messages: OwnerMessage[]; totalCredits: number }> {
  return api(`/api/me/conversations/${convId}/messages`);
}

// ── 알림함(카드#031) ──────────────────────────────────
// 인앱 전용 — 외부 발송(메일·SMS·알림톡) 채널은 없다(alerts.sent_at 은 계속 null).
// 미읽음 판정은 서버가 프로필 타임스탬프(alertsSeenAt)로 하므로 화면은 unreadCount 만 쓴다.
export interface ApiAlert {
  id: string;
  kind: AlertKind;
  createdAt: string;
  linkId: string;
  linkLabel: string | null;
  conversationId: string | null; // auto_disabled(링크 단위 사건)는 null
  companyName: string | null; // 대화가 있고 회사명이 입력된 경우만
}

export function getMyAlerts(): Promise<{ alerts: ApiAlert[]; unreadCount: number }> {
  return api("/api/me/alerts");
}

// 알림함을 연 시각을 서버에 찍는다(읽음 처리) — 이후로는 그보다 나중 알림만 미읽음으로 잡힌다.
export function markAlertsSeen(): Promise<{ ok: true }> {
  return api("/api/me/alerts/seen", { method: "POST" });
}

// ── 지원서 초안(카드#035) ─────────────────────────────
// 구직자 본인의 작문 보조 — HR 챗봇과 별도 경로다. 🔒 초안은 챗봇 답변 근거(chunks)로 쓰이지 않는다.
// 목록 카드 1개 = 그룹 1개(회사·직무 한 벌 + 문항 N개).
export interface ApiDraftGroup {
  groupId: string;
  company: string;
  jobTitle: string;
  questionCount: number;
  createdAt: string;
}

export interface ApiDraft {
  id: string;
  groupId: string;
  company: string;
  jobTitle: string;
  jobUrl: string | null;
  jobSummary: string | null;
  // 화면에 그리지 않는다 — 실패 문항 재시도가 같은 회사 맥락으로 이어 붙이도록 되돌려 받는 값이다.
  companyContext: string | null;
  question: string;
  options: DraftOptions;
  content: string;
  // 카드#036 이전에 만든 초안은 null 이다 — 화면은 "리포트 없음"으로 조용히 넘어간다.
  coverage: DraftCoverage | null;
  createdAt: string;
  updatedAt: string;
}

// 공고 URL 분석 결과. jobSummary 는 그대로 되돌려 보내 저장한다(재생성 시 재크롤하지 않기 위한 값).
export interface JobAnalysis {
  company: string;
  jobTitle: string;
  // 뽑아낸 요구역량은 jobSummary 안에 그대로 들어 있다 — 따로 받지 않는다(같은 내용 두 번 표시 방지).
  jobSummary: string;
  // 공고에 적힌 범위의 회사 소개(없으면 빈 문자열). **화면에는 표시하지 않는다** — 같은 내용이 공고 요약과
  // 두 번 보이기 때문(카드#035 반려). 들고 있다가 생성 요청 body 로 그대로 되돌려 보낸다.
  companyContext: string;
  // true = 페이지는 읽혔는데 요구역량을 못 건졌다(상세를 JS 로 그리는 채용 사이트) → 붙여넣기 폴백.
  partial: boolean;
}

// 크롤 실패는 정상 분기다 — 400 JOB_FETCH_FAILED/JOB_URL_BLOCKED 로 오며 화면이 수동 입력으로 유도한다.
export function analyzeJobPosting(url: string): Promise<JobAnalysis> {
  return api("/api/me/drafts/analyze-job", { method: "POST", body: JSON.stringify({ url }) });
}

export function listDrafts(): Promise<{
  groups: ApiDraftGroup[];
  keepLimit: number;
  maxQuestions: number;
}> {
  return api("/api/me/drafts");
}

// 생성 진행 상황. 서버가 백그라운드로 문항을 돌리는 동안 화면이 이 값으로 진행률을 그린다.
// 부분 성공을 허용하므로 실패한 문항은 사유가 여기에 쌓인다.
export interface DraftJob {
  done: number; // 처리를 마친 문항 수(성패 무관)
  total: number;
  running: boolean;
  failed: { question: string; code: string; message: string }[];
}

// 그룹 상세 — 문항 행 전체(만든 순) + 진행 중인 잡. job 이 null 이면 생성이 끝난(또는 잡이 만료된) 그룹이다.
export function getDraftGroup(
  groupId: string,
): Promise<{ drafts: ApiDraft[]; job: DraftJob | null }> {
  return api(`/api/me/drafts/group/${groupId}`);
}

// 문항 여러 개를 한 번에(회사·직무·공고는 한 벌). groupId 를 넘기면 그 카드에 이어 붙인다(실패 문항 재시도).
// 🚨 응답은 **접수(202)**다 — 초안은 아직 없다. 결과·진행률은 getDraftGroup 을 폴링해서 받는다
//    (문항 1건이 34~72초라 응답을 기다리면 게이트웨이 60초에서 끊긴다).
export function createDrafts(input: {
  company: string;
  jobTitle: string;
  jobUrl?: string;
  jobSummary?: string;
  companyContext?: string;
  questions: string[];
  groupId?: string;
  options: DraftOptions;
}): Promise<{ groupId: string; total: number }> {
  return api("/api/me/drafts", { method: "POST", body: JSON.stringify(input) });
}

// 재생성 — 저장된 공고 요약·문항을 서버가 재사용한다(URL 을 다시 보내지 않는다).
// 생성과 같은 잡 경로다: 접수만 하고 돌아오며 결과는 그룹 폴링으로 받는다.
export function refineDraft(
  id: string,
  input: { options?: DraftOptions; instruction?: string },
): Promise<{ groupId: string; total: number }> {
  return api(`/api/me/drafts/${id}/refine`, { method: "POST", body: JSON.stringify(input) });
}

// 본문 수동 편집 저장 — AI 미호출·무과금.
export function updateDraftContent(id: string, content: string): Promise<{ draft: ApiDraft }> {
  return api(`/api/me/drafts/${id}`, { method: "PATCH", body: JSON.stringify({ content }) });
}

// 문항 1개(행) 삭제.
export function deleteDraft(id: string): Promise<{ ok: true }> {
  return api(`/api/me/drafts/${id}`, { method: "DELETE" });
}

// 카드 통째 삭제 — 그 그룹의 문항 전부.
export function deleteDraftGroup(groupId: string): Promise<{ ok: true; removed: number }> {
  return api(`/api/me/drafts/group/${groupId}`, { method: "DELETE" });
}

// ── 크레딧 지갑 / 결제(사이클8) ────────────────────────
export interface CreditProduct {
  id: string;
  name: string;
  amountKrw: number;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  krwPerCredit: number;
  badge?: string | null;
  highlight?: boolean;
}

export interface LedgerEntry {
  id: string;
  entryType: "charge" | "debit";
  reason: "purchase" | "answer" | "ingest" | "embedding" | "draft" | "admin_adjust";
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
}

export interface PaymentOrder {
  id: string;
  productId: string;
  amountKrw: number;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  status: "pending" | "paid" | "failed" | "canceled";
  paidAt?: string | null;
  createdAt: string;
}

export function getWallet(): Promise<{
  balance: number;
  products: CreditProduct[];
}> {
  return api("/api/me/wallet");
}

export function getWalletLedger(
  page = 1,
  size = 20,
): Promise<{ ledger: LedgerEntry[]; total: number; page: number; size: number }> {
  return api(`/api/me/wallet/ledger?page=${page}&size=${size}`);
}

// 등록 결제 카드(토스 자동결제). 🔒 빌링키는 서버 전용이라 이 타입에 존재하지 않는다.
export interface BillingCard {
  id: string;
  provider: string;
  cardCompany?: string | null;
  cardNumberMasked?: string | null;
  cardType?: string | null;
  ownerType?: string | null;
  isDefault: boolean;
  createdAt: string;
}

// 등록 카드 목록 + customerKey. customerKey 는 카드 등록창을 열 때 필요한데 **서버가 만든 값만**
// 쓴다 — 프론트에서 조립하면 이미 발급된 빌링키와 어긋난다(server pricing.ts tossCustomerKey).
export function listBillingCards(): Promise<{ cards: BillingCard[]; customerKey: string }> {
  return api("/api/me/billing/cards");
}

// 카드 등록창 복귀(successUrl)에서 받은 일회용 authKey 로 빌링키 발급.
export function registerBillingCard(
  authKey: string,
): Promise<{ card: BillingCard; cards: BillingCard[] }> {
  return api("/api/me/billing/cards", {
    method: "POST",
    body: JSON.stringify({ authKey }),
  });
}

export function deleteBillingCard(id: string): Promise<{ cards: BillingCard[] }> {
  return api(`/api/me/billing/cards/${id}`, { method: "DELETE" });
}

// 주문 생성 → 등록 카드로 결제. 금액·크레딧은 서버가 상품 id 로 산출하므로 productId 만 보낸다.
export function createOrder(productId: string): Promise<{ order: PaymentOrder }> {
  return api("/api/me/wallet/orders", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

// 저장 카드로 결제 승인 — 리다이렉트 없이 그 자리에서 끝난다. 금액은 보내지 않는다(서버가 DB 주문
// 금액으로만 승인하고, 토스 주문번호도 서버가 만든다).
export function payOrder(
  orderId: string,
  cardId: string,
): Promise<{ order: PaymentOrder; balance: number }> {
  return api(`/api/me/wallet/orders/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify({ cardId }),
  });
}

// 이용약관·개인정보처리방침(카드#016 3). 인증 없는 공개 GET.
// 미등록·빈 본문은 404 LEGAL_NOT_FOUND → 화면이 "준비 중"으로 렌더한다(정상 흐름).
export type LegalKind = "terms" | "privacy";

export interface ApiLegalDocument {
  kind: LegalKind;
  bodyHtml: string; // 서버 sanitizeRichHtml 통과본
  revisedAt: string; // 'YYYY-MM-DD'(DATEONLY)
  updatedAt: string;
}

export function getLegalDocument(kind: LegalKind): Promise<ApiLegalDocument> {
  return api(`/api/legal/${kind}`);
}
