import { redirect } from "next/navigation";

// 고객센터 진입점 — 첫 메뉴(공지사항)로 이동.
export default function SupportIndexPage() {
  redirect("/support/notice");
}
