// 채용공고 공통 타입 + 라벨/유틸

export type WorkType = "full_time" | "contract" | "part_time" | "intern";
export type SalaryType =
  | "interview"
  | "internal"
  | "annual"
  | "monthly"
  | "weekly"
  | "daily"
  | "hourly"
  | "perCase";
// p2-7: 채용 경력 3셋(시안). 구 6셋 → experienced로 마이그레이션됨.
export type CareerType = "newcomer" | "experienced" | "any";
// JobType(8셋)은 PersonalProfile/지원자 직종 표시 전용 유지(채용 담당업무 아님).
export type JobType =
  | "clinical"
  | "desk"
  | "consultant"
  | "hygienist"
  | "coordinator"
  | "insurance"
  | "technician"
  | "management";
// p2-7: 채용 담당업무 9셋(urgentJobType 재사용, 다중). JobPost.jobTypes.
export type JobDutyType =
  | "clinic"
  | "desk"
  | "consult"
  | "insurance"
  | "inHouseLab"
  | "dentalLab"
  | "management"
  | "ortho"
  | "etc";
// p2-7 fix6(D1): 시안 3개. 구 visit/homepage → etc 마이그레이션.
export type ApplyMethod = "email" | "phone" | "etc";
export type JobStatus = "draft" | "active" | "closed";

export type JobCorpProfile = {
  representative: string | null;
  businessName: string | null;
  employeeText: string | null;
  homepage: string | null;
};

export type JobPost = {
  id: number;
  corpUserId: number;
  authorLicenseVerified?: boolean; // G5 N3: 공고 병원 사업자 인증완료(active+verified)
  title: string;
  hospitalName: string;
  hospitalIntro: string | null;
  hospitalImages: string[] | null;
  videoUrl: string | null;
  jobDuties: string; // p2-7: 세부내용 리치HTML
  requiredCerts: string[] | null; // p2-7: requiredCertType 키 배열
  // p2-7 신규 (시안)
  businessName?: string | null;
  representative?: string | null;
  staffCount?: number | null;
  doctorCount?: number | null;
  homepage?: string | null;
  memberDesc?: string | null;
  businessType?: string | null;
  workEnvTags?: string[] | null;
  treatmentFields?: string[] | null;
  submitDocs?: string[] | null;
  preferential?: string | null;
  qualifications?: string | null;
  recruitStartAt?: string | null;
  recruitEndAt?: string | null;
  alwaysHiring?: boolean;
  applyMethodEtc?: string | null;
  workType: WorkType;
  jobTypes: JobDutyType[] | null; // p2-7: 담당업무 다중(urgentJobType 9셋). 구 단일 jobType 대체.
  headcount: number;
  position: string | null;
  dutySummary: string | null;
  positionLevel: string | null; // p2-7: jobPositionLevel 키
  salaryType: SalaryType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
  education: string | null;
  careerType: CareerType;
  careerYearsMin: number;
  careerYearsMax: number;
  workDays: string | null;
  workHours: string | null;
  benefits: BenefitCode[] | null;
  etcWorkConditions: string | null;
  workEnvironment: string | null;
  applyMethod: ApplyMethod[];
  applyEmail: string | null;
  applyPhone: string | null;
  selectionProcess: string | null;
  region: string | null;
  address: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  nearestStation: string | null;
  status: JobStatus;
  viewCount: number;
  publishedAt: string | null;
  closedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  corpUser?: { id: number; name: string };
  corpProfile?: JobCorpProfile;
  bookmarked?: boolean;
  // p2-cleanup #4: 지원 기능 제거 — applicationCount/hasApplied 필드 삭제(접수는 외부 이메일/전화).
};

// p2-jobapply-remove-final: 지원(application) 타입/라벨 전면 제거 — 지원 기능 폐기.

export type BookmarkAvailability = "active" | "closed" | "expired" | "deleted";

export type BookmarkedJobItem = {
  bookmarkedAt: string;
  jobPostId: number;
  availability: BookmarkAvailability;
  job: JobPost | null;
};

// p2-6: 라벨/키 값은 codesHydrate가 서버 /api/codes로 채움. WORK_TYPE_CLASSES만 CSS 매핑이라 유지.
export const AVAILABILITY_LABELS: Record<string, string> = {};
export const WORK_TYPE_LABELS: Record<string, string> = {};
export const WORK_TYPES: WorkType[] = [];

export const WORK_TYPE_CLASSES: Record<string, string> = {
  full_time: "full",
  contract: "contract",
  part_time: "part",
  intern: "intern",
};

export const SALARY_TYPE_LABELS: Record<string, string> = {};
export const SALARY_TYPES: SalaryType[] = [];
export const CAREER_TYPE_LABELS: Record<string, string> = {};
export const CAREER_TYPES: CareerType[] = [];
export const APPLY_METHOD_LABELS: Record<string, string> = {};
// JobType(8셋) — PersonalProfile/지원자 직종 표시 전용.
export const JOB_TYPE_LABELS: Record<string, string> = {};
export const JOB_TYPES: JobType[] = [];

// p2-7: 채용 담당업무 9셋(서버 urgentJobType 도메인에서 hydrate).
export const JOB_DUTY_TYPES: JobDutyType[] = [];
export const JOB_DUTY_TYPE_LABELS: Record<string, string> = {};

