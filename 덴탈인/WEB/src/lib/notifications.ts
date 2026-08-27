// p2-notifications: 인앱 알림 클라이언트 helper.
import { api } from "./api";

export type NotificationType =
  | "comment_on_post"
  | "reply_on_comment"
  | "welcome"
  | "like_on_post"
  | "report_result"
  | "post_moderated";

export type NotificationPayload = {
  boardType?: "review" | "talk" | "urgent";
  boardId?: number;
  postTitle?: string;
  excerpt?: string;
  action?: string;
  [k: string]: unknown;
};

export type NotificationItem = {
  id: number;
  type: NotificationType;
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
};

const BOARD_PATH: Record<string, string> = {
  review: "/reviews",
  talk: "/talks",
  urgent: "/urgents",
};

// 알림 클릭 시 이동 경로. 익명 보드라도 boardId만으로 상세 이동(작성자 노출 무관).
export function notificationHref(n: NotificationItem): string | null {
  const p = n.payload || {};
  if (p.boardType && p.boardId && BOARD_PATH[p.boardType]) {
    return `${BOARD_PATH[p.boardType]}/${p.boardId}`;
  }
  return null;
}

// 표시 문구 — actor는 노출하지 않음(익명/PII). 제목/요약만.
export function notificationText(n: NotificationItem): string {
  const t = n.payload?.postTitle ? `「${n.payload.postTitle}」` : "내 글";
  switch (n.type) {
    case "comment_on_post":
      return `${t}에 새 댓글이 달렸어요.`;
    case "reply_on_comment":
      return `내 댓글에 답글이 달렸어요.`;
    case "like_on_post":
      return `${t}에 좋아요가 달렸어요.`;
    case "report_result":
      return `신고하신 게시물이 운영자에 의해 처리되었어요.`;
    case "post_moderated":
      return n.payload?.action === "delete"
        ? `회원님의 게시글이 운영정책에 따라 삭제 처리되었습니다.`
        : `회원님의 게시글이 운영정책에 따라 비공개 처리되었습니다.`;
    case "welcome":
      return `덴탈인 가입을 환영합니다!`;
    default:
      return "새 알림이 있어요.";
  }
}

// type → 아이콘 분류(시안 noti-item .ico heart/cmt/job/check). CSS 클래스로 매핑.
export function notificationIcon(type: NotificationType): "heart" | "cmt" | "job" | "check" {
  switch (type) {
    case "like_on_post":
      return "heart";
    case "comment_on_post":
    case "reply_on_comment":
      return "cmt";
    case "report_result":
    case "post_moderated":
      return "job";
    case "welcome":
    default:
      return "check";
  }
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ unread: number }>("/api/notifications/unread-count", true);
  return res.success && res.data ? res.data.unread : 0;
}

export async function listNotifications(page = 1, pageSize = 20) {
  return api.get<NotificationListResponse>(`/api/notifications?page=${page}&pageSize=${pageSize}`, true);
}

export async function markNotificationRead(id: number) {
  return api.patch<{ id: number; isRead: boolean; unread: number }>(`/api/notifications/${id}/read`, undefined, true);
}

export async function markAllNotificationsRead() {
  return api.patch<{ updated: number; unread: number }>(`/api/notifications/read-all`, undefined, true);
}

export function formatRelative(s?: string): string {
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
  const dt = new Date(s);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
