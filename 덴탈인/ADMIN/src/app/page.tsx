"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    const t = typeof window !== "undefined" ? window.localStorage.getItem("adminAccessToken") : null;
    router.replace(t ? "/dashboard" : "/login");
  }, [router]);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "#F5F7FA",
      }}
    >
      <Spin size="large" />
      <span style={{ color: "#888", fontSize: 14 }}>로딩 중...</span>
    </div>
  );
}
