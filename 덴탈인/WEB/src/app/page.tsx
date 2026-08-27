"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { api } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { JOB_DUTY_TYPES, JOB_DUTY_TYPE_LABELS, WORK_TYPES, WORK_TYPE_LABELS } from "@/lib/jobs";
import { HOME_CATEGORY_LABELS } from "@/lib/home";
import { URGENT_JOB_TYPE_LABELS, URGENT_WORK_TYPE_LABELS } from "@/lib/urgents";
import { useCodeStore } from "@/stores/codeStore";

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
}

interface JobItem {
  id: number;
  title: string;
  hospitalName: string;
  region: string | null;
  jobTypes: string[] | null; // p2-7: 담당업무 다중
  hospitalImages?: string[] | null; // 카드 썸네일(병원소개사진 첫 장)
  publishedAt: string | null;
}

interface ReviewItem {
  id: number;
  hospitalName: string;
  region: string;
  title: string;
  content: string;
  rating: number;
  ratingAvg?: number | null;
  likeCount: number;
  commentCount?: number;
  viewCount?: number;
  authorAlias?: string;
  createdAt?: string;
}

interface NoticeItem {
  id: number;
  title: string;
  createdAt?: string;
}

interface TalkItem {
  id: number;
  title: string;
  content: string;
  authorAlias: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface UrgentItem {
  id: number;
  hospitalName: string;
  title: string;
  region: string;
  jobTypes?: string[];
  workTypes?: string[];
  expiredAt: string | null;
}

function fmtKoDate(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function fmtRelative(s?: string | null) {
  if (!s) return "";
  const d = new Date(s).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return fmtKoDate(s);
}

const QuoteIcon = () => (
  <svg viewBox="0 0 32 26" fill="#9CA3AF" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0 26V14.5C0 6.5 4.4 1.4 12 0l1.6 4.5c-4.4 1.4-6.6 4-6.6 7.5h5.6V26H0zm18.4 0V14.5c0-8 4.4-13.1 12-14.5L32 4.5c-4.4 1.4-6.6 4-6.6 7.5H31V26H18.4z" />
  </svg>
);

const LocIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ThumbUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h13.5a2 2 0 0 0 1.95-1.55l1.86-8A2 2 0 0 0 19.36 8H14V4a3 3 0 0 0-3-3l-4 9v12" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z" />
  </svg>
);

const ChevronRight = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ChevronLeft = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

// Category SVG icons (9 total, from publishing 1:1)
const CategoryIcons = {
  chair: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-chair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF6B6B" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#000" opacity=".08" />
      <path d="M22 24c0-6 4-10 10-10h16c6 0 10 4 10 10v18H22z" fill="url(#g-chair)" />
      <rect x="28" y="42" width="24" height="22" rx="4" fill="#FCA5A5" />
      <rect x="34" y="20" width="12" height="18" rx="2" fill="#fff" opacity=".5" />
      <circle cx="58" cy="34" r="6" fill="#FBBF24" />
      <path d="M56 32l4 4M58 28v12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  desk: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="24" ry="4" fill="#000" opacity=".08" />
      <rect x="14" y="20" width="52" height="36" rx="4" fill="url(#g-desk)" />
      <rect x="18" y="24" width="44" height="28" rx="2" fill="#DBEAFE" />
      <rect x="22" y="28" width="20" height="3" rx="1.5" fill="#3B82F6" />
      <rect x="22" y="34" width="32" height="2" rx="1" fill="#93C5FD" />
      <rect x="22" y="40" width="28" height="2" rx="1" fill="#93C5FD" />
      <rect x="22" y="46" width="16" height="2" rx="1" fill="#93C5FD" />
      <path d="M8 60h64l-6 6H14z" fill="#1E40AF" />
    </svg>
  ),
  talk: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-talk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C084FC" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#000" opacity=".08" />
      <path d="M14 24c0-4 3-7 7-7h30c4 0 7 3 7 7v18c0 4-3 7-7 7H32l-10 10v-10h-1c-4 0-7-3-7-7z" fill="url(#g-talk)" />
      <circle cx="26" cy="33" r="2.5" fill="#fff" />
      <circle cx="36" cy="33" r="2.5" fill="#fff" />
      <circle cx="46" cy="33" r="2.5" fill="#fff" />
      <path d="M52 50c4 4 12 6 18 4-2 6-10 10-18 8z" fill="#FBBF24" />
    </svg>
  ),
  claim: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-claim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="20" ry="4" fill="#000" opacity=".08" />
      <rect x="20" y="14" width="40" height="50" rx="4" fill="url(#g-claim)" />
      <rect x="24" y="20" width="32" height="40" rx="2" fill="#fff" />
      <rect x="32" y="10" width="16" height="10" rx="2" fill="#065F46" />
      <rect x="34" y="13" width="12" height="4" rx="1" fill="#A7F3D0" />
      <path d="M28 30l3 3 6-6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="38" y="30" width="14" height="2" rx="1" fill="#D1D5DB" />
      <path d="M28 42l3 3 6-6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="38" y="42" width="14" height="2" rx="1" fill="#D1D5DB" />
      <path d="M28 54l3 3 6-6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  tooth: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-tooth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A7F3D0" />
          <stop offset="1" stopColor="#0FB5A6" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="20" ry="4" fill="#000" opacity=".08" />
      <path d="M40 14c-8 0-14 4-18 4-5 0-5 8-3 14 2 6 2 8 3 12 1 4 3 8 5 8s3-6 5-10c1-3 2-4 3-4s2 1 3 4c2 4 3 10 5 10s4-4 5-8c1-4 1-6 3-12 2-6 2-14-3-14-4 0-10-4-18-4z" fill="url(#g-tooth)" />
      <path d="M28 22c2-2 5-3 8-3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="56" cy="22" r="6" fill="#FBBF24" />
      <path d="M56 18v8M52 22h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  lab: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-lab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FDBA74" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#000" opacity=".08" />
      <path d="M28 18h24v8l-2 30c0 4-3 8-10 8s-10-4-10-8l-2-30z" fill="url(#g-lab)" />
      <rect x="28" y="18" width="24" height="6" rx="1" fill="#9A3412" />
      <path d="M34 30c4 2 8 2 12 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="38" cy="44" r="3" fill="#fff" opacity=".7" />
      <circle cx="44" cy="50" r="2" fill="#fff" opacity=".7" />
    </svg>
  ),
  mgmt: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-mgmt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCD34D" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#000" opacity=".08" />
      <rect x="14" y="32" width="12" height="28" rx="2" fill="#FBBF24" />
      <rect x="30" y="22" width="12" height="38" rx="2" fill="url(#g-mgmt)" />
      <rect x="46" y="14" width="12" height="46" rx="2" fill="#F59E0B" />
      <path d="M16 30l16-12 12 8 16-14" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="60" cy="12" r="4" fill="#DC2626" />
    </svg>
  ),
  ortho: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-ortho" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F9A8D4" />
          <stop offset="1" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#000" opacity=".08" />
      <path d="M40 14c-8 0-14 4-18 4-5 0-5 8-3 14 2 6 2 8 3 12 1 4 3 8 5 8s3-6 5-10c1-3 2-4 3-4s2 1 3 4c2 4 3 10 5 10s4-4 5-8c1-4 1-6 3-12 2-6 2-14-3-14-4 0-10-4-18-4z" fill="url(#g-ortho)" />
      <rect x="22" y="38" width="36" height="6" fill="#9CA3AF" />
      <circle cx="28" cy="41" r="3" fill="#E5E7EB" />
      <circle cx="40" cy="41" r="3" fill="#E5E7EB" />
      <circle cx="52" cy="41" r="3" fill="#E5E7EB" />
    </svg>
  ),
  etc: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-etc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="#000" opacity=".08" />
      <rect x="14" y="14" width="22" height="22" rx="4" fill="url(#g-etc)" />
      <rect x="44" y="14" width="22" height="22" rx="4" fill="#22D3BC" />
      <rect x="14" y="44" width="22" height="22" rx="4" fill="#A78BFA" />
      <rect x="44" y="44" width="22" height="22" rx="4" fill="#FBBF24" />
      <circle cx="25" cy="25" r="4" fill="#fff" />
      <circle cx="55" cy="25" r="4" fill="#fff" />
      <circle cx="25" cy="55" r="4" fill="#fff" />
      <circle cx="55" cy="55" r="4" fill="#fff" />
    </svg>
  ),
};

