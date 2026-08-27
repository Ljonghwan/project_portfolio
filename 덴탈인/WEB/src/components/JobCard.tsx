"use client";

// 채용 리스트 카드 공용 컴포넌트 — /jobs 목록 + /search 통합검색 공용(search-cards-unify).
// 시안 .job 마크업 1:1(photo/clinic/h5/tags(workType+직종)/loc/pay=formatSalary + NEW 배지).
import Link from "next/link";
import {
  type JobPost,
  WORK_TYPE_LABELS,
  WORK_TYPE_CLASSES,
  JOB_DUTY_TYPE_LABELS,
  formatSalary,
  isNew,
} from "@/lib/jobs";
import VerifyBadge from "@/components/VerifyBadge";

// 카드에 필요한 최소 필드만 — 검색 row(JobPost 일부)와도 호환.
type JobCardData = Pick<
  JobPost,
  | "id"
  | "hospitalName"
  | "title"
  | "hospitalImages"
  | "workType"
  | "jobTypes"
  | "region"
  | "salaryType"
  | "salaryMin"
  | "salaryMax"
  | "salaryNegotiable"
  | "publishedAt"
  | "bookmarked"
  | "authorLicenseVerified"
>;

type Props = {
  job: JobCardData;
  onToggleBookmark?: (jobId: number, currentlyBookmarked: boolean) => void;
};

export default function JobCard({ job, onToggleBookmark }: Props) {
  return (
    <Link href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="job">
      <div
        className="photo"
        style={{
          backgroundImage: job.hospitalImages?.[0] ? `url(${job.hospitalImages[0]})` : undefined,
        }}
      >
        <button
          type="button"
          className={`bookmark ${job.bookmarked ? "on" : ""}`}
          aria-label={job.bookmarked ? "스크랩 해제" : "스크랩"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark?.(job.id, !!job.bookmarked);
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>
      <div className="clinic">{job.hospitalName}{job.authorLicenseVerified && <VerifyBadge title="사업자 인증 완료" />}</div>
      <h5>{job.title}</h5>
      <div className="tags">
        <span className={`t ${WORK_TYPE_CLASSES[job.workType]}`}>{WORK_TYPE_LABELS[job.workType]}</span>
        {(job.jobTypes ?? []).slice(0, 2).map((jt) => (
          <span key={jt} className="t">
            {JOB_DUTY_TYPE_LABELS[jt] ?? jt}
          </span>
        ))}
      </div>
      <div className="loc">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {job.region || "지역 미정"}
      </div>
      <div className="pay">
        {formatSalary(job)}
        {isNew(job.publishedAt) && <span className="new">NEW</span>}
      </div>
    </Link>
  );
}

export type { JobCardData };
