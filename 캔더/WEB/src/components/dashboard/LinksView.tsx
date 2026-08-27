"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  IconChat,
  IconCheck,
  IconClose,
  IconCopy,
  IconInfo,
  IconLink,
  IconPlus,
  IconReissue,
  IconTrash,
} from "@/components/icons";
import {
  addContext,
  ApiError,
  createLink,
  deleteContext,
  listContexts,
  listMyLinks,
  reissueLink,
  toggleLink,
  type ApiCompanyContext,
  type OwnedLink,
} from "@/lib/api";
import { useModalA11y } from "@/lib/modalA11y";
import { siteUrl, siteUrlLabel } from "@/lib/siteUrl";
import { dashStyles } from "./dashStyles";

// 새 링크 발급 UI 분기 — dashStyles 의 640px 모바일 브레이크포인트와 같은 경계.
// SSR 스냅샷은 모바일(인라인 폼)이고 하이드레이션 후 PC 면 모달로 바뀐다.
// useEffect + setState 로 재면 린트(set-state-in-effect) 위반이라 useSyncExternalStore 를 쓴다.
const DESKTOP_MQ = "(min-width:641px)";
const subscribeMq = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsDesktop = () =>
  useSyncExternalStore(
    subscribeMq,
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false,
  );

const STATUS_LABEL: Record<OwnedLink["status"], string> = {
  active: "활성",
  disabled: "비활성",
  revoked: "무효",
};

