"use client";

// msg-g2 항목7: 마이페이지 사이드바 카운트(.num 배지) 전역 store.
// MyPageShell이 1회 fetch만 하던 구조라 같은 페이지 내 공고 삭제/마감/공개·즐겨찾기 해제 후 갱신이 안 됐음.
// 액션 핸들러에서 useCountsStore.getState().refresh()를 호출하면 사이드바가 즉시 동기화된다.
import { create } from "zustand";
import { api } from "@/lib/api";

export type MyCounts = {
  jobsActive: number;
  jobsClosed: number;
  jobsDraft: number;
  favorites: number;
  posts: number;
  comments: number;
  inquiries?: number;
};

type CountsState = {
  counts: MyCounts | null;
  refresh: () => Promise<void>;
};

export const useCountsStore = create<CountsState>((set) => ({
  counts: null,
  refresh: async () => {
    const res = await api.get<MyCounts>("/api/me/counts", true);
    if (res.success && res.data) set({ counts: res.data });
  },
}));
