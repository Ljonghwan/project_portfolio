"use client";

// Sprint p2-6 — 코드(enum/슬러그+라벨) 전역 store. 단일 출처 = 서버 /api/codes(정적 마스터, no-store).
// 앱 진입 시 1회 fetch → 모든 코드 도메인 저장 + lib의 가변 라벨맵/옵션/키배열을 채운다(hydrateCodes).
// 이로써 front의 하드코딩 enum/라벨이 제거되고, 서버 codes.ts 수정 → 새로고침 즉시 반영(캐시 없음).
import { create } from "zustand";
import { api } from "@/lib/api";
import { hydrateCodes } from "@/lib/codesHydrate";

export type Code = { key: string; label: string };
export type CodesBundle = Record<string, Code[]>;

type CodeState = {
  codes: CodesBundle;
  loaded: boolean;
  loading: boolean;
  init: () => Promise<void>;
};

export const useCodeStore = create<CodeState>((set, get) => ({
  codes: {},
  loaded: false,
  loading: false,
  init: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const res = await api.get<CodesBundle>("/api/codes");
    if (res.success && res.data && typeof res.data === "object") {
      hydrateCodes(res.data); // lib 가변 객체 채우기
      set({ codes: res.data, loaded: true, loading: false });
    } else {
      set({ loading: false });
    }
  },
}));

// 도메인 옵션/라벨 직접 접근용 hook (신규 코드에서 사용 권장).
export function useCodeOptions(domain: string): Code[] {
  return useCodeStore((s) => s.codes[domain] ?? []);
}
export function useCodesLoaded(): boolean {
  return useCodeStore((s) => s.loaded);
}