// p2-6 BUG-4: 칩 라벨은 서버 codes(homeCategory)에서. 아이콘(key)/HOT 리본/jobType 슬러그(href)는 디자인·라우팅 자산이라 front 유지.
// cat = homeCategory 키(8개 jobType 슬러그 + 'etc'=기타칩 jobType="").
const CATS: Array<{ key: keyof typeof CategoryIcons; cat: string; jobType: string; ribbon?: string }> = [
  { key: "chair", cat: "clinic", jobType: "clinic" },
  { key: "desk", cat: "desk", jobType: "desk" },
  { key: "talk", cat: "consult", jobType: "consult" },
  { key: "claim", cat: "insurance", jobType: "insurance" },
  { key: "tooth", cat: "inHouseLab", jobType: "inHouseLab" },
  { key: "lab", cat: "dentalLab", jobType: "dentalLab" },
  { key: "mgmt", cat: "management", jobType: "management" },
  { key: "ortho", cat: "ortho", jobType: "ortho" },
  { key: "etc", cat: "etc", jobType: "etc" },
];

// p2-6 BUG-4: 탭 라벨도 서버 homeCategory 소비(cat 키). '전체'(jobType=null)는 필터-전체 UI 컨트롤이라 라벨 고정.
const JOB_TABS: Array<{ cat: string | null; jobType: string | null }> = [
  { cat: null, jobType: null },
  { cat: "clinic", jobType: "clinic" },
  { cat: "desk", jobType: "desk" },
  { cat: "consult", jobType: "consult" },
  { cat: "insurance", jobType: "insurance" },
  { cat: "inHouseLab", jobType: "inHouseLab" },
];

