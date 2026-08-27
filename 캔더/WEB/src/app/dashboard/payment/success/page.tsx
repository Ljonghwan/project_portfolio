import type { Metadata } from "next";
import { PaymentSuccessClient } from "./PaymentSuccessClient";

// 🔒 결제창 리다이렉트 복귀 지점 — 쿼리에 결제 식별자가 실려 있다. 색인 금지.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// 카드 등록(빌링) 복귀 지점. 토스가 붙여 보내는 쿼리: ?customerKey=…&authKey=…
// 여기에 우리가 successUrl 에 실어 보낸 ?orderId=(주문 uuid) 가 함께 온다 — 카드 저장 직후 이어서 결제할 주문.
// customerKey 는 받지 않는다: 서버가 자기 값으로만 빌링키를 발급하므로(다르면 토스가 거절) 신뢰할 필요가 없다.
// 서버 컴포넌트에서 받아 넘긴다 — `useSearchParams` 는 prod 빌드에서 Suspense 경계를 요구해
// 화면 전체가 초기 HTML 에서 빠진다(front/CLAUDE.md).
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return <PaymentSuccessClient authKey={one(sp.authKey)} orderId={one(sp.orderId)} />;
}