export function LinksView() {
  const [links, setLinks] = useState<OwnedLink[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");

  const reload = async () => {
    const { links } = await listMyLinks();
    setLinks(links);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await reload();
        if (alive) setPhase("ready");
      } catch (e) {
        if (!alive) return;
        setErrMsg(e instanceof ApiError ? e.message : "불러오지 못했습니다.");
        setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onToggle = async (link: OwnedLink) => {
    const next = link.status !== "active";
    const { link: updated } = await toggleLink(link.id, next);
    setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
  };

  const onReissue = async (link: OwnedLink) => {
    const ok = window.confirm(
      `재발급하면 기존 링크(${link.slug})는 즉시 무효화됩니다. 계속할까요?`,
    );
    if (!ok) return;
    await reissueLink(link.id);
    await reload();
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
        <p>{errMsg}</p>
        <style jsx>{dashStyles}</style>
      </div>
    );
  }

  return (
    <>
      <div className="head">
        <div>
          <h1>내 링크</h1>
          <div className="sub">공유 링크를 발급하고 유효 여부를 직접 통제하세요.</div>
        </div>
        <NewLinkButton onCreated={reload} />
      </div>

      {links.length === 0 ? (
        <div className="empty">
          아직 발급한 링크가 없습니다. “새 링크 발급”으로 첫 링크를 만들어보세요.
        </div>
      ) : (
        <div className="cards">
          {links.map((link) => (
            <LinkCard key={link.id} link={link} onToggle={onToggle} onReissue={onReissue} />
          ))}
        </div>
      )}
      <style jsx>{dashStyles}</style>
    </>
  );
}

function NewLinkButton({ onCreated }: { onCreated: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"universal" | "company">("universal");
  const [label, setLabel] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // PC 모달일 때만 트랩·Esc·포커스 복귀(모바일은 인라인 폼이라 트랩을 걸면 Tab 이 갇힌다).
  // 발급 중에는 Esc 닫기만 차단 — 트랩은 유지.
  useModalA11y(open && isDesktop, () => setOpen(false), boxRef, triggerRef, busy);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await createLink({
        type,
        label: label.trim(),
        companyName: type === "company" ? companyName.trim() : undefined,
      });
      setOpen(false);
      setLabel("");
      setCompanyName("");
      setType("universal");
      await onCreated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "발급에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <div
      className="newform"
      ref={boxRef}
      role={isDesktop ? "dialog" : undefined}
      aria-modal={isDesktop || undefined}
      aria-labelledby="nfTitle"
    >
      <div className="nf-head">
        <b id="nfTitle">새 링크 발급</b>
        <button type="button" className="icon-btn" aria-label="닫기" onClick={() => setOpen(false)}>
          <IconClose width={16} height={16} />
        </button>
      </div>
      <div className="nf-seg">
        <button
          type="button"
          className={type === "universal" ? "on" : ""}
          onClick={() => setType("universal")}
        >
          범용
        </button>
        <button
          type="button"
          className={type === "company" ? "on" : ""}
          onClick={() => setType("company")}
        >
          회사 맞춤
        </button>
      </div>
      <input
        className="nf-in"
        placeholder="이 링크를 구분할 이름"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      {type === "company" && (
        <input
          className="nf-in"
          placeholder="이 링크를 보낼 회사 이름"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      )}
      {err && <div className="nf-err">{err}</div>}
      <button
        type="button"
        className="nf-submit"
        onClick={submit}
        disabled={busy || !label.trim() || (type === "company" && !companyName.trim())}
      >
        {busy ? "발급 중…" : "발급하기"}
      </button>
    </div>
  );

  return (
    <>
      {/* PC 모달일 땐 트리거 버튼을 남겨둔다 — 닫을 때 포커스가 돌아갈 자리. 모바일은 폼이 그 자리를 차지. */}
      {(!open || isDesktop) && (
        <button ref={triggerRef} type="button" className="newbtn" onClick={() => setOpen(true)}>
          <IconPlus width={16} height={16} />새 링크 발급
        </button>
      )}
      {open && <div className={isDesktop ? "nf-ovl" : "nf-wrap"}>{form}</div>}
      <style jsx>{dashStyles}</style>
    </>
  );
}

function LinkCard({
  link,
  onToggle,
  onReissue,
}: {
  link: OwnedLink;
  onToggle: (l: OwnedLink) => Promise<void>;
  onReissue: (l: OwnedLink) => Promise<void>;
}) {
  const [qaOpen, setQaOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const revoked = link.status === "revoked";
  const active = link.status === "active";

  const copy = async () => {
    const url = siteUrl(`/l/${link.slug}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("이 링크를 복사하세요", url);
    }
  };

  const guard = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={"card" + (revoked ? " dim" : "")}>
      <div className="row1">
        <span className="label">{link.label}</span>
        <span className={"badge " + (link.type === "company" ? "b-comp" : "b-univ")}>
          {link.type === "company" ? "회사 맞춤" : "범용"}
        </span>
        {link.type === "company" && link.companyName && (
          <span className="badge b-co">{link.companyName}</span>
        )}
        <span className={"badge b-" + link.status}>{STATUS_LABEL[link.status]}</span>
        {/* 모바일에선 자체 행 칩으로 떨어져 긴 slug(재발급 16자 hex)도 안 깨짐 — dashStyles @media */}
        <span className="slug">
          <IconLink width={13} height={13} />
          {siteUrlLabel(`/l/${link.slug}`)}
        </span>
      </div>

      {revoked ? (
        <div className="meta dim-note">재발급으로 무효화됨. 이 링크로는 접속 불가.</div>
      ) : (
        <div className={"actions" + (link.type === "company" ? " has-qa" : "")}>
          <button
            type="button"
            className={"toggle" + (active ? " on" : "")}
            onClick={() => guard(() => onToggle(link))}
            disabled={busy}
            aria-pressed={active}
            aria-label={active ? "링크 비활성화" : "링크 활성화"}
          >
            <span className={"sw" + (active ? "" : " off")}>
              <i />
            </span>
            {active ? "유효" : "꺼짐"}
          </button>
          <button type="button" className="act reissue" onClick={() => guard(() => onReissue(link))} disabled={busy}>
            <IconReissue width={15} height={15} />
            재발급
          </button>
          <button type="button" className="act copy" onClick={copy}>
            <IconCopy width={15} height={15} />
            {copied ? "복사됨" : "링크 복사"}
          </button>
          {link.type === "company" && (
            <button
              type="button"
              className={"act qabtn" + (qaOpen ? " primary" : "")}
              onClick={() => setQaOpen((v) => !v)}
            >
              <IconChat width={15} height={15} />
              회사 Q&amp;A 관리
            </button>
          )}
        </div>
      )}

      {qaOpen && link.type === "company" && !revoked && <CompanyQA linkId={link.id} />}
      <style jsx>{dashStyles}</style>
    </div>
  );
}

// 회사타겟 Q&A 프리셋(사이클10 G) — 자주 쓰는 면접성 질문을 칩으로 제공, 클릭=질문 입력 채움.
// front 하드코딩(서버 불필요). label=칩 표시, q=입력에 채울 전체 질문.
const QA_PRESETS: { label: string; q: string }[] = [
  { label: "지원동기", q: "지원 동기가 무엇인가요?" },
  { label: "성격의 장단점", q: "성격의 장단점은 무엇인가요?" },
  { label: "입사 후 포부", q: "입사 후 포부가 무엇인가요?" },
  { label: "이직(퇴사) 사유", q: "이직(퇴사) 사유가 무엇인가요?" },
  { label: "협업 스타일", q: "협업 스타일은 어떤가요?" },
  { label: "갈등 해결 경험", q: "갈등을 해결한 경험이 있나요?" },
  { label: "희망 연봉·처우", q: "희망 연봉과 처우 조건은 어떻게 되나요?" },
  { label: "성과 낸 프로젝트", q: "가장 성과를 낸 프로젝트는 무엇인가요?" },
];

// 설명 패널의 예시 Q&A(카드#002 C) — 실제 등록 항목과 같은 모양으로 보여주되 "예시" 배지로 구분한다.
const QA_EXAMPLES: { q: string; a: string }[] = [
  {
    q: "이직 사유가 무엇인가요?",
    a: "직무 범위를 넓히고 싶어 결제 도메인 전반을 다루는 팀을 찾고 있습니다.",
  },
  {
    q: "희망 연봉이 어떻게 되나요?",
    a: "현재 6,200만원이며 회사 기준과 역할에 맞춰 협의 가능합니다.",
  },
];

function CompanyQA({ linkId }: { linkId: string }) {
  const [items, setItems] = useState<ApiCompanyContext[] | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [guide, setGuide] = useState(false); // 설명·예시 패널 — 기본 접힘

  useEffect(() => {
    let alive = true;
    listContexts(linkId)
      .then((r) => alive && setItems(r.contexts))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [linkId]);

  const add = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { context } = await addContext(linkId, { question: q.trim(), answer: a.trim() });
      setItems((prev) => [...(prev ?? []), context]);
      setQ("");
      setA("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (contextId: string) => {
    try {
      await deleteContext(linkId, contextId);
      setItems((prev) => (prev ?? []).filter((c) => c.id !== contextId));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="qa">
      <div className="qh">
        회사별 Q&amp;A · 메모 <span className="cnt">{items?.length ?? 0}</span>
        <button
          type="button"
          className={"ibtn" + (guide ? " on" : "")}
          aria-expanded={guide}
          onClick={() => setGuide((v) => !v)}
        >
          <IconInfo width={13} height={13} />
          {guide ? "설명 접기" : "설명 보기"}
        </button>
      </div>
      {guide && (
        <div className="qguide">
          <div className="gstep">
            <span className="gn">1</span>
            <p>
              여기 등록한 Q&amp;A 는 AI 가 답변할 때 <b>최우선 근거</b>로 씁니다. 업로드한 자료보다
              먼저 봅니다.
            </p>
          </div>
          <div className="gstep">
            <span className="gn">2</span>
            <p>
              이력서·포트폴리오에 <b>없는 내용</b>도 적어두면 AI 가 본인 목소리로 대신 답합니다.
            </p>
          </div>
          <div className="gext">예시 — 이런 형태로 저장됩니다</div>
          {QA_EXAMPLES.map((ex) => (
            <div className="qaitem ghost" key={ex.q}>
              <div className="qatext">
                <div className="q">{ex.q}</div>
                <div className="a">{ex.a}</div>
              </div>
              <span className="gbadge">예시</span>
            </div>
          ))}
        </div>
      )}
      {items?.map((c) => (
        <div className="qaitem" key={c.id}>
          <div className="qatext">
            <div className="q">{c.question}</div>
            <div className="a">{c.answer}</div>
          </div>
          <button type="button" className="icon-btn" aria-label="삭제" onClick={() => remove(c.id)}>
            <IconTrash width={15} height={15} />
          </button>
        </div>
      ))}
      {err && <div className="nf-err">{err}</div>}
      <div className="qapresets" aria-label="질문 프리셋">
        {QA_PRESETS.map((p) => (
          <button key={p.label} type="button" className="qp" onClick={() => setQ(p.q)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="qaform">
        <input placeholder="인사담당자가 물어볼 만한 질문" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="답변·메모" value={a} onChange={(e) => setA(e.target.value)} />
        <button
          type="button"
          className="add"
          onClick={add}
          disabled={busy || !q.trim() || !a.trim()}
          aria-label="등록"
        >
          <IconCheck width={16} height={16} />
        </button>
      </div>
      <style jsx>{dashStyles}</style>
    </div>
  );
}
