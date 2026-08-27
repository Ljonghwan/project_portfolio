// Sprint 3-D-2: FAQ / 공지 클라이언트 helper
// msg-g4 D4: FAQ 분류는 동적(FaqCategory) — 고정 enum 제거, /api/support/faq-categories 소비.
import { api } from "./api";

export type FaqCategoryItem = {
  id: number;
  name: string;
  order: number;
};

export type SupportFaqItem = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  question: string;
  answer: string;
  order: number;
};

export type SupportNoticeItem = {
  id: number;
  title: string;
  excerpt: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NoticeNav = { id: number; title: string } | null;

export type SupportNoticeDetail = {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  prev?: NoticeNav; // F3: 이전글(더 과거)
  next?: NoticeNav; // F3: 다음글(더 최신)
};

export async function listFaqCategories() {
  return api.get<{ items: FaqCategoryItem[]; total: number }>(`/api/support/faq-categories`);
}

export async function listFaqs(categoryId?: number) {
  const qs = categoryId ? `?categoryId=${categoryId}` : "";
  return api.get<{ items: SupportFaqItem[]; total: number }>(`/api/support/faqs${qs}`);
}

export async function listNotices(page = 1, pageSize = 20) {
  return api.get<{ items: SupportNoticeItem[]; total: number; page: number; pageSize: number }>(
    `/api/support/notices?page=${page}&pageSize=${pageSize}`
  );
}

export async function getNotice(id: number) {
  return api.get<SupportNoticeDetail>(`/api/support/notices/${id}`);
}
