// 병원후기 공통 타입 + 라벨/유틸 (Sprint 3-A / P1-reviews FIX)
import { api } from "./api";
import {
  JOB_TYPE_LABELS,
  JOB_TYPES,
  type JobType,
} from "./jobs";

// P1-reviews FIX (Q10.A): sort 3-enum.
export type ReviewSort = "latest" | "rating" | "like";

// p2-6: 타입(코드 계약)은 명시 union 유지, 값은 서버 /api/codes에서 codesHydrate가 채움.
export type ReviewCareerType = "new" | "1to3" | "4to6" | "7to9" | "10to15" | "16to20" | "21plus";
export const REVIEW_CAREER_TYPES: ReviewCareerType[] = [];
export const REVIEW_CAREER_TYPE_LABELS: Record<string, string> = {};

export type ReviewSalaryType = "under250" | "250to300" | "300to400" | "400to500" | "over500";
export const REVIEW_SALARY_TYPES: ReviewSalaryType[] = [];
export const REVIEW_SALARY_TYPE_LABELS: Record<string, string> = {};

// P1-reviews FIX 사이클 #4 (Q14.A): 후기 도메인 전용 9-enum (jobs.ts 8-enum + student).
// 시안 6종: 치과 의사 / 치과 위생사 / 치과기공사 / 코디네이터 / 학생 / 기타 진료스탭
// 매핑: clinical→치과 의사 / hygienist→치과 위생사 / technician→치과기공사(띄어쓰기 X) /
//       coordinator→코디네이터 / student→학생(신규) / management→기타 진료스탭.
// 후기 도메인 한정 — jobs/PersonalProfile 도메인은 8-enum 유지.
export type ReviewJobType = JobType | "student" | "nurse_assistant";

// p2-6: 서버 /api/codes(reviewJobLabelOverride / reviewJobType)에서 채움.
export const REVIEW_JOB_LABEL_OVERRIDE: Record<string, string> = {};
export const REVIEW_JOB_TYPE_OPTIONS: { value: ReviewJobType; label: string }[] = [];

export type Review = {
  id: number;
  hospitalName: string;
  region: string;
  jobType: ReviewJobType;
  title: string;
  content: string;
  rating: number; // deprecated — 5-C에서 제거 예정. 4축 평균(반올림).
  // P1-reviews FIX (Q8.A): 4축 RENAME — 급여수준/분위기/업무강도/직원복지.
  ratingSalary: number | null;
  ratingAtmosphere: number | null;
  ratingWorkload: number | null;
  ratingWelfare: number | null;
  ratingAvg: number | null;
  // P1-reviews FIX (Q9.A): RENAME (employee/director → staff/doctor) + 범위 0~999/0~99.
  staffCount: number | null;
  doctorCount: number | null;
  // P1-reviews FIX (Q5/Q6): RENAME (my* → *).
  careerType: ReviewCareerType | null;
  salaryType: ReviewSalaryType | null;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  authorAlias: string;
  authorLicenseVerified: boolean;
  isMine: boolean;
  hiddenByAdmin?: boolean;
  likedByMe: boolean;
  dislikedByMe: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReviewListResponse = {
  items: Review[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReviewFilter = {
  region: string; // 콤마 구분 다중값
  jobType: string; // 콤마 구분 다중값
  keyword: string;
  sort: ReviewSort;
  page: number;
};

export type ReviewFormInput = {
  hospitalName: string;
  region: string;
  // P1-reviews FIX 사이클 #4 (Q14.A): 후기 폼은 student 포함 9-enum.
  jobType: ReviewJobType;
  title: string;
  content: string;
  ratingSalary: number;
  ratingAtmosphere: number;
  ratingWorkload: number;
  ratingWelfare: number;
  staffCount?: number | null;
  doctorCount?: number | null;
  careerType?: ReviewCareerType | null;
  salaryType?: ReviewSalaryType | null;
};

// 4축 라벨/필드 매핑 — 시안 라벨 1:1 (급여수준/분위기/업무강도/직원복지).
export const RATING_AXES = [
  { key: "ratingSalary", label: "급여수준" },
  { key: "ratingAtmosphere", label: "분위기" },
  { key: "ratingWorkload", label: "업무강도" },
  { key: "ratingWelfare", label: "직원복지" },
] as const;

export type RatingAxisKey = (typeof RATING_AXES)[number]["key"];

// p2-6: 서버 /api/codes(reviewSort)에서 채움.
export const REVIEW_SORT_OPTIONS: { value: ReviewSort; label: string }[] = [];

export const REVIEW_JOB_TYPES = JOB_TYPES; // jobs.ts 가변 배열 참조(같이 채워짐)
export { JOB_TYPE_LABELS };

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

// 좋아요 / 싫어요 API helper (personal 전용. 비로그인/corp 흐름은 호출 측에서 차단)
export async function likeReview(id: number): Promise<void> {
  await api.post(`/api/reviews/${id}/like`, undefined, true);
}

export async function unlikeReview(id: number): Promise<void> {
  await api.del(`/api/reviews/${id}/like`, true);
}

export async function dislikeReview(id: number): Promise<void> {
  await api.post(`/api/reviews/${id}/dislike`, undefined, true);
}

export async function undislikeReview(id: number): Promise<void> {
  await api.del(`/api/reviews/${id}/dislike`, true);
}
