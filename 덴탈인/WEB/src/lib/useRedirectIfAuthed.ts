"use client";

// msg-g3-signup-low-fix LOW-2: 로그인 상태에서 가입 화면 진입 시 리다이렉트.
// ⚠️ 가입 흐름(방법B)은 회원정보 완료 시 로그인 상태가 되므로(가입 도중), isLoggedIn을 deps로 두면
// ④선택정보/⑤면허 스텝에서 가드가 발동해 페이지를 튕겨낸다. → hydrated 완료 시점(=mount)에 1회만 체크.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export function useRedirectIfAuthed(to = "/") {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  useEffect(() => {
    // 진입 시점에 이미 로그인 상태면 리다이렉트. isLoggedIn은 deps에서 제외(가입 중 전환 무시).
    if (hydrated && useAuthStore.getState().isLoggedIn) router.replace(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
}
