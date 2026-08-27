"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "./api";

export type Me = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  profileImageUrl?: string | null; // F10: 프로필 사진
  userType: "personal" | "corp";
  snsProvider: string | null;
  createdAt: string;
  marketingAgree: boolean;
  personalProfile: {
    jobType: string;
    gender: string | null;
    age: number | null; // deprecated(msg-g2 항목8)
    birthYear: number | null; // 출생연도(msg-g2 항목8) — 표시는 현재나이 계산
    sido: string | null;
    sigungu: string | null;
    careerYears: number;
    careerMonths: number;
    desiredAreas: { sido: string; sigungu: string }[] | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryNegotiable: boolean;
    licenseName: string | null;
    licenseNo: string | null;
    licenseImageUrl: string | null;
    licenseImageViewUrl?: string | null; // 본인 미리보기용 서명 토큰 URL(private PII)
  } | null;
  corpProfile: {
    hospitalName: string;
    hospitalAddress: string | null;
    hospitalDetailAddress: string | null;
    hospitalZipcode: string | null;
    businessNo: string;
    businessLicenseImageUrl: string | null;
    businessLicenseImageViewUrl?: string | null; // 본인 미리보기용 서명 토큰 URL(private PII)
    businessType: string | null;
  } | null;
  licenseStatus?: "none" | "pending" | "verified" | "rejected";
  licenseReason?: string | null;
  licenseReviewedAt?: string | null;
};

export function useMe(redirectIfNone: boolean = true) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let alive = true;
    // p2-mypage-g2-verify BUG-2: 초기 로드만 loading 토글, reload(reloadFlag>0)는 silent.
    // → 저장 후 reload 시 페이지가 LoadingIndicator로 언마운트되지 않아 성공 토스트가 유지됨.
    const isInitial = reloadFlag === 0;
    (async () => {
      if (isInitial) setLoading(true);
      const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      if (!token) {
        if (!alive) return;
        if (redirectIfNone) {
          router.replace("/login");
        } else {
          setMe(null);
        }
        if (isInitial) setLoading(false);
        return;
      }
      const res = await api.get<Me>("/api/users/me", true);
      if (!alive) return;
      if (res.success && res.data) {
        setMe(res.data);
      } else if (redirectIfNone) {
        setAccessToken(null);
        router.replace("/login");
      } else {
        setMe(null);
      }
      if (isInitial) setLoading(false);
    })();
    return () => { alive = false; };
  }, [reloadFlag, redirectIfNone, router]);

  return { me, loading, reload: () => setReloadFlag((n) => n + 1) };
}
