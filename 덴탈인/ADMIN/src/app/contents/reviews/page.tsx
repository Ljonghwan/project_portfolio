"use client";
// p2-final(reviews MEDIUM): 병원후기 관리는 /contents/community의 병원후기 탭에 구현됨.
// 구 placeholder 경로로 진입 시 실제 구현 페이지로 리다이렉트(북마크/직접 진입 안전망).
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contents/community");
  }, [router]);
  return null;
}
