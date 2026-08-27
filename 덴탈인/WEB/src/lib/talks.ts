// 익명 수다방 공통 타입 + 라벨/유틸 (Sprint 3-B)

export type TalkCategory =
  | "daily"
  | "counsel"
  | "hospitalLife"
  | "jobs"
  | "practice"
  | "license"
  | "etc";

// p2-6: 값은 서버 /api/codes(talkCategory / talkSort)에서 codesHydrate가 채움.
export const TALK_CATEGORIES: TalkCategory[] = [];
export const TALK_CATEGORY_LABELS: Record<string, string> = {};

export type TalkSort = "latest" | "likes" | "comments";

export const TALK_SORT_OPTIONS: { value: TalkSort; label: string }[] = [];

export type TalkPost = {
  id: number;
  category: TalkCategory;
  title: string;
  content: string;
  images: string[];
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  authorAlias: string;
  authorLicenseVerified?: boolean; // G5 N3: 작성자 면허/사업자 인증완료(active+verified)
  isMine: boolean;
  likedByMe: boolean;
  dislikedByMe: boolean;
  bookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TalkListResponse = {
  items: TalkPost[];
  total: number;
  page: number;
  pageSize: number;
};

export type TalkFilter = {
  category: string;
  keyword: string;
  sort: TalkSort;
  page: number;
};

export type TalkFormInput = {
  category: TalkCategory;
  title: string;
  content: string;
  images: string[];
};

export const TALK_IMAGE_MAX = 5;

// p2-talks-republish-b2: 아바타 4색(시안 a/b/c/d) 결정적 매핑. 같은 작성자(authorAlias)=같은 색.
// globals.css `.ava.av-a~av-d`(노랑/초록/파랑/핑크)와 매칭.
export function avatarColorClass(seed: string | null | undefined): "av-a" | "av-b" | "av-c" | "av-d" {
  const s = seed || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (["av-a", "av-b", "av-c", "av-d"] as const)[h % 4];
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
