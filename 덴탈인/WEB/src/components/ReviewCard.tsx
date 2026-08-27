"use client";

import Link from "next/link";
import { type Review, formatRelative } from "@/lib/reviews";
import VerifyBadge from "@/components/VerifyBadge";

type Props = {
  review: Review;
  hot?: boolean;
  onToggleLike?: (review: Review) => void;
  onToggleDislike?: (review: Review) => void;
};

export default function ReviewCard({ review, hot, onToggleLike, onToggleDislike }: Props) {
  return (
    <article className="review-card">
      {hot && <div className="hot">HOT</div>}
      <Link
        href={`/reviews/${review.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div className="quote" aria-hidden="true">
          <svg viewBox="0 0 32 26" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 26V14.5C0 6.5 4.4 1.4 12 0l1.6 4.5c-4.4 1.4-6.6 4-6.6 7.5h5.6V26H0zm18.4 0V14.5c0-8 4.4-13.1 12-14.5L32 4.5c-4.4 1.4-6.6 4-6.6 7.5H31V26H18.4z" />
          </svg>
        </div>
        <p className="body">{review.content}</p>
        <div className="meta">
          <b>{review.authorAlias}</b>
          {review.authorLicenseVerified && <VerifyBadge title="면허증 인증 완료" />}
          {review.isMine && (
            <span style={{ color: "var(--brand-ink)", fontWeight: 700, marginLeft: 4 }}>(내 글)</span>
          )}
          <span> · </span>
          <span>{formatRelative(review.createdAt)}</span>
        </div>
        <div className="loc">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {review.region}
        </div>
        <div className="hosp">{review.hospitalName}</div>
      </Link>
      <div className="react">
        <button
          type="button"
          className={`like ${review.likedByMe ? "on" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleLike?.(review);
          }}
          aria-label={review.likedByMe ? "좋아요 해제" : "좋아요"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
          </svg>
          {review.likeCount}
        </button>
        <button
          type="button"
          className={`dislike ${review.dislikedByMe ? "on" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleDislike?.(review);
          }}
          aria-label={review.dislikedByMe ? "싫어요 해제" : "싫어요"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: "rotate(180deg)" }}
          >
            <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
          </svg>
          {review.dislikeCount}
        </button>
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {review.commentCount}
        </span>
      </div>
    </article>
  );
}
