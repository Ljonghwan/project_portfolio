// Sprint 3-D-1: 통합 게시판 즐겨찾기 클라이언트 helper
import { api } from "./api";

// board 슬러그는 구조 계약(union 고정). 라벨은 서버 /api/codes(postBoard)에서 채움. PATHS는 front 라우팅.
export type PostBoardType = "review" | "talk" | "urgent";
export const POST_BOARD_TYPES: PostBoardType[] = ["review", "talk", "urgent"];

export const POST_BOARD_LABELS: Record<string, string> = {};

export const POST_BOARD_PATHS: Record<PostBoardType, string> = {
  review: "/reviews",
  talk: "/talks",
  urgent: "/urgents",
};

export type BookmarkedPostItem = {
  boardType: PostBoardType;
  boardId: number;
  bookmarkedAt: string;
  available: boolean;
  post: {
    id: number;
    title: string;
    content?: string;
    hospitalName?: string;
    region?: string;
    jobType?: string;
    rating?: number;
    category?: string;
    viewCount?: number;
    likeCount?: number;
    bookmarkCount?: number;
    commentCount?: number;
    authorAlias?: string;
    expiredAt?: string;
    images?: string[];
    jobTypes?: string[];
    workTypes?: string[];
    headcount?: number;
    salaryType?: string;
    salaryText?: string | null;
    createdAt?: string;
  } | null;
};

export type MyPostItem = {
  boardType: PostBoardType;
  id: number;
  title: string;
  content: string;
  region: string | null;
  hospitalName: string | null;
  category: string | null;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  authorAlias: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BoardCounts = { all: number; review: number; talk: number; urgent: number };
export type ListResponse<T> = { items: T[]; total: number; page: number; pageSize: number; counts?: BoardCounts };

export async function bookmarkPost(
  boardType: PostBoardType,
  id: number
): Promise<{ ok: boolean; message?: string }> {
  const res = await api.post<{ bookmarked: boolean; created: boolean }>(
    `/api/posts/${boardType}/${id}/bookmark`,
    undefined,
    true
  );
  return { ok: !!res.success, message: res.message };
}

export async function unbookmarkPost(
  boardType: PostBoardType,
  id: number
): Promise<{ ok: boolean; message?: string }> {
  const res = await api.del<{ bookmarked: boolean; deleted: number }>(
    `/api/posts/${boardType}/${id}/bookmark`,
    true
  );
  return { ok: !!res.success, message: res.message };
}

export async function getMyPosts(
  boardType: PostBoardType | "all" = "all",
  page = 1,
  size = 20
) {
  return api.get<ListResponse<MyPostItem>>(
    `/api/me/posts?boardType=${boardType}&page=${page}&size=${size}`,
    true
  );
}

export async function getMyBookmarkedPosts(
  boardType: PostBoardType,
  page = 1,
  size = 20,
  sort: "recent" | "oldest" = "recent"
) {
  return api.get<ListResponse<BookmarkedPostItem>>(
    `/api/me/bookmarks/posts?boardType=${boardType}&page=${page}&size=${size}&sort=${sort}`,
    true
  );
}
