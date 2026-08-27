"use client";

// SNS OAuth 로그인 성공 후 진입(서버 콜백이 refresh 쿠키 set 후 여기로 리다이렉트).
//   refresh 쿠키로 accessToken을 발급받아 localStorage 저장 → 마이페이지. (accessToken은 URL에 노출되지 않음)
import { Suspense, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import LoadingIndicator from "@/components/LoadingIndicator";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

function SnsCallbackContent() {
  const router = useRouter();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const res = await api.post<{ accessToken: string }>("/api/auth/refresh");
      if (res.success && res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        await useAuthStore.getState().syncFromServer();
        router.replace("/mypage");
      } else {
        router.replace("/login?sns_error=session");
      }
    })();
  }, [router]);

  return (
    <AuthShell>
      <div className="auth-card">
        <div className="noti-state load-state" style={{ minHeight: 240 }}>
          <LoadingIndicator fullPage={false} />
        </div>
      </div>
    </AuthShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <SnsCallbackContent />
    </Suspense>
  );
}
