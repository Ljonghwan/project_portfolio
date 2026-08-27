"use client";

// F-B item6: 1:1 문의 일원화 — 공개 /support/qna 목록 진입점 제거.
// 조회는 마이페이지(나의 문의)로 통일. 구 링크/북마크는 /mypage/inquiry로 리다이렉트.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QnaListRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mypage/inquiry");
  }, [router]);
  return null;
}
