"use client";

// Sprint p2-2 작업 3 — 로그인 상태 전역 store (zustand + persist).
// 목적: 새로고침마다 /api/users/me를 기다리며 헤더 버튼이 [로그인]↔[로그아웃] 깜빡이던 현상 제거.
// - persist(localStorage)로 user/isLoggedIn을 즉시 복원 → 첫 페인트부터 올바른 버튼.
// - accessToken은 보안상 store에 persist하지 않음. 기존 localStorage("accessToken")(lib/api) +
//   refresh httpOnly 쿠키 체계를 그대로 사용. store는 프로필 + 로그인 여부만 보관.
// - 토큰 만료/실패 시에만 백그라운드 syncFromServer가 clearAuth (UI 깜빡임 없이 silent).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, setAccessToken } from "@/lib/api";

export type AuthUser = {
  id: number;
  name: string;
  userType: "personal" | "corp";
  profileImageUrl?: string | null; // F10: 헤더 아바타용
};

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** persist 복원이 끝났는지(클라 mount 후 true). SSR/CSR hydration mismatch 방지용 게이트. */
  hydrated: boolean;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
  setHydrated: () => void;
  /** 토큰 기준으로 서버 프로필을 silent 동기화. 토큰 없거나 실패 시 clearAuth. */
  syncFromServer: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      hydrated: false,
      setAuth: (user) => set({ user, isLoggedIn: true }),
      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, isLoggedIn: false });
      },
      setHydrated: () => set({ hydrated: true }),
      syncFromServer: async () => {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
        if (!token) {
          // 이미 로그아웃 상태면 불필요한 set 생략(리렌더 최소화).
          if (get().isLoggedIn || get().user) set({ user: null, isLoggedIn: false });
          return;
        }
        const res = await api.get<{ id: number; name: string; userType: "personal" | "corp"; profileImageUrl?: string | null }>(
          "/api/users/me",
          true
        );
        if (res.success && res.data) {
          set({
            user: { id: res.data.id, name: res.data.name, userType: res.data.userType, profileImageUrl: res.data.profileImageUrl ?? null },
            isLoggedIn: true,
          });
        } else if (res.status === 401 || res.status === 403) {
          // p2-cleanup 정리2: 명확한 인증 실패(401 만료/refresh실패, 403 정지)일 때만 로그아웃.
          setAccessToken(null);
          set({ user: null, isLoggedIn: false });
        }
        // 네트워크 오류(status 0)·5xx·일시 오류는 로그아웃하지 않고 기존 상태 유지(다음 호출 재시도).
        // → 순간 네트워크 단절로 헤더가 [로그아웃]으로 깜빡이거나 원치 않게 로그아웃되는 현상 방지.
      },
    }),
    {
      name: "dentalin-auth",
      storage: createJSONStorage(() => localStorage),
      // accessToken은 절대 persist하지 않음 — user/isLoggedIn만.
      partialize: (s) => ({ user: s.user, isLoggedIn: s.isLoggedIn }),
      onRehydrateStorage: () => (state) => {
        // 복원 완료 직후 hydrated 플래그 on (클라에서만 호출됨).
        state?.setHydrated();
      },
    }
  )
);
