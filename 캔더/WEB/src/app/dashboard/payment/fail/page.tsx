import type { Metadata } from "next";
import { PaymentResult } from "../PaymentResult";

// 🔒 결제창 리다이렉트 복귀 지점 — 색인 금지.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// 카드 등록창 실패 복귀 지점(카드#026 A — 결제는 등록 카드로만 하므로 이 화면은 등록 실패 전용).
// 토스가 붙여 보내는 쿼리: ?code={ERROR_CODE}&message={ERROR_MESSAGE}
// 🔒 원문 코드·메시지는 화면에 노출하지 않는다 — 우리 문구로만 안내한다.
// 출처: https://docs.tosspayments.com/reference/error-codes (결제창 실패 코드)
const FAIL_MESSAGE: Record<string, { title: string; body: string }> = {
  USER_CANCEL: {
    title: "카드 등록을 취소했습니다",
    body: "크레딧은 충전되지 않았습니다. 다시 충전하려면 크레딧 화면으로 돌아가주세요.",
  },
  PAY_PROCESS_CANCELED: {
    title: "카드 등록을 취소했습니다",
    body: "크레딧은 충전되지 않았습니다. 다시 충전하려면 크레딧 화면으로 돌아가주세요.",
  },
  PAY_PROCESS_ABORTED: {
    title: "카드 등록이 진행되지 않았습니다",
    body: "등록 도중 중단되어 크레딧이 충전되지 않았습니다. 잠시 후 다시 시도해주세요.",
  },
  REJECT_CARD_COMPANY: {
    title: "카드사에서 등록을 거절했습니다",
    body: "한도와 잔액을 확인하시거나 다른 카드로 다시 시도해주세요.",
  },
};

const DEFAULT_FAIL = {
  title: "카드를 등록하지 못했습니다",
  body: "크레딧은 충전되지 않았습니다. 잠시 후 다시 시도해주세요.",
};

// 승인 API 를 부르지 않는 안내 전용 화면이라 클라이언트 로직이 없다 — 표시부만 렌더한다.
export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const code = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  const { title, body } = (code && FAIL_MESSAGE[code]) || DEFAULT_FAIL;
  return <PaymentResult title={title} body={body} back />;
}
