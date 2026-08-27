"use client";

import { useEffect, useState } from "react";
import { IconBack, IconChat, IconCoin, IconDownload } from "@/components/icons";
import {
  getConversationMessages,
  listLinkConversations,
  listMyLinks,
  type ConversationSummary,
  type OwnedLink,
  type OwnerMessage,
} from "@/lib/api";
import { fmtDateTime as fmtDate } from "@/lib/datetime";
import { dashStyles } from "./dashStyles";


// focus — 대시보드 알림함에서 넘어온 목적지(카드#031). 부모가 key 로 리마운트하므로 마운트 1회 효과가
// 곧 이동이다. 링크가 사라졌거나 대화 조회가 실패하면 조용히 기본 화면으로 남는다(에러 토스트 금지).
export function ConversationsView({
  focus,
}: {
  focus?: { linkId: string; conversationId: string } | null;
}) {
  const [links, setLinks] = useState<OwnedLink[]>([]);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [convs, setConvs] = useState<ConversationSummary[] | null>(null);
  const [conv, setConv] = useState<{
    messages: OwnerMessage[];
    total: number;
    summary: ConversationSummary;
  } | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    // async IIFE — await 후에만 setState(effect 바디 동기 setState 회피). 링크 + 첫 링크 대화 로드.
    (async () => {
      try {
        const { links } = await listMyLinks();
        if (!alive) return;
        setLinks(links);
        // 알림에서 들어왔으면 그 링크를, 아니면(또는 그 링크가 사라졌으면) 첫 링크를 연다.
        const target = (focus && links.find((l) => l.id === focus.linkId)) || links[0];
        if (target) {
          setLinkId(target.id);
          const r = await listLinkConversations(target.id);
          if (alive) setConvs(r.conversations);
          if (focus) {
            // 폐기·삭제된 대화면 404 — 목록만 보여주고 넘어간다(에러 토스트 금지).
            try {
              const c = await getConversationMessages(focus.conversationId);
              if (alive) setConv({ messages: c.messages, total: c.totalCredits, summary: c.conversation });
            } catch {
              /* 목록 유지 */
            }
          }
        }
        setPhase("ready");
      } catch {
        if (alive) setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [focus]);

  // 링크 전환은 이벤트 핸들러(effect 아님 → setState 자유). 이전 목록/열린 대화 초기화 후 재조회.
  const selectLink = async (id: string) => {
    if (id === linkId) return;
    setLinkId(id);
    setConv(null);
    setConvs(null);
    try {
      const r = await listLinkConversations(id);
      setConvs(r.conversations);
    } catch {
      setConvs([]);
    }
  };

  const openConv = async (id: string) => {
    try {
      const r = await getConversationMessages(id);
      setConv({ messages: r.messages, total: r.totalCredits, summary: r.conversation });
    } catch {
      /* 무시 */
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

  return (
    <>
      <div className="head">
        <div>
          <h1>대화</h1>
          <div className="sub">
            내 링크로 진행된 인사담당자 Q&amp;A와 답변별 크레딧 소비를 열람합니다.
          </div>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="empty">아직 링크가 없습니다. 링크 탭에서 먼저 발급하세요.</div>
      ) : (
        <>
          <div className="convpick">
            {links.map((l) => (
              <button
                key={l.id}
                type="button"
                className={l.id === linkId ? "on" : ""}
                onClick={() => selectLink(l.id)}
              >
                <IconChat width={14} height={14} />
                {l.label}
              </button>
            ))}
          </div>

          {conv ? (
            <>
              <div className="backbar">
                <button type="button" className="backbtn" onClick={() => setConv(null)}>
                  <IconBack width={15} height={15} />
                  대화 목록
                </button>
                {/* 다운로드 이력이 없는 대화엔 문구 자체를 렌더하지 않는다 — 기록 도입 이전 대화가
                    전부 0 이라 "0회" 를 띄우면 "안 받아갔다"는 잘못된 사실을 말하게 된다. */}
                {conv.summary.downloadCount > 0 && conv.summary.lastDownloadedAt && (
                  <span className="dlnote">
                    <IconDownload width={13} height={13} />
                    이력서 다운로드 {conv.summary.downloadCount}회 · 최근{" "}
                    {fmtDate(conv.summary.lastDownloadedAt)}
                  </span>
                )}
                <span className="totok">
                  <IconCoin />
                  {/* 전부 옛 데이터(creditCost 기록 이전)면 0 이 아니라 "-" — 무료였던 것처럼 보이지 않게. */}
                  합계 {conv.messages.every((m) => m.creditCost == null) ? "-" : `${conv.total} 크레딧`}
                </span>
              </div>
              {/* HR 이 링크를 열어보기만 하면 메시지 0건 대화가 생긴다(세션 시작 시 find-or-create).
                  그때 .msgview 를 그리면 내용 없는 흰 박스만 남으므로 안내 문구로 대체한다.
                  목록 행·`메시지 0` 표시는 그대로 둔다 — "열어봤다"는 구직자에게 유효한 정보다. */}
              {conv.messages.length === 0 ? (
                <div className="empty">
                  아직 주고받은 메시지가 없습니다. 인사담당자가 링크를 열어보기만 한 대화입니다.
                </div>
              ) : (
                <div className="msgview">
                  {conv.messages.map((m) => (
                    <MsgRow key={m.id} m={m} />
                  ))}
                </div>
              )}
            </>
          ) : convs === null ? (
            <div className="state">
              <div className="spin" />
            </div>
          ) : convs.length === 0 ? (
            <div className="empty">이 링크로 진행된 대화가 아직 없습니다.</div>
          ) : (
            convs.map((c) => (
              <button key={c.id} type="button" className="convrow" onClick={() => openConv(c.id)}>
                <div>
                  <div className="cco">{c.companyName ?? "회사명 미입력"}</div>
                  <div className="cmeta">
                    {fmtDate(c.startedAt)} 시작 · 최근 {fmtDate(c.lastActivityAt)}
                  </div>
                </div>
                <span className="ccount">메시지 {c.messageCount}</span>
                {c.downloadCount > 0 && (
                  <span className="ccount cdl">
                    <IconDownload width={12} height={12} />
                    다운로드 {c.downloadCount}회
                  </span>
                )}
              </button>
            ))
          )}
        </>
      )}
      <style jsx>{dashStyles}</style>
    </>
  );
}

function MsgRow({ m }: { m: OwnerMessage }) {
  if (m.role === "hr") {
    return (
      <div className="m hr">
        <div className="who">인사담당자</div>
        <div className="bub">{m.text}</div>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }
  const cls =
    "bub" +
    (m.answerKind === "blocked" ? " blocked" : "") +
    (m.answerKind === "no_info" ? " noinfo" : "");
  return (
    <div className="m ai">
      <div className="who">AI 대변인</div>
      <div className={cls}>
        {m.answerKind === "blocked" && <span className="tag-refuse">응답 거절 · </span>}
        {m.text}
      </div>
      <div className="mfoot">
        <span className="tok">
          <IconCoin />
          {/* null=크레딧 기록 이전 데이터라 알 수 없음("-"), 0=blocked 등 무료 답변. */}
          {m.creditCost == null ? "-" : `${m.creditCost} 크레딧`}
        </span>
      </div>
      <style jsx>{dashStyles}</style>
    </div>
  );
}
