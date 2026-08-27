"use client";

// 문의하기 (퍼블 support-qna.html 기준) — `.qna-tabs` 2탭: [새 문의 작성] / [내 문의 내역(N)].
// 회원: 두 탭 모두. 비회원: 탭 미노출(새 문의 작성 폼만). 회원/비회원 작성 분기 + 공개 작성 유지.
// 문의 카테고리·문의 유형·첨부파일 제외(PM 지시).
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SupportShell from "@/components/SupportShell";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { useMe } from "@/lib/useMe";
import { api } from "@/lib/api";
import { formatPhone } from "@/lib/format";
import { createQna, listMyQnas, type SupportQnaItem } from "@/lib/qna";

// 개인정보 수집·이용 동의 fallback(관리자 미등록 시). 퍼블 support-qna.html .consent-text 1:1.
const CONSENT_FALLBACK = `귀하의 소중한 개인정보는 개인정보보호법의 관련 규정에 의하여 문의에 대한 회신 등 아래의 목적으로 수집 및 이용됩니다.

1. 개인정보의 수집 · 이용 목적 — 문의 접수 및 회신을 위한 본인 확인 절차
2. 개인정보 수집 항목 — 이름, 이메일, 연락처
3. 개인정보의 보유 및 이용 기간 — 이용자의 개인정보는 원칙적으로 개인정보의 처리 목적이 달성되면 지체 없이 파기합니다. 단, 문의 및 답변을 위하여 수집된 개인정보는 「전자상거래 등에서의 소비자보호에 관한 법률」 제 6조에 의거 정해진 기간 동안 보유됩니다.`;

const TITLE_MAX = 100;
const CONTENT_MAX = 1000; // 퍼블 support-qna.html maxlength=1000

