"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { IconCheck, IconCoin, IconInfo, IconPlus, IconTrash } from "@/components/icons";
import {
  createOrder,
  deleteBillingCard,
  getWallet,
  getWalletLedger,
  listBillingCards,
  payOrder,
  type BillingCard,
  type CreditProduct,
  type LedgerEntry,
} from "@/lib/api";
import { fmtDateTime as fmtDate } from "@/lib/datetime";
import { useModalA11y } from "@/lib/modalA11y";
import { dashStyles } from "./dashStyles";

// 서버 MIN_CREDITS_TO_ANSWER 미러 — 이보다 적으면 답변이 중단된다(부족 안내 노출 기준).
const LOW_BALANCE = 50;
const PAGE = 20;

// 토스 클라이언트 키. 빌드 타임에 번들로 인라인된다(front/Dockerfile ARG).
// 🔒 공개돼도 되는 키지만 **코드에 박지 않는다** — 테스트/라이브 전환이 빌드 인자 하나로 끝나야 한다.
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

const REASON_LABEL: Record<LedgerEntry["reason"], string> = {
  purchase: "크레딧 충전",
  answer: "AI 답변",
  ingest: "자료 분석",
  embedding: "검색 색인",
  draft: "지원서 초안",
  admin_adjust: "관리자 조정",
};

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

// "현대 신용카드" — 카드사·종류는 토스 응답 그대로다(없을 수도 있어 폴백을 둔다).
function cardLabel(c: BillingCard): string {
  return `${c.cardCompany || "등록"} ${c.cardType || ""}카드`.replace(/\s+/g, " ");
}

