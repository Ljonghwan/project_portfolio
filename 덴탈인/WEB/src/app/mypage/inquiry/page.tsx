import { redirect } from "next/navigation";

// 그룹A: 나의 문의는 고객센터(/support/inquiry)로 통합 이전. 구 경로는 리다이렉트로 보존.
export default function MypageInquiryRedirect() {
  redirect("/support/inquiry");
}
