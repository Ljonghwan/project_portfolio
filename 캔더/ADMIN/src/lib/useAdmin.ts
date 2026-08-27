"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

export type Admin = {
  id: string;
  username: string;
  name: string;
  role: string;
  lastLoginAt?: string | null;
};

// 관리자 세션 확인 — 쿠키 기반이라 클라이언트가 토큰을 들고 있지 않고, /auth/me 로 확인한다.
// 실패(401)면 로그인 페이지로.
export function useAdmin(redirect = true) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get<{ admin: Admin }>("/api/admin/auth/me");
        if (!alive) return;
        setAdmin(r.admin);
      } catch {
        if (!alive) return;
        if (redirect) router.replace("/login");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [redirect, router]);

  async function logout() {
    try {
      await api.post("/api/admin/auth/logout");
    } catch {
      /* 무시 — 쿠키는 서버가 지운다 */
    }
    router.replace("/login");
  }

  return { admin, loading, logout };
}