export function WalletView({ onBalance }: { onBalance?: (n: number) => void }) {
  const [balance, setBalance] = useState(0);
  const [products, setProducts] = useState<CreditProduct[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [cards, setCards] = useState<BillingCard[]>([]);
  const [customerKey, setCustomerKey] = useState("");
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [buying, setBuying] = useState<string | null>(null); // 결제 진행중인 상품 id
  const [pick, setPick] = useState<CreditProduct | null>(null); // 카드 선택 모달 대상 상품
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const pickRef = useRef<HTMLDivElement>(null);
  // 모달을 연 "결제하기" 버튼 — 닫을 때 키보드 포커스를 그 자리로 되돌린다(useModalA11y 계약).
  const pickTriggerRef = useRef<HTMLElement | null>(null);

  useModalA11y(pick !== null, () => setPick(null), pickRef, pickTriggerRef);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [w, l, c] = await Promise.all([getWallet(), getWalletLedger(1, PAGE), listBillingCards()]);
        if (!alive) return;
        setBalance(w.balance);
        onBalance?.(w.balance); // 결제 복귀 직후 헤더의 잔액 부족 배너까지 함께 최신화된다
        setProducts(w.products);
        setLedger(l.ledger);
        setLedgerTotal(l.total);
        setCards(c.cards);
        setCustomerKey(c.customerKey);
        setPhase("ready");
        // 카드 등록 복귀(`?charged=`/`?carded=`) 안내. 이미 갱신된 값을 보고 있으므로 문구만 얹고
        // 쿼리는 지운다 — 새로고침할 때마다 "충전 완료" 가 다시 뜨면 안 된다.
        const q = new URLSearchParams(window.location.search);
        const charged = Number(q.get("charged"));
        if (charged > 0) {
          setMsg({ kind: "ok", text: `충전 완료 · ${fmt(charged)} 크레딧이 지급되었습니다.` });
        } else if (q.get("carded")) {
          setMsg({ kind: "ok", text: "카드가 등록되었습니다. 이제 이 카드로 바로 충전할 수 있습니다." });
        }
        if (charged > 0 || q.get("carded")) window.history.replaceState(null, "", "/dashboard?tab=wallet");
      } catch {
        if (alive) setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [onBalance]);

  const loadMore = async () => {
    const next = ledgerPage + 1;
    const l = await getWalletLedger(next, PAGE);
    setLedger((prev) => [...prev, ...l.ledger]);
    setLedgerPage(next);
  };

  // 카드 등록창(토스 자동결제 빌링) 열기 — 리다이렉트 방식이라 성공하면 이 페이지를 떠난다.
  // orderId 를 넘기면 복귀 화면이 카드 저장 직후 그 주문까지 이어서 결제한다(최초 결제 흐름).
  // ⚠️ customerKey 는 서버가 준 값 그대로 — 프론트에서 조립하면 발급된 빌링키와 어긋난다.
  const openCardWindow = async (orderId?: string) => {
    if (!TOSS_CLIENT_KEY) {
      throw new Error("결제 설정이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
    }
    const toss = await loadTossPayments(TOSS_CLIENT_KEY);
    const payment = toss.payment({ customerKey });
    await payment.requestBillingAuth({
      method: "CARD",
      // 토스는 successUrl 의 쿼리를 지우지 않고 authKey·customerKey 를 덧붙인다(SDK 규격).
      successUrl: `${window.location.origin}/dashboard/payment/success${orderId ? `?orderId=${orderId}` : ""}`,
      failUrl: `${window.location.origin}/dashboard/payment/fail`,
    });
  };

  // 결제창을 못 연 경우의 공통 처리 — 사용자가 스스로 창을 닫은 건 정상 흐름이라 오류로 알리지 않는다.
  const reportOpenFail = (e: unknown) => {
    const raw = e instanceof Error ? e.message : "";
    const canceled = e instanceof Error && "code" in e && e.code === "USER_CANCEL";
    if (!canceled) {
      setMsg({
        kind: "err",
        text:
          raw ||
          "결제창을 열지 못했습니다. 브라우저의 팝업 차단이나 광고 차단 확장을 해제한 뒤 다시 시도해주세요.",
      });
    }
  };

  // 상품 "결제하기". 카드가 없으면 주문을 만들고 바로 등록창으로, 있으면 카드 선택 모달을 연다
  // (주문은 카드를 고른 뒤에 만든다 — 모달을 닫았을 때 빈 주문이 남지 않게).
  const buy = async (p: CreditProduct) => {
    setMsg(null);
    if (cards.length > 0) {
      setPick(p);
      return;
    }
    setBuying(p.id);
    try {
      const { order } = await createOrder(p.id);
      await openCardWindow(order.id);
    } catch (e) {
      reportOpenFail(e);
      setBuying(null);
    }
  };

  // 등록 카드로 결제 — 리다이렉트 없이 그 자리에서 잔액·사용 내역을 갱신한다.
  const payWithCard = async (p: CreditProduct, cardId: string) => {
    setPick(null);
    setBuying(p.id);
    setMsg(null);
    try {
      const { order } = await createOrder(p.id);
      const r = await payOrder(order.id, cardId);
      setBalance(r.balance);
      onBalance?.(r.balance);
      setMsg({ kind: "ok", text: `충전 완료 · ${fmt(order.totalCredits)} 크레딧이 지급되었습니다.` });
      const l = await getWalletLedger(1, PAGE);
      setLedger(l.ledger);
      setLedgerTotal(l.total);
      setLedgerPage(1);
    } catch (e) {
      // 서버가 이미 사용자용 문구로 바꿔 보낸다(토스 원문 코드는 서버 로그·error_logs 에만 남는다).
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "결제를 완료하지 못했습니다." });
    } finally {
      setBuying(null);
    }
  };

  // 결제 없이 카드만 추가.
  const addCard = async () => {
    setMsg(null);
    setBuying("__card__");
    try {
      await openCardWindow();
    } catch (e) {
      reportOpenFail(e);
      setBuying(null);
    }
  };

  const removeCard = async (c: BillingCard) => {
    setMsg(null);
    try {
      const r = await deleteBillingCard(c.id);
      setCards(r.cards);
      setMsg({ kind: "ok", text: `${cardLabel(c)}를 삭제했습니다.` });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "카드를 삭제하지 못했습니다." });
    }
  };

  if (phase === "loading") {
    return (
      <div className="state">
        <div className="spin" />
        <p>불러오는 중…</p>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div className="state">
        <p>불러오지 못했습니다.</p>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }

  const low = balance < LOW_BALANCE;

  return (
    <>
      <div className="head">
        <div>
          <h1>크레딧</h1>
          <div className="sub">
            인사담당자 질문에 대한 AI 답변은 크레딧으로 차감됩니다. 충전하고 사용 내역을 확인하세요.
          </div>
        </div>
      </div>

      {/* 잔액 히어로 */}
      <div className={"balhero" + (low ? " low" : "")}>
        <div className="ico">
          <IconCoin />
        </div>
        <div className="bt">
          <div className="bl">현재 잔액</div>
          <div className="bv">
            {fmt(balance)} <span>크레딧</span>
          </div>
        </div>
      </div>

      {low && (
        <div className="notice warn">
          <IconInfo width={15} height={15} />
          <div>
            크레딧이 부족합니다. 충전하지 않으면 인사담당자 질문에 <b>답변이 일시 중단</b>됩니다(링크는 유지되어
            충전 즉시 다시 답변합니다).
          </div>
        </div>
      )}

      {msg && <div className={"buymsg " + msg.kind}>{msg.text}</div>}

      {/* 결제 카드 — 충전은 등록 카드로만 이뤄진다(1회성 결제창 경로 없음). */}
      <div className="ledhead cardhead">
        <h2>결제 카드</h2>
        <button type="button" className="addcard" disabled={buying !== null} onClick={addCard}>
          <IconPlus width={14} height={14} />
          카드 추가
        </button>
      </div>
      {cards.length === 0 ? (
        <div className="empty cardempty">
          등록된 카드가 없습니다. 상품을 선택하면 카드 등록 후 바로 충전됩니다.
        </div>
      ) : (
        <div className="cardlist">
          {cards.map((c) => (
            <div key={c.id} className="cardrow">
              <div className="cdmeta">
                <div className="cdname">
                  {cardLabel(c)}
                  {c.isDefault && <span className="cdbadge">기본</span>}
                </div>
                <div className="cdnum">{c.cardNumberMasked || "카드번호 비공개"}</div>
              </div>
              <button
                type="button"
                className="cddel"
                disabled={buying !== null}
                onClick={() => removeCard(c)}
              >
                <IconTrash width={14} height={14} />
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 판매 상품(서버 상품표 순서 그대로) — 상위 상품일수록 보너스가 커져 크레딧당 단가가 싸다.
          개수가 바뀌면 dashStyles 의 `.prodgrid` 열 수도 함께 맞춘다(그 주석 참고). */}
      <div className="prodgrid">
        {products.map((p) => (
          <div key={p.id} className={"prod" + (p.highlight ? " hot" : "")}>
            {p.badge && <span className="pbadge">{p.badge}</span>}
            <div className="pname">{p.name}</div>
            <div className="pprice">
              {fmt(p.amountKrw)}
              <span>원</span>
            </div>
            <div className="pcredits">
              <div className="pc-row">
                <span>기본</span>
                <b>{fmt(p.baseCredits)}</b>
              </div>
              {p.bonusCredits > 0 && (
                <div className="pc-row bonus">
                  <span>보너스</span>
                  <b>+{fmt(p.bonusCredits)}</b>
                </div>
              )}
              <div className="pc-row total">
                <span>총 지급</span>
                <b>
                  <IconCoin width={14} height={14} />
                  {fmt(p.totalCredits)}
                </b>
              </div>
            </div>
            <div className="pper">크레딧당 {p.krwPerCredit}원</div>
            <button
              type="button"
              className={"paybtn" + (p.highlight ? " hot" : "")}
              disabled={buying !== null}
              onClick={(e) => {
                pickTriggerRef.current = e.currentTarget;
                buy(p);
              }}
            >
              {buying === p.id ? "결제 중…" : "결제하기"}
            </button>
          </div>
        ))}
      </div>

      {/* 사용 내역(원장) */}
      <div className="ledhead">
        <h2>사용 내역</h2>
        <span className="ledcount">총 {fmt(ledgerTotal)}건</span>
      </div>
      {ledger.length === 0 ? (
        <div className="empty">아직 충전·사용 내역이 없습니다.</div>
      ) : (
        <div className="ledlist">
          {ledger.map((l) => (
            <div key={l.id} className="ledrow">
              <div className="lmeta">
                <div className="lreason">
                  {l.entryType === "charge" ? (
                    <IconCheck width={14} height={14} />
                  ) : (
                    <IconCoin width={14} height={14} />
                  )}
                  {l.description || REASON_LABEL[l.reason]}
                </div>
                <div className="ldate">{fmtDate(l.createdAt)}</div>
              </div>
              <div className="lamt">
                <span className={l.entryType === "charge" ? "plus" : "minus"}>
                  {l.entryType === "charge" ? "+" : "−"}
                  {fmt(l.amount)}
                </span>
                <span className="lbal">잔액 {fmt(l.balanceAfter)}</span>
              </div>
            </div>
          ))}
          {ledger.length < ledgerTotal && (
            <button type="button" className="moreled" onClick={loadMore}>
              더 보기
            </button>
          )}
        </div>
      )}

      {/* 카드 선택 — 등록 카드가 있을 때만 뜬다. 고르는 즉시 결제되므로 금액을 다시 보여준다. */}
      {pick && (
        <div className="pk-ovl">
          <div className="pk" ref={pickRef} role="dialog" aria-modal="true" aria-labelledby="pk-title">
            <h2 id="pk-title">결제 카드 선택</h2>
            <div className="pk-sub">
              {pick.name} · {fmt(pick.amountKrw)}원 · {fmt(pick.totalCredits)} 크레딧
            </div>
            {cards.map((c) => (
              <button
                key={c.id}
                type="button"
                className="pk-card"
                onClick={() => payWithCard(pick, c.id)}
              >
                <span className="cdname">
                  {cardLabel(c)}
                  {c.isDefault && <span className="cdbadge">기본</span>}
                </span>
                <span className="cdnum">{c.cardNumberMasked || "카드번호 비공개"}</span>
              </button>
            ))}
            <button
              type="button"
              className="pk-new"
              onClick={async () => {
                setPick(null);
                setBuying(pick.id);
                try {
                  const { order } = await createOrder(pick.id);
                  await openCardWindow(order.id);
                } catch (e) {
                  reportOpenFail(e);
                  setBuying(null);
                }
              }}
            >
              <IconPlus width={14} height={14} />새 카드로 결제
            </button>
            <button type="button" className="pk-cancel" onClick={() => setPick(null)}>
              취소
            </button>
          </div>
        </div>
      )}

      <style jsx>{dashStyles}</style>
    </>
  );
}
