// Sprint 3-D-2: 1:1 문의 클라이언트 helper
import { api } from "./api";

// p2-6: 슬러그+라벨은 서버 /api/codes(qnaStatus)에서 codesHydrate가 채움.
export type QnaStatus = "open" | "answered" | "closed";
export const QNA_STATUSES: QnaStatus[] = [];
export const QNA_STATUS_LABELS: Record<string, string> = {};

export type SupportQnaItem = {
  id: number;
  title: string;
  content: string;
  status: QnaStatus;
  answer: string | null;
  answeredAt: string | null;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QnaListResponse = {
  items: SupportQnaItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listMyQnas(status: QnaStatus | "all" = "all", page = 1, pageSize = 20) {
  const qs = new URLSearchParams();
  if (status !== "all") qs.set("status", status);
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  return api.get<QnaListResponse>(`/api/support/qnas?${qs.toString()}`, true);
}

export async function getQna(id: number) {
  return api.get<SupportQnaItem>(`/api/support/qnas/${id}`, true);
}

// 회원/비회원 공용. 회원은 토큰(api auth=true가 있으면 Bearer 자동 첨부)으로 식별,
// 비회원은 guestName/guestEmail/guestPhone 필수. 토큰이 없으면 서버가 비회원 분기.
export async function createQna(input: {
  title: string;
  content: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}) {
  return api.post<SupportQnaItem>("/api/support/qnas", input, true);
}

export async function updateQna(id: number, input: { title?: string; content?: string }) {
  return api.patch<SupportQnaItem>(`/api/support/qnas/${id}`, input, true);
}

export async function deleteQna(id: number) {
  return api.del<{ deleted: number }>(`/api/support/qnas/${id}`, true);
}
