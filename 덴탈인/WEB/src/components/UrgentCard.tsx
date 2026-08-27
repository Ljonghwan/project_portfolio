"use client";

import Link from "next/link";
import {
  URGENT_JOB_TYPE_LABELS,
  URGENT_WORK_TYPE_LABELS,
  formatDDay,
  type UrgentJobType,
  type UrgentPost,
  type UrgentWorkType,
} from "@/lib/urgents";
import VerifyBadge from "@/components/VerifyBadge";

type Props = {
  post: UrgentPost;
  onToggleBookmark?: (post: UrgentPost) => void;
};

export default function UrgentCard({ post, onToggleBookmark }: Props) {
  const firstJob = post.jobTypes[0] as UrgentJobType | undefined;
  const firstWork = post.workTypes[0] as UrgentWorkType | undefined;
  const metaParts: string[] = [];
  if (firstJob) metaParts.push(URGENT_JOB_TYPE_LABELS[firstJob]);
  if (firstWork) metaParts.push(URGENT_WORK_TYPE_LABELS[firstWork]);
  const meta = metaParts.join(" · ");

  return (
    <article className="urgent with-flag">
      <span className="urgent-flag">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        급구
      </span>
      <button
        type="button"
        className={`bookmark ${post.bookmarked ? "on" : ""}`}
        aria-label={post.bookmarked ? "관심 해제" : "관심 등록"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleBookmark?.(post);
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
        </svg>
      </button>
      <Link
        href={`/urgents/${post.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div className="clinic">{post.hospitalName}{post.authorLicenseVerified && <VerifyBadge title="사업자 인증 완료" />}</div>
        <h5>{post.title}</h5>
        {meta && <div className="meta">{meta}</div>}
        <div className="loc">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {post.region}
        </div>
        <span className="dday">{formatDDay(post.expiredAt)}</span>
      </Link>
    </article>
  );
}
