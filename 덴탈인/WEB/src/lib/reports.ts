// P1-reviews FIX (Q11.A): 통합 신고 클라이언트 helper.
// 시안 신고 팝업: 4-enum (광고/스팸 / 욕설/혐오/차별 / 비방/명예훼손 / 기타) + detail<=500.
// targetType은 post(게시글) | comment(댓글) 2-enum. boardType은 review|talk|urgent 3-enum.
import { api } from "./api";

// board/target은 라우팅/로직 구조 계약(라벨 없음) → 슬러그 union 고정.
export type ReportBoardType = "review" | "talk" | "urgent";
export type ReportTargetType = "post" | "comment";

// 신고 사유: 슬러그+라벨은 서버 /api/codes(reportReason)에서 codesHydrate가 채움.
export type ReportReason = "ad" | "offensive" | "abuse" | "etc";
export const REPORT_REASONS: ReportReason[] = [];
export const REPORT_REASON_LABELS: Record<string, string> = {};

export type ReportContentInput = {
  boardType: ReportBoardType;
  targetType: ReportTargetType;
  boardId: number;
  reason: ReportReason;
  detail?: string;
};

export type ReportContentResponse = {
  reportId: number;
  alreadyReported: boolean;
};

export async function reportContent(input: ReportContentInput) {
  return api.post<ReportContentResponse>("/api/reports", input, true);
}

// F-C item11: 채용공고 신고(JobReport — 커뮤니티 신고와 별도 모델/엔드포인트). 사유는 서버 JOB_REPORT_REASONS enum.
export const JOB_REPORT_REASON_OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "spam", label: "스팸·도배성 공고" },
  { key: "fraud", label: "허위·과장 공고" },
  { key: "inappropriate", label: "부적절한 내용" },
  { key: "other", label: "기타" },
];

export async function reportJob(jobId: number, reason: string, detail?: string) {
  return api.post<{ reportId: number; created: boolean; alreadyReported: boolean }>(
    `/api/jobs/${jobId}/report`,
    { reason, detail: detail || undefined },
    true
  );
}
