// 급구 게시판 공통 타입 + 라벨/유틸 (Sprint 3-C)

export type UrgentJobType =
  | "clinic"
  | "desk"
  | "consult"
  | "insurance"
  | "inHouseLab"
  | "dentalLab"
  | "management"
  | "ortho"
  | "etc";

// p2-6: 값은 서버 /api/codes(urgentJobType/urgentWorkType/urgentSalaryType/urgentSort)에서 채움.
export const URGENT_JOB_TYPES: UrgentJobType[] = [];
export const URGENT_JOB_TYPE_LABELS: Record<string, string> = {};

export type UrgentWorkType = "full_time" | "contract" | "part_time" | "intern";
export const URGENT_WORK_TYPES: UrgentWorkType[] = [];
export const URGENT_WORK_TYPE_LABELS: Record<string, string> = {};

export type UrgentSalaryType = "monthly" | "daily" | "hourly" | "negotiable";
export const URGENT_SALARY_TYPES: UrgentSalaryType[] = [];
export const URGENT_SALARY_TYPE_LABELS: Record<string, string> = {};

export type UrgentSort = "latest" | "popular" | "expiring";
export const URGENT_SORT_OPTIONS: { value: UrgentSort; label: string }[] = [];

export type UrgentPost = {
  id: number;
  corpUserId?: number;
  hospitalName: string;
  title: string;
  region: string;
  address: string | null;
  addressDetail: string | null;
  jobTypes: UrgentJobType[];
  workTypes: UrgentWorkType[];
  headcount: number;
  salaryType: UrgentSalaryType;
  salaryText?: string | null; // deprecated — salaryAmount로 대체(p2-urgent-detail-fix)
  salaryAmount: number | null; // 월급=만원 / 일급·시급=원 / 협의=null
  workHours: string | null;
  contactPhone: string;
  content: string;
  images: string[];
  expiredAt: string;
  viewCount: number;
  bookmarkCount: number;
  commentCount: number;
  isMine: boolean;
  authorLicenseVerified?: boolean; // G5 N3: 작성 병원/회원 사업자·면허 인증완료(active+verified)
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  corpUser?: { id: number; name: string } | null;
};

export type UrgentListResponse = {
  items: UrgentPost[];
  total: number;
  page: number;
  pageSize: number;
};

export type UrgentFilter = {
  region: string;
  jobType: string;
  workType: string;
  keyword: string;
  sort: UrgentSort;
  page: number;
};

export type UrgentFormInput = {
  hospitalName: string;
  title: string;
  region: string;
  address: string | null;
  addressDetail: string | null;
  jobTypes: UrgentJobType[];
  workTypes: UrgentWorkType[];
  headcount: number;
  salaryType: UrgentSalaryType;
  salaryText?: string | null; // deprecated — salaryAmount로 대체(p2-urgent-detail-fix)
  salaryAmount: number | null; // 월급=만원 / 일급·시급=원 / 협의=null
  workHours: string | null;
  contactPhone: string;
  content: string;
  images: string[];
  expiredAt?: string;
};

export const URGENT_IMAGE_MAX = 5;
export const URGENT_TITLE_MAX = 20;
export const URGENT_CONTENT_MAX = 1000;

// p2-urgent-detail-fix 작업1: 채용 formatSalary 패턴 — 타입 라벨 + 금액 + 타입별 단위.
// 월급=만원("월급 300만원"), 일급/시급=원("일급 150,000원"/"시급 12,000원"), 협의=금액 없이 "협의".
export function formatUrgentSalary(salaryType: UrgentSalaryType, salaryAmount: number | null): string {
  const label = URGENT_SALARY_TYPE_LABELS[salaryType] || salaryType;
  if (salaryType === "negotiable") return label || "협의"; // 협의는 금액 미표기
  if (salaryAmount == null) return label; // 금액 미입력 시 타입 라벨만
  const unit = salaryType === "monthly" ? "만원" : "원";
  return `${label} ${salaryAmount.toLocaleString()}${unit}`;
}

// D-day 계산. expiredAt이 미래면 양수, 오늘이면 0("D-Day"), 과거면 음수(마감).
export function calcDDay(expiredAt: string): number {
  const exp = new Date(expiredAt);
  const today = new Date();
  exp.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDDay(expiredAt: string): string {
  const d = calcDDay(expiredAt);
  if (d < 0) return "마감";
  if (d === 0) return "D-Day";
  return `D-${d}`;
}

export function isExpired(expiredAt: string): boolean {
  return new Date(expiredAt).getTime() < Date.now();
}

export function formatRelative(date: string): string {
  const t = new Date(date).getTime();
  const diff = Date.now() - t;
  const day = 1000 * 60 * 60 * 24;
  if (diff < 1000 * 60) return "방금 전";
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}분 전`;
  if (diff < day) return `${Math.floor(diff / (1000 * 60 * 60))}시간 전`;
  if (diff < day * 7) return `${Math.floor(diff / day)}일 전`;
  return new Date(date).toLocaleDateString("ko-KR");
}

export function notSupported(message?: string): void {
  alert(message ?? "이 기능은 추후 지원 예정입니다.");
}
