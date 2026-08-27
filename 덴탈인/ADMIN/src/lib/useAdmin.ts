"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAdminToken } from "./api";

// msg-g4 D6: 메뉴별 권한 키 (서버 ADMIN_MENU_KEYS와 동일).
export const ADMIN_MENU_KEYS = ["members", "contents", "reports", "support", "ops", "settings"] as const;
export type AdminMenuKey = (typeof ADMIN_MENU_KEYS)[number];
export type AdminPermissions = Record<AdminMenuKey, boolean>;

export const ADMIN_MENU_LABELS: Record<AdminMenuKey, string> = {
  members: "회원관리",
  contents: "콘텐츠관리",
  reports: "신고관리",
  support: "고객지원(1:1문의)",
  ops: "운영관리(배너/공지/FAQ)",
  settings: "설정(약관/감사로그)",
};

export type Admin = {
  id: number;
  email: string;
  name: string;
  role: "super" | "staff";
  permissions?: Partial<AdminPermissions>;
  lastLoginAt?: string | null;
};

// super는 전체 접근. staff는 permissions[key]===true.
export function hasMenuPermission(admin: Admin | null, key: AdminMenuKey): boolean {
  if (!admin) return false;
  if (admin.role === "super") return true;
  return admin.permissions?.[key] === true;
}

export function useAdmin(redirect: boolean = true) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = typeof window !== "undefined" ? window.localStorage.getItem("adminAccessToken") : null;
      if (!t) {
        if (alive) {
          setLoading(false);
          if (redirect) router.replace("/login");
        }
        return;
      }
      const res = await api.get<Admin>("/api/admin/auth/me");
      if (!alive) return;
      if (res.success && res.data) {
        setAdmin(res.data);
        setLoading(false);
      } else {
        setAdminToken(null);
        setLoading(false);
        if (redirect) router.replace("/login");
      }
    })();
    return () => { alive = false; };
  }, [redirect, router]);

  async function logout() {
    try {
      await api.post("/api/admin/auth/logout");
    } catch { /* no-op */ }
    setAdminToken(null);
    router.replace("/login");
  }

  return { admin, loading, logout };
}
