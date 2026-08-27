"use client";

import {
  URGENT_WORK_TYPE_LABELS,
  formatDDay,
  formatUrgentSalary,
  type UrgentPost,
} from "@/lib/urgents";
import { formatPhone } from "@/lib/format";

type Props = {
  post: UrgentPost;
  onToggleBookmark?: () => void;
  bookmarkBusy?: boolean;
};

export default function UrgentApplyAside({ post, onToggleBookmark, bookmarkBusy }: Props) {
  const dday = formatDDay(post.expiredAt);
  // p2-urgent-detail-fix: 구조화된 급여 표기(타입 라벨 + 금액 + 단위). 채용 formatSalary 패턴.
  const salary = formatUrgentSalary(post.salaryType, post.salaryAmount);
  const firstWork = post.workTypes[0];
  // BUG-1(p2-urgents-full-qa): address(roadAddress)가 시/도 포함한 전체주소 → 단일 출처.
  // region(sido) bold + address 동시 노출은 중복("서울 서울…")/불일치("대구 경기…")를 유발하므로,
  // address의 첫 토큰(시/도)을 bold, 나머지를 본문으로. address 없으면 region fallback.
  const addrParts = (post.address || "").trim().split(/\s+/).filter(Boolean);
  const addrHead = addrParts[0] || post.region;
  const addrTail = addrParts.slice(1).join(" ");

  return (
    <aside className="urgent-apply">
      <div className="lead">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        마감 임박 · {dday}
      </div>
      <div className="pay">{salary}</div>
      <div className="pay-sub">
        {firstWork ? URGENT_WORK_TYPE_LABELS[firstWork] : ""}
        {post.salaryType === "negotiable" ? " · 협의 가능" : ""}
      </div>

      <div className="quick">
        <div className="q-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>
            <b>{addrHead}</b>
            {addrTail ? ` ${addrTail}` : ""}
            {post.addressDetail ? `, ${post.addressDetail}` : ""}
          </span>
        </div>
        {post.workHours && (
          <div className="q-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span><b>{post.workHours}</b></span>
          </div>
        )}
        <div className="q-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="m22 11-3 3-2-2" />
          </svg>
          <span>모집인원 <b>{post.headcount}명</b></span>
        </div>
        {post.contactPhone && (
          <div className="q-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span><b>{formatPhone(post.contactPhone)}</b></span>
          </div>
        )}
      </div>

      <div className="apply-actions">
        <button
          type="button"
          className={`urgent-apply-btn outline ${post.bookmarked ? "on" : ""}`}
          onClick={onToggleBookmark}
          disabled={bookmarkBusy}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
          </svg>
          {post.bookmarked ? "관심 해제" : "관심 등록"}
        </button>
      </div>
    </aside>
  );
}
