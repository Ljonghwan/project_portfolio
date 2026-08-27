import { redirect } from "next/navigation";

// 내 문의 내역은 문의하기 페이지의 .qna-tabs 탭으로 통합(퍼블 support-qna.html). 구 경로는 리다이렉트.
export default function SupportInquiryRedirect() {
  redirect("/support/qna/new?tab=my");
}