// p2-7: 시안 채용 폼 신규 enum (codesHydrate가 채움).
export const BUSINESS_TYPES: string[] = [];
export const BUSINESS_TYPE_LABELS: Record<string, string> = {};
export const REQUIRED_CERT_TYPES: string[] = [];
export const REQUIRED_CERT_TYPE_LABELS: Record<string, string> = {};
export const WORK_ENV_TAGS: string[] = [];
export const WORK_ENV_TAG_LABELS: Record<string, string> = {};
export const TREATMENT_FIELDS: string[] = [];
export const TREATMENT_FIELD_LABELS: Record<string, string> = {};
export const SUBMIT_DOCS: string[] = [];
export const SUBMIT_DOC_LABELS: Record<string, string> = {};
export const JOB_EDUCATIONS: string[] = [];
export const JOB_EDUCATION_LABELS: Record<string, string> = {};
export const JOB_POSITION_LEVELS: string[] = [];
export const JOB_POSITION_LEVEL_LABELS: Record<string, string> = {};
// 급여 select(시안 4셋). 표시/legacy salaryType(8)은 SALARY_TYPE_LABELS 유지.
export const JOB_SALARY_TYPES: string[] = [];
export const JOB_SALARY_TYPE_LABELS: Record<string, string> = {};

// p2-7: 복리후생 12셋(시안).
export type BenefitCode =
  | "insurance"
  | "severance"
  | "leave"
  | "incentive"
  | "holidayBonus"
  | "birthdayLeave"
  | "event"
  | "healthCheckup"
  | "eduSupport"
  | "selfDev"
  | "workshop"
  | "etc";

export const BENEFIT_LABELS: Record<string, string> = {};
export const BENEFIT_CODES: BenefitCode[] = [];

export function formatSalary(post: Pick<JobPost, "salaryType" | "salaryMin" | "salaryMax" | "salaryNegotiable">): string {
  if (post.salaryType === "interview") return "면접 후 결정";
  if (post.salaryType === "internal") return "회사 내규에 따름";
  // p2-jobform-detail-11 #8: 급여 미입력(협의) → "면접 후 결정" 표기
  if (post.salaryNegotiable) return "면접 후 결정";
  const unit =
    post.salaryType === "annual" ? "만원" :
    post.salaryType === "monthly" ? "만원" :
    post.salaryType === "weekly" ? "원" :
    post.salaryType === "daily" ? "원" :
    post.salaryType === "hourly" ? "원" :
    post.salaryType === "perCase" ? "원" : "원";
  const prefix = SALARY_TYPE_LABELS[post.salaryType];
  const fmt = (n: number | null) => (n == null ? "?" : n.toLocaleString());
  if (post.salaryMin != null && post.salaryMax != null && post.salaryMin !== post.salaryMax) {
    return `${prefix} ${fmt(post.salaryMin)}~${fmt(post.salaryMax)}${unit}`;
  }
  const v = post.salaryMax ?? post.salaryMin;
  if (v == null) return "면접 후 결정";
  return `${prefix} ${fmt(v)}${unit}`;
}

export function isNew(publishedAt: string | null): boolean {
  if (!publishedAt) return false;
  const t = new Date(publishedAt).getTime();
  return Date.now() - t < 1000 * 60 * 60 * 24 * 7; // 7일 이내
}

export function notSupported(message = "이 기능은 추후 지원 예정입니다.") {
  if (typeof window !== "undefined") window.alert(message);
}

// YouTube URL에서 video ID 추출. youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/ 지원.
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v && /^[\w-]{6,}$/.test(v) ? v : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|v)\/([\w-]{6,})/);
      return m ? m[2] : null;
    }
  } catch {
    return null;
  }
  return null;
}

// 상시채용 표기 공통화(F8 확장, 2026-06-22): alwaysHiring이면 D-day/마감/모집기간 대신 "상시채용".
// 데이터상 상시는 expiredAt이 null 또는 먼 미래(2036) 혼재 → alwaysHiring 단일 판정으로 통일.
export function isAlwaysHiring(job: { alwaysHiring?: boolean | null } | null | undefined): boolean {
  return !!job?.alwaysHiring;
}
// 마감 라벨: 상시채용이면 "상시채용", 아니면 마감일(fmt) / 없으면 "상시".
export function jobDeadlineLabel(
  job: { alwaysHiring?: boolean | null; expiredAt: string | null },
  fmt: (s: string) => string,
): string {
  if (isAlwaysHiring(job)) return "상시채용";
  return job.expiredAt ? fmt(job.expiredAt) : "상시";
}
// 모집기간 라벨: 상시채용이면 "상시채용", 아니면 "시작 ~ 마감"(fmt는 null 허용).
export function jobPeriodLabel(
  job: { alwaysHiring?: boolean | null; publishedAt?: string | null; createdAt?: string | null; expiredAt: string | null },
  fmt: (s: string | null) => string,
): string {
  if (isAlwaysHiring(job)) return "상시채용";
  return `${fmt(job.publishedAt ?? job.createdAt ?? null)} ~ ${fmt(job.expiredAt)}`;
}
