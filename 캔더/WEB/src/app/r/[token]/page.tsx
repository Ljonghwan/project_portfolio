import type { Metadata } from "next";
import { ResumeClient } from "./ResumeClient";

// 🔒 재개 링크는 토큰 자체가 접근 권한(capability)이다 — 검색에 색인되면 대화가 통째로 공개된다.
//    OG 문구는 루트 기본 메타를 그대로 쓴다(대화 내용을 미리보기에 싣지 않는다).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ResumePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResumeClient token={token} />;
}