function safeBannerHref(url: string | null): string | undefined {
  if (!url) return undefined;
  return /^(https?:\/\/|\/(?!\/))/i.test(url) ? url : undefined;
}

export default function HomePage() {
  const router = useRouter();
  const codesLoaded = useCodeStore((s) => s.loaded); // codes hydrate 후 리렌더(라벨 서버 반영)
  // 홈 칩/탭 라벨 = 서버 homeCategory(lib 호환레이어, CodesProvider가 SSR 첫 렌더에 동기 hydrate → pop 0).
  const homeLabel = (key: string) => HOME_CATEGORY_LABELS[key] ?? key;
  const { me, loading: meLoading } = useMe(false);
  const [topBanners, setTopBanners] = useState<Banner[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [talks, setTalks] = useState<TalkItem[]>([]);
  const [urgents, setUrgents] = useState<UrgentItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number> | null>(null);
  const [jobsTotal, setJobsTotal] = useState<number | null>(null);
  const [noticeTop, setNoticeTop] = useState<NoticeItem | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slidePausedRef = useRef(false);

  const [activeTab, setActiveTab] = useState(0);
  const [showFab, setShowFab] = useState(false);
  // D2(2026-06-11): D1에서 홈 corp 등록 +FAB 제거 후 dead가 된 corp 간단등록 모달 state/effect/JSX/submit 정리.

  useEffect(() => {
    (async () => {
      const [topRes, jobsRes, reviewsRes, talksRes, urgentsRes, catCountsRes, noticeRes] = await Promise.all([
        api.get<{ items: Banner[] }>(`/api/banners`),
        api.get<{ items: JobItem[] }>(`/api/jobs?page=1&pageSize=15&sort=latest`),
        api.get<{ items: ReviewItem[] }>(`/api/reviews?page=1&pageSize=5&sort=popular`),
        api.get<{ items: TalkItem[] }>(`/api/talks?page=1&pageSize=5&sort=latest`),
        api.get<{ items: UrgentItem[] }>(`/api/urgents?page=1&pageSize=10&sort=expiring`),
        api.get<{ counts: Record<string, number>; total: number }>(`/api/jobs/category-counts`),
        api.get<{ items: NoticeItem[] }>(`/api/support/notices?page=1&pageSize=1`),
      ]);
      if (topRes.success && topRes.data) setTopBanners(topRes.data.items);
      if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data.items);
      if (reviewsRes.success && reviewsRes.data) setReviews(reviewsRes.data.items);
      if (talksRes.success && talksRes.data) setTalks(talksRes.data.items);
      if (urgentsRes.success && urgentsRes.data) setUrgents(urgentsRes.data.items);
      if (catCountsRes.success && catCountsRes.data) {
        setCategoryCounts(catCountsRes.data.counts);
        setJobsTotal(catCountsRes.data.total ?? null);
      }
      if (noticeRes.success && noticeRes.data && noticeRes.data.items.length > 0) {
        setNoticeTop(noticeRes.data.items[0]);
      }
    })();
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const jt = sp.get("jobType");
    if (jt) {
      const idx = JOB_TABS.findIndex((t) => t.jobType === jt);
      if (idx >= 0) setActiveTab(idx);
    }
  }, []);

  // Hero 슬라이드 자동 전환: 2개 이상이고 hover 안 했을 때 5초마다
  useEffect(() => {
    if (topBanners.length < 2) return;
    const t = setInterval(() => {
      if (slidePausedRef.current) return;
      setSlideIndex((i) => (i + 1) % topBanners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [topBanners.length]);

  // 배너 개수가 줄어들면 인덱스를 정상 범위로 정규화
  useEffect(() => {
    if (topBanners.length === 0) {
      setSlideIndex(0);
    } else if (slideIndex >= topBanners.length) {
      setSlideIndex(0);
    }
  }, [topBanners.length, slideIndex]);

  useEffect(() => {
    function onScroll() {
      setShowFab(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 더미 FALLBACK 제거: 실 데이터 0건이면 빈 배열 → 각 섹션이 빈 상태 안내를 렌더(개발/빈 DB에서 가짜 리스트 노출 방지).
  const reviewItems = reviews.slice(0, 5);
  const talkItems = talks.slice(0, 5);
  const urgentItems = urgents.slice(0, 10);

  // F7 HOT 기준(자기조정형): 홈 노출 목록 중 engagement score(좋아요×10+댓글×3+조회)가
  //   가장 높은 1건에만 HOT. score>0일 때만(전부 0이면 미노출). 절대 임계값(데이터 적으면 무의미) 회피.
  const hotReviewId = useMemo(() => {
    let best = -1, bestScore = 0;
    for (const r of reviewItems) {
      const s = (r.likeCount || 0) * 10 + (r.commentCount || 0) * 3 + (r.viewCount || 0);
      if (s > bestScore) { bestScore = s; best = r.id; }
    }
    return bestScore > 0 ? best : -1;
  }, [reviewItems]);
  const hotTalkId = useMemo(() => {
    let best = -1, bestScore = 0;
    for (const t of talkItems) {
      const s = (t.likeCount || 0) * 10 + (t.commentCount || 0) * 3 + (t.viewCount || 0);
      if (s > bestScore) { bestScore = s; best = t.id; }
    }
    return bestScore > 0 ? best : -1;
  }, [talkItems]);

  const catItems = useMemo(() => {
    // H1: HOT 뱃지 = active(노출중·미숨김·미만료) 공고수 최다 직무 1개(서버 /api/jobs/category-counts 기준).
    //   'etc'(기타)는 특정 직무가 아니라 제외. 동률 시 CATS 정의 순서상 먼저 나오는 직무. 카운트 0이면 HOT 없음.
    let hotJobType: string | null = null;
    if (categoryCounts) {
      let max = 0;
      for (const c of CATS) {
        if (c.jobType === "etc") continue;
        const n = categoryCounts[c.jobType] ?? 0;
        if (n > max) { max = n; hotJobType = c.jobType; }
      }
    }
    return CATS.map((c) => {
      const n = categoryCounts?.[c.jobType] ?? 0;
      return {
        ...c,
        ribbon: c.jobType === hotJobType ? "HOT" : undefined,
        lbl: homeLabel(c.cat), // 서버 homeCategory 라벨(9셋)
        count: categoryCounts ? `${n.toLocaleString()} 공고` : "—",
        href: `/jobs?jobTypes=${c.jobType}`,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryCounts, codesLoaded]);

  const hasSlides = topBanners.length > 0;
  const showSlideControls = topBanners.length >= 2;
  const currentSlide = hasSlides ? topBanners[Math.min(slideIndex, topBanners.length - 1)] : null;

  function goSlide(delta: number) {
    if (topBanners.length < 2) return;
    setSlideIndex((i) => (i + delta + topBanners.length) % topBanners.length);
  }
  const activeJobType = JOB_TABS[activeTab]?.jobType ?? null;
  const filteredJobs = useMemo(() => {
    if (!activeJobType || jobs.length === 0) return jobs;
    return jobs.filter((j) => (j.jobTypes ?? []).includes(activeJobType));
  }, [jobs, activeJobType]);

  // 더미 FALLBACK 제거: 0건이면 빈 배열 → 아래 섹션이 jobs-empty 빈 상태 렌더.
  const jobItems = filteredJobs.slice(0, 15).map((j, i): { title: string; clinic: string; tags: Array<{ kind: string; label: string }>; loc: string; photo: number; href: string; img: string | null } => ({
    title: j.title,
    clinic: j.hospitalName,
    tags: (j.jobTypes ?? []).slice(0, 1).map((jt) => ({ kind: "", label: HOME_CATEGORY_LABELS[jt] || jt })),
    loc: j.region || "전국",
    photo: (i % 6) + 1,
    href: `/jobs/${j.id}`,
    // 카드 썸네일 = 병원소개사진 첫 장(/jobs 카드와 동일 규칙). 없으면 null → 회색 placeholder.
    img: j.hospitalImages?.[0] ?? null,
  }));

  function handleTabClick(i: number) {
    setActiveTab(i);
    const jt = JOB_TABS[i].jobType;
    const url = jt ? `/?jobType=${encodeURIComponent(jt)}` : "/";
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="home-page">
      <SiteHeader />

      <main className="wrap">
        {/* HERO */}
        <section className="hero">
          <div
            className={`hero-grid${hasSlides ? " has-banner" : ""}`}
            onMouseEnter={() => { slidePausedRef.current = true; }}
            onMouseLeave={() => { slidePausedRef.current = false; }}
          >

            {hasSlides && (
              <>
                {topBanners.map((b, i) => {
                  const href = safeBannerHref(b.linkUrl);
                  const isExternal = !!href && /^https?:\/\//i.test(href);
                  const isOn = i === Math.min(slideIndex, topBanners.length - 1);
                  const img = <img src={b.imageUrl} alt={b.title} />;
                  return (
                    <div key={b.id} className={`hero-banner-full${isOn ? " on" : ""}`}>
                      {href ? (
                        <a
                          href={href}
                          target={isExternal ? "_blank" : "_self"}
                          rel={isExternal ? "noreferrer" : undefined}
                          aria-label={b.title}
                        >
                          {img}
                        </a>
                      ) : (
                        img
                      )}
                    </div>
                  );
                })}
                {showSlideControls && (
                  <>
                    <button className="hero-arrow l" aria-label="이전" type="button" onClick={() => goSlide(-1)}>
                      <ChevronLeft />
                    </button>
                    <button className="hero-arrow r" aria-label="다음" type="button" onClick={() => goSlide(1)}>
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {showSlideControls && (
            <div className="hero-dots">
              {topBanners.map((b, i) => (
                <span
                  key={b.id}
                  className={i === slideIndex ? "on" : ""}
                  role="button"
                  aria-label={`슬라이드 ${i + 1}`}
                  onClick={() => setSlideIndex(i)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
          )}

          {/* 공지 바 — /api/support/notices 최신 1건 실연동(없으면 안내 placeholder). */}
          <div className="notice">
            <span className="tag-notice">공지</span>
            <Link href={noticeTop ? `/support/notice/${noticeTop.id}` : "/support/notice"} className="title">
              {noticeTop ? noticeTop.title : "등록된 공지사항이 없습니다."}
            </Link>
            <span className="date">{noticeTop ? fmtKoDate(noticeTop.createdAt) : ""}</span>
            <Link href="/support/notice" className="more">
              전체보기
              <ChevronRight />
            </Link>
          </div>
        </section>


         {/* CATEGORIES */}
         <section className="section">
          <div className="section-head">
            <div>
              <h2>어떤 일을 찾으세요?</h2>
              <div className="sub">치과 직무별 채용공고와 커뮤니티를 한 번에 모아봤어요</div>
            </div>
          </div>

          <div className="cats">
            {catItems.map((c) => (
              <Link key={c.cat} href={c.href} className="cat">
                {c.ribbon && <div className="ribbon">{c.ribbon}</div>}
                <div className="ico">{CategoryIcons[c.key]}</div>
                <div className="lbl">{c.lbl}</div>
                <div className="count">{c.count}</div>
              </Link>
            ))}
          </div>
        </section>
       

        {/* REVIEWS */}
        <section className="section">
          <div className="section-head">
            <div>
              <h2>익명 병원 후기</h2>
              <div className="sub">실제 근무한 동료들이 남긴 솔직한 평가</div>
            </div>
            <Link href="/reviews" className="all">
              전체보기 <ChevronRight />
            </Link>
          </div>

          {reviewItems.length === 0 ? (
            <div className="home-empty">아직 등록된 후기가 없습니다.</div>
          ) : (
          <div className="cards-5">
            {reviewItems.map((r) => {
              const isHot = r.id === hotReviewId;
              return (
                <Link key={r.id} href={r.id > 0 ? `/reviews/${r.id}` : "/reviews"} target="_blank" rel="noopener noreferrer" className="review-card">
                  {isHot && <div className="hot">🔥 HOT</div>}
                  <div className="quote">
                    <QuoteIcon />
                  </div>
                  <p className="body">{r.content || r.title}</p>
                  <div className="meta">
                    <b>{r.authorAlias || "닉네임"}</b> · {fmtKoDate(r.createdAt)}
                  </div>
                  <div className="loc">
                    <LocIcon />
                    {r.region}
                  </div>
                  <div className="hosp">{r.hospitalName}</div>
                  {/* 후기 지표: 별점(ratingAvg) · 좋아요 · 댓글 (👎/viewCount 오해소지 제거 — Q6 결정) */}
                  <div className="react">
                    <span aria-label="별점">
                      <StarIcon />
                      {(r.ratingAvg ?? r.rating ?? 0).toFixed(1)}
                    </span>
                    <span>
                      <ThumbUpIcon />
                      {r.likeCount}
                    </span>
                    <span>
                      <CommentIcon />
                      {r.commentCount ?? 0}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          )}
        </section>

        {/* TALKS */}
        <section className="section">
          <div className="section-head">
            <div>
              <h2>익명 수다방</h2>
              <div className="sub">치과 종사자만 아는 그 이야기, 편하게 나눠요</div>
            </div>
            <Link href="/talks" className="all">
              전체보기 <ChevronRight />
            </Link>
          </div>

          {talkItems.length === 0 ? (
            <div className="home-empty">아직 등록된 글이 없습니다.</div>
          ) : (
          <div className="cards-5">
            {talkItems.map((t) => (
              <Link key={t.id} href={t.id > 0 ? `/talks/${t.id}` : "/talks"} target="_blank" rel="noopener noreferrer" className="talk-card">
                {t.id === hotTalkId && <div className="hot">🔥 HOT</div>}
                <div className="talk-head">
                  <div className="ava">{(t.authorAlias || "?").slice(0, 1)}</div>
                  <div className="nick">{t.authorAlias}</div>
                  <div className="time">{fmtRelative(t.createdAt)}</div>
                </div>
                <h4>{t.title}</h4>
                <p>{t.content}</p>
                {/* 시안 수다방 홈 카드 = 좋아요 + 댓글 2지표(viewCount/👎 제거 — Q3 결정) */}
                <div className="react">
                  <span>
                    <ThumbUpIcon />
                    {t.likeCount}
                  </span>
                  <span>
                    <CommentIcon />
                    {t.commentCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          )}
        </section>

        {/* URGENTS */}
        <section className="section">
          <div className="section-head">
            <div>
              <h2>급구 게시판</h2>
              <div className="sub">지금 당장 사람이 필요한 병원의 급한 공고예요</div>
            </div>
            <Link href="/urgents" className="all">
              전체보기 <ChevronRight />
            </Link>
          </div>

          {urgentItems.length === 0 ? (
            <div className="home-empty">아직 등록된 급구 공고가 없습니다.</div>
          ) : (
          <div className="urgent-grid">
            {urgentItems.map((u) => {
              const jobTypeText = u.jobTypes && u.jobTypes.length > 0 ? (URGENT_JOB_TYPE_LABELS[u.jobTypes[0]] ?? u.jobTypes[0]) : "";
              const workTypeText = u.workTypes && u.workTypes.length > 0 ? (URGENT_WORK_TYPE_LABELS[u.workTypes[0]] ?? u.workTypes[0]) : "";
              const metaText = [jobTypeText, workTypeText].filter(Boolean).join(" · ");
              return (
                <Link key={u.id} href={u.id > 0 ? `/urgents/${u.id}` : "/urgents"} target="_blank" rel="noopener noreferrer" className="urgent">
                  <button
                    type="button"
                    className="bookmark"
                    aria-label="저장"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/urgents");
                    }}
                  >
                    <BookmarkIcon />
                  </button>
                  <div className="clinic">{u.hospitalName}</div>
                  <h5>{u.title}</h5>
                  {metaText && <div className="meta">{metaText}</div>}
                  <div className="loc">
                    <LocIcon />
                    {u.region}
                  </div>
                </Link>
              );
            })}
          </div>
          )}
        </section>


        {/* JOBS */}
        <section className="section">
          <div className="section-head">
            <div>
              <h2>채용 정보</h2>
              <div className="sub">지금 가장 핫한 치과 채용 공고를 모아봤어요</div>
            </div>
            <Link href="/jobs" className="all">
              전체보기 <ChevronRight />
            </Link>
          </div>

          <div className="jobs-head">
            <div className="jobs-tabs">
              {JOB_TABS.map((tab, i) => (
                <button key={tab.cat ?? "all"} type="button" className={i === activeTab ? "on" : ""} onClick={() => handleTabClick(i)}>
                  {tab.cat === null ? "전체" : homeLabel(tab.cat)}
                </button>
              ))}
            </div>
            <div className="jobs-filter" />
          </div>

          {jobItems.length === 0 ? (
            <div className="jobs-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="jobs-empty">{activeTab === 0 ? "아직 등록된 채용 공고가 없습니다." : "선택한 직종의 채용 공고가 아직 없어요."}</div>
            </div>
          ) : (
          <div className="jobs-grid">
            {jobItems.map((j, idx) => (
              <Link key={idx} href={(j as { href?: string }).href || "/jobs"} className="job">
                {/* 썸네일 = 병원소개사진 첫 장(/jobs 카드와 동일). 없으면 .photo 기본 회색 placeholder(더미 photo-N 클래스 미사용). */}
                <div className="photo" style={j.img ? { backgroundImage: `url(${j.img})` } : undefined}>
                  <button
                    type="button"
                    className="bookmark"
                    aria-label="저장"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/jobs");
                    }}
                  >
                    <BookmarkIcon />
                  </button>
                </div>
                <div className="clinic">{j.clinic}</div>
                <h5>{j.title}</h5>
                {j.tags.length > 0 && (
                  <div className="tags">
                    {j.tags.map((t, ti) => (
                      <span key={ti} className={`t ${t.kind}`.trim()}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}
                <div className="loc">
                  <LocIcon />
                  {j.loc}
                </div>
              </Link>
            ))}
          </div>
          )}

          <div className="jobs-more">
            <button type="button" onClick={() => router.push("/jobs")}>
              채용 공고 더보기{jobsTotal != null ? ` (${jobsTotal.toLocaleString()}건)` : ""}
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />


      {/* FAB: scroll-to-top for corp + every state */}
      {showFab && (
        <button type="button" className="fab-top" aria-label="맨 위로" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
      )}

      {/* D1-③(2026-06-11): 홈 우측하단 "채용 공고 등록" +FAB 제거(홈에는 작성 FAB 불필요. 게시판 리스트 MobileFab은 유지).
          맨 위로(scroll-to-top) FAB는 유지. 구 corp 간단등록 모달(showCorpModal)은 이 버튼이 유일 트리거였어 미도달 상태가 됨. */}
    </div>
  );
}
