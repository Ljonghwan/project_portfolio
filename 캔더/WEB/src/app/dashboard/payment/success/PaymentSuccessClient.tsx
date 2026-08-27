"use client";

import { useEffect, useState } from "react";
import { payOrder, registerBillingCard } from "@/lib/api";
import { PaymentResult } from "../PaymentResult";

// 같은 authKey 로 두 번 등록하지 않게 — authKey 는 일회용이라 두 번째 호출은 토스에서 실패한다.
// (dev 의 React StrictMode 는 마운트 effect 를 두 번 돌린다.)
const handled = new Set<string>();

// 카드 등록창에서 돌아온 직후 화면. 빌링키를 발급(카드 저장)하고, 결제하려던 주문이 있으면 이어서
// 그 주문까지 승인한다. ⚠️ 결제 금액·주문번호는 전부 서버가 DB 에서 만든다 — 여기서 넘기지 않는다.
export function PaymentSuccessClient({ authKey, orderId }: { authKey: string; orderId: string }) {
  // 실패 제목은 "어디까지 갔는지"로 정한다 — orderId 유무로 정하면 등록+결제를 이어가는 흐름에서
  // 카드 등록 자체가 거절돼도 "결제 실패"로 읽혀 이중결제를 걱정하게 된다(카드#026 QA A-7).
  const [fail, setFail] = useState<{ stage: "register" | "pay"; body: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!authKey) {
        setFail({
          stage: "register",
          body: "카드 등록 정보가 올바르지 않습니다. 크레딧 화면에서 다시 시도해주세요.",
        });
        return;
      }
      if (handled.has(authKey)) return;
      handled.add(authKey);
      let stage: "register" | "pay" = "register";
      try {
        const { card } = await registerBillingCard(authKey);
        // 카드만 등록한 경우(크레딧 화면의 "카드 추가") — 결제 없이 안내만 하고 돌아간다.
        if (!orderId) {
          window.location.replace("/dashboard?tab=wallet&carded=1");
          return;
        }
        stage = "pay";
        const { order } = await payOrder(orderId, card.id);
        if (!alive) return;
        // 성공 문구는 크레딧 탭에서 띄운다 — 잔액·사용 내역과 함께 봐야 확인이 끝난다.
        // replace 라 뒤로가기가 이 승인 화면으로 되돌아오지 않는다.
        window.location.replace(`/dashboard?tab=wallet&charged=${order.totalCredits}`);
      } catch (e) {
        // 서버가 이미 사용자용 문구로 바꿔 보낸다(토스 원문 코드는 서버 로그·error_logs 에만 남는다).
        if (alive) setFail({ stage, body: e instanceof Error ? e.message : "잠시 후 다시 시도해주세요." });
      }
    })();
    return () => {
      alive = false;
    };
  }, [authKey, orderId]);

  return fail ? (
    // 카드 등록에서 멈췄으면 "결제"가 아니라 "등록" 실패다(본문은 서버가 이미 그 문구로 보낸다
    // — 제목만 맞춰준다. /payment/fail 의 동일 구분과 짝).
    <PaymentResult
      title={fail.stage === "pay" ? "결제를 완료하지 못했습니다" : "카드를 등록하지 못했습니다"}
      body={fail.body}
      back
    />
  ) : (
    <PaymentResult title="카드를 확인하고 있습니다" body="창을 닫지 말고 잠시만 기다려주세요." spinner />
  );
}
