"use client";

// Sprint p2-2 — 전역 store 부트스트랩. layout에 1회 마운트(렌더 없음).
// - regionStore.init(): 사이트 최초 로드 시 /api/regions/sidos 1회 fetch(시군구는 lazy).
// - authStore.syncFromServer(): persist로 즉시 복원된 헤더 상태를 백그라운드에서 silent 검증/보정.
//   (헤더는 이미 persist 값으로 그려져 있으므로 이 fetch는 UI 깜빡임을 만들지 않음)
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRegionStore } from "@/stores/regionStore";
import { useCodeStore } from "@/stores/codeStore";

export default function AppInit() {
  useEffect(() => {
    void useRegionStore.getState().init();
    void useAuthStore.getState().syncFromServer();
    // p2-6-fix1: 코드는 SSR(CodesProvider)에서 이미 주입됨. SSR fetch 실패 시에만 클라 재시도(멱등).
    void useCodeStore.getState().init();

    // 멀티탭 로그인 동기화: storage 이벤트는 "다른 탭"의 localStorage 변경 시에만 발생.
    // 다른 탭 로그아웃(accessToken 제거)/로그인(accessToken 생성) 시 이 탭 store도 즉시 반영(헤더 갱신).
    // (zustand persist는 기본 cross-tab 동기화 안 함 → 수동.) 상태 가드로 핑퐁/불필요 리렌더 방지.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "accessToken") return;
      const st = useAuthStore.getState();
      if (!e.newValue) {
        // 다른 탭 로그아웃 → 이 탭도 비로그인 전환(이미 로그아웃이면 skip).
        if (st.isLoggedIn || st.user) st.clearAuth();
      } else {
        // 다른 탭 로그인 → 토큰 기준 서버 프로필 동기화(헤더 즉시 로그인 반영).
        void st.syncFromServer();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