function fmtDateTime(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
// 내 문의 내역 col-date(퍼블 support-qna.html): 날짜만
function fmtDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function QnaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 비회원도 접근 가능 — 로그인 강제 안 함(useMe(false)).
  const { me, loading: meLoading } = useMe(false);
  const isMember = !!me;

  // 탭: new(새 문의 작성) | my(내 문의 내역). 비회원은 항상 new.
  const tabParam = searchParams.get("tab") === "my" ? "my" : "new";
  const [tab, setTab] = useState<"new" | "my">(tabParam);
  // 비회원은 my 탭 불가 → 로딩 완료 후 비회원이고 my면 new로(로딩 중엔 건드리지 않아 ?tab=my 초기값 보존).
  useEffect(() => { if (!meLoading && !isMember && tab === "my") setTab("new"); }, [meLoading, isMember, tab]);

  // 작성 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 개인정보 수집·이용 동의(회원/비회원 공통). 관리자 등록 약관 fetch, 미등록 시 fallback.
  const [consentText, setConsentText] = useState<string>(CONSENT_FALLBACK);
  const [agreeConsent, setAgreeConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ content: string }>("/api/terms?type=qnaPrivacy");
      if (res.success && res.data?.content?.trim()) setConsentText(res.data.content);
    })();
  }, []);

  // 내 문의 내역(회원)
  const [data, setData] = useState<{ items: SupportQnaItem[]; total: number } | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const pageSize = 20;
  const showSkeleton = useMinimumLoading(listLoading);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    const res = await listMyQnas("all", page, pageSize);
    if (res.success && res.data) {
      setData(res.data);
      setOpenId((prev) => prev ?? (res.data!.items.find((q) => q.status === "open")?.id ?? res.data!.items[0]?.id ?? null));
    } else setData({ items: [], total: 0 });
    setListLoading(false);
  }, [page]);

  // 회원 + my 탭 진입 시 목록 로드
  useEffect(() => { if (isMember && tab === "my") void fetchList(); }, [isMember, tab, fetchList]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)), [data]);
  const myCount = data?.total ?? null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();
    if (!t) return alert("제목을 입력하세요.");
    if (t.length > TITLE_MAX) return alert(`제목은 ${TITLE_MAX}자 이내여야 합니다.`);
    if (!c) return alert("내용을 입력하세요.");
    if (c.length > CONTENT_MAX) return alert(`내용은 ${CONTENT_MAX}자 이내여야 합니다.`);

    let guest: { guestName: string; guestEmail: string; guestPhone: string } | undefined;
    if (!isMember) {
      const gn = guestName.trim(), ge = guestEmail.trim(), gp = guestPhone.trim();
      if (!gn) return alert("이름을 입력하세요.");
      if (!ge || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ge)) return alert("올바른 이메일을 입력하세요.");
      if (!gp || !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(gp)) return alert("올바른 연락처를 입력하세요. (예: 010-1234-5678)");
      guest = { guestName: gn, guestEmail: ge, guestPhone: gp };
    }

    // 개인정보 수집·이용 동의 게이트(회원·비회원 공통)
    if (!agreeConsent) { setConsentErr(true); return; }

    setSubmitting(true);
    const res = await createQna({ title: t, content: c, ...(guest ?? {}) });
    setSubmitting(false);
    if (!res.success) { alert(res.message || "문의 등록에 실패했습니다."); return; }
    if (isMember) {
      alert("문의가 등록되었습니다. ‘내 문의 내역’에서 답변을 확인하실 수 있습니다.");
      setTitle(""); setContent(""); setData(null); setPage(1);
      setTab("my");
      router.replace("/support/qna/new?tab=my");
    } else {
      alert("문의가 등록되었습니다. 입력하신 이메일로 답변을 안내드립니다.");
      setTitle(""); setContent(""); setGuestName(""); setGuestEmail(""); setGuestPhone("");
      router.push("/support/notice");
    }
  };

  const switchTab = (t: "new" | "my") => {
    // BUG-G1: "새 문의 작성" 탭 재진입 시 폼/동의 상태 리셋(이전 작성·동의 잔존 방지).
    if (t === "new") {
      setTitle(""); setContent("");
      setAgreeConsent(false); setConsentErr(false);
    }
    setTab(t);
    router.replace(`/support/qna/new${t === "my" ? "?tab=my" : ""}`, { scroll: false });
  };

  if (meLoading) {
    return <SupportShell active="write"><div style={{ padding: 60, textAlign: "center", color: "var(--ink-3)" }}>불러오는 중…</div></SupportShell>;
  }

  return (
    <SupportShell active="write">
      <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
        <Link href="/">홈</Link> · <Link href="/support/notice">고객센터</Link> · <b>문의하기</b>
      </div>

      <div className="support-head">
        <h1>문의하기</h1>
        <p>
          {isMember
            ? "구체적으로 작성할수록 빠른 답변이 가능합니다. 답변은 ‘내 문의 내역’에서 확인하실 수 있습니다."
            : "비회원도 문의를 남기실 수 있습니다. 입력하신 이메일로 답변을 안내드립니다."}
        </p>
      </div>

      {/* 퍼블 .qna-tabs — 회원만 2탭, 비회원은 단일 폼(탭 미노출) */}
      {isMember && (
        <div className="qna-tabs">
          <button type="button" className={tab === "new" ? "on" : ""} onClick={() => switchTab("new")}>새 문의 작성</button>
          <button type="button" className={tab === "my" ? "on" : ""} onClick={() => switchTab("my")}>
            내 문의 내역 {myCount != null && <span style={{ marginLeft: 4, fontSize: 11, color: "var(--ink-4)" }}>({myCount})</span>}
          </button>
        </div>
      )}

      {/* ── 탭: 새 문의 작성 (퍼블 support-qna.html .qna-form-wrap 1:1) ── */}
      <div className={`tab-pane${tab === "new" ? " on" : ""}`}>
        <div className="qna-form-wrap">
          {/* 퍼블 .qna-intro: 문의 전 확인 안내 */}
          <div className="notice-box">
            <b>문의 전 확인해 주세요.</b><br />
            서비스와 관련 없는 비방 / 욕설 / 명예훼손성 게시글 등록 시 삭제 조치 될 수 있습니다. 자주 묻는 질문은{" "}
            <Link href="/support/faq" className="notice-box-link">FAQ</Link>에서 먼저 확인해 보세요.
          </div>
          <form onSubmit={onSubmit} noValidate>
            {/* 이름* + 연락처* (2열) */}
            <div className="field-row">
              <div className="field">
                <label htmlFor="qna-name">이름 <span className="req">*</span></label>
                <input id="qna-name" type="text" value={isMember ? me!.name : guestName} onChange={(e) => setGuestName(e.target.value)} disabled={isMember} placeholder="이름을 입력해 주세요" maxLength={50} />
              </div>
              <div className="field">
                <label htmlFor="qna-phone">연락처 <span className="req">*</span></label>
                <input id="qna-phone" type="tel" value={isMember ? formatPhone(me!.phone || "") : guestPhone} onChange={(e) => setGuestPhone(e.target.value)} disabled={isMember} placeholder="예) 010-1234-5678" maxLength={20} />
              </div>
            </div>
            {/* 이메일* */}
            <div className="field">
              <label htmlFor="qna-email">이메일 <span className="req">*</span></label>
              <input id="qna-email" type="email" value={isMember ? me!.email : guestEmail} onChange={(e) => setGuestEmail(e.target.value)} disabled={isMember} placeholder="답변 받을 이메일을 입력해 주세요" maxLength={160} />
            </div>
            {/* 제목* */}
            <div className="field">
              <label htmlFor="qna-title">제목 <span className="req">*</span></label>
              <input id="qna-title" type="text" placeholder="문의 제목을 입력해 주세요" value={title} onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))} maxLength={TITLE_MAX} />
            </div>
            {/* 문의내용* */}
            <div className="field">
              <label htmlFor="qna-content">문의내용 <span className="req">*</span></label>
              <textarea id="qna-content" placeholder={"문의 내용을 입력해 주세요. (1000자 이하)\n서비스와 관련 없는 비방 / 욕설 / 명예훼손성 게시글 등록 시 삭제 조치 될 수 있습니다."} value={content} onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))} maxLength={CONTENT_MAX} />
              <div className="help">
                <span>최대 1,000자까지 입력 가능합니다.</span>
                <span className="count">{content.length.toLocaleString()} / 1,000</span>
              </div>
            </div>
            {/* 퍼블 .consent-box: 개인정보 수집·이용 동의(관리자 등록 약관, white-space:pre-wrap) */}
            <div className={`consent-box${consentErr ? " err" : ""}`}>
              <div className="consent-title">개인정보 수집 및 이용 동의</div>
              <div className="consent-text">{consentText}</div>
              <label className="consent-check">
                <input type="checkbox" checked={agreeConsent} onChange={(e) => { setAgreeConsent(e.target.checked); if (e.target.checked) setConsentErr(false); }} />
                개인정보 수집 및 이용에 동의합니다.<span className="req"> *</span>
              </label>
              {consentErr && <p className="consent-err">개인정보 수집 및 이용에 동의해 주세요.</p>}
            </div>
            {/* 퍼블 .submit-btn: 동의 전 disabled */}
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "등록 중…" : "문의하기"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── 탭: 내 문의 내역(회원만) ── */}
      {isMember && (
        <div className={`tab-pane${tab === "my" ? " on" : ""}`}>
          {showSkeleton && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><LoadingIndicator /></div>}

          {!showSkeleton && data && data.items.length === 0 && (
            <div className="fav-empty">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" /><line x1="12" y1="17" x2="12" y2="17.5" /></svg>
              </div>
              <h4>문의 내역이 없습니다.</h4>
              <p>궁금하신 점을 문의로 남겨주세요.</p>
              <button type="button" className="go-btn" onClick={() => switchTab("new")}>새 문의 작성</button>
            </div>
          )}

          {!showSkeleton && data && data.items.length > 0 && (
            // 퍼블 support-qna.html #pane-my: .qna-list > .qna-row(head/행). 행 클릭 시 Q·A 아코디언 펼침.
            // (카테고리 컬럼은 SupportQna에 분류 데이터가 없어 제외 — 가짜 데이터 회피)
            <div className="qna-list">
              <div className="qna-row head">
                <div className="col-status">상태</div>
                <div className="col-title">제목</div>
                <div className="col-date">작성일</div>
              </div>
              {data.items.map((q) => {
                const open = openId === q.id;
                const answered = q.status !== "open";
                return (
                  <div key={q.id} className={`qna-entry${open ? " open" : ""}`}>
                    <div
                      className="qna-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenId(open ? null : q.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenId(open ? null : q.id); } }}
                    >
                      <div className="col-status">
                        <span className={`status-pill ${answered ? "done" : "pending"}`}><span className="dt" />{answered ? "답변 완료" : "답변 대기"}</span>
                      </div>
                      <div className="col-title">
                        <span className="tt">{q.title}</span>
                        {q.answer && <span className="reply">답변 1</span>}
                      </div>
                      <div className="col-date">{fmtDate(q.createdAt)}</div>
                    </div>
                    {open && (
                      <div className="qna-acc">
                        <div className="qa-block">
                          <span className="qa-tag q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" /><line x1="12" y1="17" x2="12" y2="17.5" /></svg>Q. 회원의 문의</span>
                          <h5>{q.title}</h5>
                          <p>{q.content}</p>
                          <div className="stamp"><span className="who">{me?.name || "나"}</span><span>·</span><span>{fmtDateTime(q.createdAt)}</span></div>
                        </div>
                        {q.answer ? (
                          <div className="qa-block answer">
                            <span className="qa-tag a"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>A. 관리자 답변</span>
                            <p>{q.answer}</p>
                            <div className="stamp"><span className="who">덴탈인 운영팀</span><span>·</span><span>{fmtDateTime(q.answeredAt)}</span></div>
                          </div>
                        ) : (
                          <div className="empty-pending" style={{ marginTop: 12 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 13 16 15" /></svg>
                            현재 답변 대기 중입니다. 평균 1영업일 이내에 답변드립니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {data && data.total > pageSize && (
            <div className="pager" style={{ marginTop: 16 }}>
              <button type="button" className="nav" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>‹</button>
              {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
                const start = Math.max(1, Math.min(totalPages - 9, page - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return <button key={p} type="button" className={p === page ? "on" : ""} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button type="button" className="nav" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>›</button>
            </div>
          )}
        </div>
      )}
    </SupportShell>
  );
}

export default function NewQnaPage() {
  return <Suspense fallback={<div />}><QnaContent /></Suspense>;
}
