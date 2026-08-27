"use client";

import Link from "next/link";
import { type TalkPost, formatRelative, avatarColorClass } from "@/lib/talks";
import VerifyBadge from "@/components/VerifyBadge";

type Props = {
  post: TalkPost;
  onToggleLike?: (post: TalkPost) => void;
};

export default function TalkCard({ post, onToggleLike }: Props) {
  const imgCount = Array.isArray(post.images) ? post.images.length : 0;
  return (
    <article className="talk-card">
      <Link
        href={`/talks/${post.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div className="talk-head">
          <div className={`ava ${avatarColorClass(post.authorAlias)}`} aria-hidden="true">
            {post.authorAlias.charAt(0)}
          </div>
          <div className="nick">{post.authorAlias}{post.authorLicenseVerified && <VerifyBadge title="인증 완료" />}</div>
          <div className="time">{formatRelative(post.createdAt)}</div>
        </div>
        {/* Q2=B(p2-cards): 카테고리 칩 제거 — talk.html 리스트 카드 시안과 일치(talk-head→h4→p→react). */}
        <h4>{post.title}</h4>
        <p>{post.content}</p>
        <div className="react">
          <button
            type="button"
            className={`like-stat ${post.likedByMe ? "on" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleLike?.(post);
            }}
            aria-label={post.likedByMe ? "좋아요 해제" : "좋아요"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
            </svg>
            {post.likeCount}
          </button>
          {/* BUG-4=A(p2-bug4): 시안 talk.html 리스트 react = 좋아요/싫어요/댓글. 조회 제거, 싫어요 추가. */}
          <span aria-label="싫어요">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "rotate(180deg)" }}>
              <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
            </svg>
            {post.dislikeCount}
          </span>
          <span aria-label="댓글">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.commentCount}
          </span>
          {/* H3: 이미지 N개 뱃지를 메타(react) 행 우측으로 이동(margin-left:auto). 데스크탑·모바일 일관. */}
          {imgCount > 0 && (
            <span className="img-badge" aria-label={`사진 ${imgCount}장`} style={{ marginLeft: "auto" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              {imgCount}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
