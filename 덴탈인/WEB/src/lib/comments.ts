// Sprint 3-D-2 + P1-reviews FIX: 3보드 통합 댓글 클라이언트 helper
// P1-reviews FIX: 댓글에 like/dislike 추가 (review .rv-react-bar 동일 UX 댓글에도 적용).
import { api } from "./api";

// board 슬러그는 구조 계약(라벨 없음). union 고정 + 구조 배열 유지.
export type CommentBoardType = "review" | "talk" | "urgent";
export const COMMENT_BOARD_TYPES: CommentBoardType[] = ["review", "talk", "urgent"];

export type CommentItem = {
  id: number;
  boardType: CommentBoardType;
  boardId: number;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  authorAlias: string;
  authorVerified?: boolean; // G1 F3: 작성자 면허/사업자 인증뱃지
  isMine: boolean;
  // P1-reviews FIX: react 카운트/내 상태.
  likeCount: number;
  dislikeCount: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommentNode = CommentItem & { replies: CommentItem[] };

export type CommentListResponse = {
  items: CommentNode[];
  total: number;
  page: number;
  pageSize: number;
};

export type MyCommentItem = {
  id: number;
  boardType: CommentBoardType;
  boardId: number;
  parentId: number | null;
  content: string;
  likeCount: number;
  replyCount: number;
  boardTitle: string | null;
  boardAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MyCommentListResponse = {
  items: MyCommentItem[];
  total: number;
  page: number;
  counts?: { all: number; review: number; talk: number; urgent: number };
  pageSize: number;
};

export async function listComments(
  boardType: CommentBoardType,
  boardId: number,
  page = 1,
  pageSize = 20
) {
  return api.get<CommentListResponse>(
    `/api/comments?boardType=${boardType}&boardId=${boardId}&page=${page}&pageSize=${pageSize}`,
    true
  );
}

export async function createComment(input: {
  boardType: CommentBoardType;
  boardId: number;
  parentId?: number | null;
  content: string;
}) {
  return api.post<CommentItem>("/api/comments", input, true);
}

export async function updateComment(id: number, content: string) {
  return api.patch<CommentItem>(`/api/comments/${id}`, { content }, true);
}

export async function deleteComment(id: number) {
  return api.del<{ deleted: number }>(`/api/comments/${id}`, true);
}

export async function getMyComments(
  boardType: CommentBoardType | "all" = "all",
  page = 1,
  pageSize = 20
) {
  return api.get<MyCommentListResponse>(
    `/api/me/comments?boardType=${boardType}&page=${page}&pageSize=${pageSize}`,
    true
  );
}

// P1-reviews FIX: 댓글 like/dislike helpers (personal 전용. 비로그인/corp는 호출 측에서 차단).
export async function likeComment(id: number): Promise<void> {
  await api.post(`/api/comments/${id}/like`, undefined, true);
}

export async function unlikeComment(id: number): Promise<void> {
  await api.del(`/api/comments/${id}/like`, true);
}

export async function dislikeComment(id: number): Promise<void> {
  await api.post(`/api/comments/${id}/dislike`, undefined, true);
}

export async function undislikeComment(id: number): Promise<void> {
  await api.del(`/api/comments/${id}/dislike`, true);
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
