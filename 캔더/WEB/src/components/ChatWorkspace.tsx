"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- 스타일된 로고 링크는 네이티브 <a>.
   <Link> 의 <a> 에는 styled-jsx 스코프 해시가 안 붙어 .logo 스타일이 통째로 빠진다(front/CLAUDE.md). */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconPlay } from "@/components/icons";
import { PdfViewer } from "@/components/PdfViewer";
import { Prism } from "@/components/Prism";
import {
  ApiError,
  conversationAssetFileUrl,
  conversationAssetThumbUrl,
  conversationProfilePhotoUrl,
  fetchStarterQuestions,
  pdfUrl,
  recordAssetView,
  sendMessage,
  type ApiAsset,
  type ApiMessage,
  type SessionPayload,
} from "@/lib/api";
import { fmtDate } from "@/lib/datetime";
import { useModalA11y } from "@/lib/modalA11y";
import { siteUrl } from "@/lib/siteUrl";
import type { LinkStatus, RichBlock, SourceRef } from "@/types/domain";

// ── 공용 헬퍼 ─────────────────────────────────────────
// 만료기간 폐기 → 링크 상태로만 사용 가능 여부 판단. blocked=true 면 질문/전송 차단.
function statusText(status: LinkStatus): { text: string; blocked: boolean } {
  if (status === "disabled") return { text: "비활성화된 링크", blocked: true };
  if (status === "revoked") return { text: "무효화된 링크", blocked: true };
  return { text: "유효한 링크", blocked: false };
}

function sourceLabel(s: SourceRef): string {
  const base = `${fmtDate(s.frozenAt)} 기준 · ${s.assetTitle}`;
  return s.page ? `${base} ${s.page}p 근거` : base;
}

// role="button" 요소용 키보드 활성화 (Enter/Space)
function keyActivate(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

// 외부 링크 렌더 안전장치 — http/https 만 허용(javascript:/data:/앵커 차단).
function safeHref(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

// AI 답변 경량 마크다운(문단/"- " 불릿/**굵게**) → React 노드. HTML 문자열 주입 경로 없음(사이클9 개선8).
function renderBold(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={`${keyBase}-${i}`}>{part}</b> : part));
}
function renderRich(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    out.push(
      <ul className="md-ul" key={`ul-${out.length}`}>
        {bullets.map((li, i) => (
          <li key={i}>{renderBold(li, `li-${out.length}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  text.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (/^[-•]\s+/.test(t)) {
      bullets.push(t.replace(/^[-•]\s+/, ""));
      return;
    }
    flush();
    if (t) out.push(<p className="md-p" key={`p-${i}`}>{renderBold(line, `p-${i}`)}</p>);
  });
  flush();
  return out;
}

function thumbBg(asset?: ApiAsset): string {
  return asset?.gradient || "linear-gradient(135deg,#1E293B,#2F6BFF)";
}

// page = 답변에 인용된 PDF 페이지(카드#006). 뷰어도 같은 페이지 이미지를 크게 띄운다.
type Active = { id: string; url?: string; page?: number | null } | null;

// ── 로딩/게이트/에러 공용 브랜드 셸 ───────────────────
export function SessionScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="candour-scr">
      <div className="topbar">
        {/* 로고=홈(카드#019 7). 네이티브 <a> — <Link> 의 <a> 에는 스코프 해시가 안 붙어 .logo 가 죽는다. */}
        <a className="logo" href="/">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </a>
      </div>
      <div className="scr-body">{children}</div>
      <style jsx global>{screenStyles}</style>
    </div>
  );
}

// ── 이력서 대화 워크스페이스(sessions/resume 공용) ────
export function ChatWorkspace({ initial }: { initial: SessionPayload }) {
  const conversationId = initial.conversation.id;
  const { link, profile } = initial;

  const assetsById = useMemo(
    () => Object.fromEntries(initial.assets.map((a) => [a.id, a])),
    [initial.assets],
  );

  const [messages, setMessages] = useState<ApiMessage[]>(initial.messages);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(link.status);
  const [active, setActive] = useState<Active>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false); // 프로필 사진 라이트박스(카드#002 B)
  // PDF 내장 뷰어가 실패한 자료 id — 그 자료만 기존 썸네일 UI 로 폴백한다(카드#016 4).
  const [pdfFailedId, setPdfFailedId] = useState<string | null>(null);
  // 첫 진입 추천 질문(카드#030) — 빈 대화일 때만 서버에서 받아온다. 첫 질문을 보내면 후속 추천으로 넘어간다.
  const [starters, setStarters] = useState<string[]>([]);

  const dlBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const avBtnRef = useRef<HTMLButtonElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const linkState = statusText(linkStatus);
  const blocked = linkState.blocked;
  // 근거 썸네일(사이클10) — hasThumb 인 자료만 URL 생성(없으면 undefined → 그라디언트 폴백).
  // page 를 주면 인용된 그 PDF 페이지(카드#006) — 서버가 실패 시 자료 단위 썸네일로 폴백한다.
  const thumbOf = (id: string, page?: number | null): string | undefined =>
    assetsById[id]?.hasThumb
      ? conversationAssetThumbUrl(conversationId, id, initial.conversation.resumeToken, page)
      : undefined;
  const photoSrc = conversationProfilePhotoUrl(conversationId, initial.conversation.resumeToken);
  const preview = active ? assetsById[active.id] : undefined;
  const previewThumb = preview ? thumbOf(preview.id, active?.page) : undefined;
  const previewHref = safeHref(active?.url);
  // 업로드 원본 파일 URL(대화 스코프 인가) — 시드 목업(hasFile=false)은 버튼 비활성 유지(사이클9).
  const previewFileHref = preview?.hasFile
    ? conversationAssetFileUrl(conversationId, preview.id, initial.conversation.resumeToken)
    : undefined;
  const previewDownloadHref = preview?.hasFile
    ? conversationAssetFileUrl(conversationId, preview.id, initial.conversation.resumeToken, true)
    : undefined;
  // 원본 파일이 있는 PDF 만 내장 뷰어로 연다. 시드 목업(hasFile=false)·폴백된 자료는 기존 썸네일.
  const pdfMode =
    !!preview &&
    preview.viewerKind === "pdf" &&
    !!previewFileHref &&
    pdfFailedId !== preview.id;
  // PdfViewer 의 effect 의존성 — 매 렌더 새 함수를 넘기면 문서를 다시 fetch 한다.
  const onPdfFail = useCallback(() => setPdfFailedId(active?.id ?? null), [active?.id]);

  // 새 메시지/타이핑 시 하단으로 스크롤
  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [messages, sending]);

  // 첫 진입 추천 질문(카드#030) — 대화가 비어 있을 때만 마운트 시 1회. 서버가 프로필 기반으로 생성·캐시한다.
  // 실패는 무시(빈 배열) — 칩이 없는 것은 장애가 아니라서 화면에 오류를 띄우지 않는다.
  useEffect(() => {
    if (initial.messages.length || blocked) return;
    fetchStarterQuestions(conversationId, initial.conversation.resumeToken)
      .then((r) => setStarters(r.questions))
      .catch(() => {});
  }, [conversationId, initial.conversation.resumeToken, initial.messages.length, blocked]);

  // 모달 접근성: 포커스 이동 + Tab 트랩 + ESC, 닫으면 트리거로 복귀
  useModalA11y(modalOpen, () => setModalOpen(false), modalRef, dlBtnRef);
  useModalA11y(photoOpen, () => setPhotoOpen(false), lightboxRef, avBtnRef);

  const openAsset = (assetId: string, url?: string, page?: number | null) => {
    setActive({ id: assetId, url, page });
    // 열람 기록은 부수효과 — 실패해도 뷰어는 열림.
    recordAssetView(conversationId, assetId).catch(() => {});
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || blocked) return;
    setDraft("");
    setSendError(null);
    setSending(true);
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ApiMessage = {
      id: tempId,
      conversationId,
      role: "hr",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await sendMessage(conversationId, text);
      setMessages((prev) => prev.filter((m) => m.id !== tempId).concat(res.messages));
      // 이 요청에서 악용 임계 초과로 서버가 링크를 disabled 처리했을 수 있음 → 응답의 최신 status 즉시 반영
      // (다음 410 을 기다리지 않고 배지·입력 잠금 갱신). QA MEDIUM.
      setLinkStatus(res.link.status);
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (e instanceof ApiError && e.status === 410) {
        setLinkStatus("disabled"); // 대화 중 자동 비활성화(악용 임계 초과 등) — 서버 강제
        setSendError("링크가 비활성화되어 더 이상 질문할 수 없습니다.");
      } else {
        setDraft(text); // 재시도할 수 있게 입력 복원
        setSendError(e instanceof ApiError ? e.message : "전송에 실패했습니다.");
      }
    } finally {
      setSending(false);
    }
  };

  const copyResumeLink = async () => {
    const url = siteUrl(`/r/${initial.conversation.resumeToken}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("이 링크를 복사하세요", url);
    }
  };

  return (
    <div className="hrpage">
      {/* 1024px 미만 미지원 */}
      <div className="unsupported">
        <div className="uic">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="13" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <h2>데스크톱에서 이용해 주세요</h2>
        <p>
          인사담당자 화면은 1024px 이상의 화면에 최적화되어 있습니다. 데스크톱
          또는 넓은 화면에서 접속해 주세요.
        </p>
      </div>

      <div className="topbar">
        {/* 로고=홈(카드#019 7). 네이티브 <a> — <Link> 의 <a> 에는 스코프 해시가 안 붙어 .logo 가 죽는다. */}
        <a className="logo" href="/">
          <span className="mark">
            <Prism />
          </span>{" "}
          Candour
        </a>
        <div className="env">
          {link.companyName && <span className="co">{link.companyName}</span>}
          <span className={"expiry" + (linkState.blocked ? " exp" : "")}>
            {linkState.text}
          </span>
        </div>
      </div>

      <div className="three">
        {/* LEFT: 지원자 정보 */}
        <aside className="pl">
          {/* 사진이 있을 때만 클릭 확대(카드#002 B) — 이니셜 아바타는 확대할 것이 없어 버튼이 아니다. */}
          {/* 이름 폴백은 전부 `||` — 가입 시 빈 문자열이라 `??` 로는 안 걸린다(카드#019 2). */}
          {profile?.hasPhoto ? (
            <button
              ref={avBtnRef}
              type="button"
              className="av avbtn"
              aria-haspopup="dialog"
              aria-label={`${profile?.displayName || "지원자"} 프로필 사진 크게 보기`}
              onClick={() => setPhotoOpen(true)}
            >
              {/* 대화 스코프 인가가 걸린 동적 이미지 — next/image 옵티마이저 경유 불가(쿠키/토큰 미전달). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="avimg"
                src={photoSrc}
                alt={`${profile?.displayName || "지원자"} 프로필 사진`}
                width={66}
                height={66}
              />
              <span className="avhint">크게 보기</span>
            </button>
          ) : (
            <div className="av">{profile?.displayName?.slice(0, 1) || "?"}</div>
          )}
          <div>
            <div className="nm">{profile?.displayName || "지원자"}</div>
            <div className="hl">{profile?.headline}</div>
          </div>
          <span className="badge-link">사실·중립 AI 대변인</span>
          <div className="lbl">핵심 요약</div>
          <div className="summary">{profile?.summary}</div>
          <div className="lbl">기본 정보</div>
          <div className="facts">
            <div className="row">
              <span className="k">나이</span>
              <span className="v">{profile?.age != null ? `${profile.age}세` : "-"}</span>
            </div>
            {profile?.email && (
              <div className="row">
                <span className="k">이메일</span>
                <span className="v vwrap">{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="row">
                <span className="k">휴대폰</span>
                <span className="v">{profile.phone}</span>
              </div>
            )}
            <div className="row">
              <span className="k">학력</span>
              <span className="v">{profile?.education}</span>
            </div>
            {profile?.career && (
              <div className="row">
                <span className="k">경력</span>
                <span className="v vpre">{profile.career}</span>
              </div>
            )}
            <div className="row">
              <span className="k">자격증</span>
              <span className="v">
                {profile?.certifications?.map((c, i) => (
                  <div key={`${i}-${c}`}>{c}</div>
                ))}
              </span>
            </div>
          </div>
          <div className="lbl">핵심 역량</div>
          <div className="chips">
            {profile?.skills?.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <button
            ref={dlBtnRef}
            type="button"
            className="dl-btn"
            aria-haspopup="dialog"
            onClick={() => setModalOpen(true)}
          >
            {/* width/height 를 속성으로 명시 — styled-jsx 외부상수(hrStyles)에서 :global(svg) 크기 규칙이
                누락돼도 아이콘이 팽창하지 않도록(CSS 의존 제거). */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
            </svg>
            이력서 PDF 다운로드
          </button>
          <button type="button" className="share-btn" onClick={copyResumeLink}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7a8496" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
            </svg>
            {copied ? "링크가 복사되었습니다" : "대화 다시 열기 링크 복사"}
          </button>
        </aside>

        {/* CENTER: 채팅 */}
        <section className="pc">
          <div className="head">
            {/* .head 는 gap 이 걸린 flex — 붙어야 할 표현은 래퍼로 묶어 익명 flex item 을 만들지 않는다 */}
            <span className="hlabel">
              <b>AI 대변인</b>과의 대화
            </span>
            <span className="live">
              <i />
              실시간
            </span>
          </div>
          <div className="body" ref={bodyRef}>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                m={m}
                activeId={active?.id ?? null}
                assetsById={assetsById}
                thumbOf={thumbOf}
                onOpen={openAsset}
              />
            ))}
            {sending && (
              <div className="msg ai">
                <div className="who">AI 대변인</div>
                <div className="bub typing" aria-label="AI가 답변을 작성 중입니다">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            {(() => {
              // 질문 추천 칩 — 소스는 둘, UI·클릭 동작(입력 채움 + 포커스)은 하나다.
              //  · 대화가 비어 있으면 프로필 기반 첫 진입 추천(카드#030)
              //  · 그 외에는 마지막 AI 답변에 붙은 후속 추천(사이클9)
              const empty = messages.length === 0;
              const last = messages[messages.length - 1];
              const sug = sending || blocked
                ? null
                : empty
                  ? starters.length ? starters : null
                  : last?.role === "ai" && last.suggestions?.length
                    ? last.suggestions
                    : null;
              if (!sug) return null;
              return (
                <>
                  {/* 빈 화면에서 칩만 덩그러니 뜨지 않게 한 줄 안내(.who = 대화 본문의 작은 라벨 스타일 재사용) */}
                  {empty && <div className="who">이런 질문으로 시작해보세요.</div>}
                  <div className="suggests" aria-label="추천 질문">
                    {sug.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="sug"
                        onClick={() => {
                          setDraft(q);
                          inputRef.current?.focus();
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
          {sendError && <div className="send-err">{sendError}</div>}
          <form
            className="input"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              className="box"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                blocked
                  ? "사용할 수 없는 링크입니다"
                  : "지원자에게 궁금한 점을 입력하세요…"
              }
              disabled={sending || blocked}
              aria-label="질문 입력"
            />
            <button
              className="send"
              type="submit"
              disabled={sending || blocked || !draft.trim()}
              aria-label="질문 전송"
            >
              ↑
            </button>
          </form>
        </section>

        {/* RIGHT: 자료 뷰어 */}
        <aside className="pr">
          <div className="head">
            자료 뷰어{" "}
            <span className="k">
              {preview
                ? preview.kind === "video"
                  ? "영상"
                  : preview.viewerKind.toUpperCase()
                : "채팅의 자료를 클릭"}
            </span>
          </div>
          <div className={"viewer" + (pdfMode ? " pdfmode" : "")}>
            {!preview ? (
              <div className="v-empty">
                <div className="ic">⤢</div>
                <div>
                  채팅에서 AI가 제공한
                  <br />
                  이미지·파일·링크를 클릭하면
                  <br />
                  여기서 크게 볼 수 있습니다.
                </div>
              </div>
            ) : (
              <div className={"v-card" + (pdfMode ? " pdfcard" : "")}>
                {pdfMode ? (
                  // 자료가 바뀌면 새로 마운트 — 이전 문서의 렌더 상태가 남지 않게.
                  <PdfViewer
                    key={preview.id}
                    fileUrl={previewFileHref as string}
                    citePage={active?.page ?? null}
                    onFail={onPdfFail}
                  />
                ) : (
                  <div
                    className={
                      "v-big" +
                      (preview.viewerKind === "pdf" ? " pdf" : "") +
                      (previewThumb ? " hasimg" : "")
                    }
                    style={
                      preview.viewerKind === "pdf" || previewThumb
                        ? undefined
                        : { background: thumbBg(preview) }
                    }
                  >
                    {previewThumb ? (
                      // 대화 스코프 인가가 걸린 동적 이미지 — next/image 옵티마이저 경유 불가.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="vimg" src={previewThumb} alt={`${preview.title} 썸네일`} />
                    ) : preview.viewerKind === "pdf" ? (
                      <div className="page">{preview.big}</div>
                    ) : (
                      <div style={{ textAlign: "center" }}>{preview.big}</div>
                    )}
                  </div>
                )}
                <div className="v-body">
                  <div className="vt">{preview.title}</div>
                  <div className="vs">{preview.sub}</div>
                  <div className="v-meta">
                    <span className="src-badge">
                      <span className="dot" />
                      근거 자료
                    </span>
                  </div>
                  <div className="v-actions">
                    {previewHref || previewFileHref ? (
                      <a
                        className="b primary"
                        href={previewHref ?? previewFileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {preview.kind === "video" ? "영상 열기" : "원본 열기"}
                      </a>
                    ) : (
                      <button type="button" className="b primary" disabled>
                        원본 열기
                      </button>
                    )}
                    {previewDownloadHref ? (
                      <a className="b" href={previewDownloadHref}>
                        다운로드
                      </a>
                    ) : (
                      <button type="button" className="b" disabled>
                        다운로드
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* PDF 다운로드 확인 모달 */}
      {modalOpen && (
        <div
          className="overlay on"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dlModalTitle"
            ref={modalRef}
          >
            <div className="m-ic">↓</div>
            <h3 id="dlModalTitle">이력서를 다운로드할까요?</h3>
            {/* 실제로 일어나는 일 그대로 — 다운로드 사실이 지원자의 대화 화면에 횟수·시각으로
                남는다(카드#027 A). 알림톡·푸시 실발송은 아직 없으므로 "전송"이라고 쓰지 않는다. */}
            <p>
              다운로드하면 <span className="em">지원자에게 다운로드 사실이 표시</span>
              됩니다. 계속하시겠습니까?
            </p>
            <div className="m-actions">
              <button className="no" onClick={() => setModalOpen(false)}>
                아니요
              </button>
              <a
                className="yes"
                href={pdfUrl(conversationId)}
                download
                onClick={() => setModalOpen(false)}
              >
                예, 다운로드
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 사진 라이트박스(카드#002 B) — 서버가 512² jpeg 로 정규화 저장하므로 그 이상 확대하지 않는다. */}
      {photoOpen && (
        <div
          className="overlay on"
          onClick={(e) => e.target === e.currentTarget && setPhotoOpen(false)}
        >
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="프로필 사진 크게 보기"
            ref={lightboxRef}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="lbimg"
              src={photoSrc}
              alt={`${profile?.displayName || "지원자"} 프로필 사진`}
              width={512}
              height={512}
            />
            <button type="button" className="lbx" aria-label="닫기" onClick={() => setPhotoOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0e1524" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{hrStyles}</style>
    </div>
  );
}

function ChatMessage({
  m,
  activeId,
  assetsById,
  thumbOf,
  onOpen,
}: {
  m: ApiMessage;
  activeId: string | null;
  assetsById: Record<string, ApiAsset>;
  thumbOf: (id: string, page?: number | null) => string | undefined;
  onOpen: (id: string, url?: string, page?: number | null) => void;
}) {
  if (m.role === "hr") {
    return (
      <div className="msg hr">
        <div className="bub">{m.text}</div>
      </div>
    );
  }
  const bubClass =
    "bub" +
    (m.answerKind === "blocked" ? " blocked" : "") +
    (m.answerKind === "no_info" ? " noinfo" : "");
  // 근거 시각화(카드#006) — 인용된 그 페이지 썸네일. assetId 가 없는 과거 동결 sources 는
  // undefined → 기존처럼 텍스트 배지만 뜬다(하위호환).
  const src = m.sources?.[0];
  const srcThumb = src?.assetId ? thumbOf(src.assetId, src.page) : undefined;
  return (
    <div className="msg ai">
      <div className="who">AI 대변인</div>
      <div className={bubClass}>
        {m.answerKind === "blocked" && <span className="tag-refuse">응답 거절</span>}
        {renderRich(m.text)}
        {m.blocks && m.blocks.length > 0 && (
          <div className="rich">
            {m.blocks.map((b, i) => (
              <RichAsset
                key={i}
                b={b}
                activeId={activeId}
                assetsById={assetsById}
                thumbOf={thumbOf}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
        {src && (
          <div className="meta">
            {srcThumb && (
              <button
                type="button"
                className="srcthumb"
                onClick={() => onOpen(src.assetId!, undefined, src.page)}
                aria-label={`${src.assetTitle}${src.page ? ` ${src.page}페이지` : ""} 근거 크게 보기`}
              >
                {/* 대화 스코프 인가가 걸린 동적 이미지 — next/image 옵티마이저 경유 불가. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={srcThumb} alt="" />
                {src.page ? <span className="pg">{src.page}p</span> : null}
              </button>
            )}
            <span className="src-badge">
              <span className="dot" />
              {sourceLabel(src)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function RichAsset({
  b,
  activeId,
  assetsById,
  thumbOf,
  onOpen,
}: {
  b: RichBlock;
  activeId: string | null;
  assetsById: Record<string, ApiAsset>;
  thumbOf: (id: string, page?: number | null) => string | undefined;
  onOpen: (id: string, url?: string, page?: number | null) => void;
}) {
  if (b.type === "image") {
    const on = activeId === b.assetId;
    const t = thumbOf(b.assetId);
    return (
      <div
        className={"asset thumb" + (on ? " active" : "")}
        style={{ background: thumbBg(assetsById[b.assetId]) }}
        role="button"
        tabIndex={0}
        aria-label={`${b.caption ?? "이미지"} 자료 크게 보기`}
        onClick={() => onOpen(b.assetId, b.url)}
        onKeyDown={keyActivate(() => onOpen(b.assetId, b.url))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {t && <img className="timg" src={t} alt="" />}
        <span className="cap">{b.caption}</span>
        <span className="zoom">⤢ 크게 보기</span>
      </div>
    );
  }
  if (b.type === "file") {
    const on = activeId === b.assetId;
    const t = thumbOf(b.assetId);
    return (
      <div
        className={"asset filecard" + (on ? " active" : "")}
        role="button"
        tabIndex={0}
        aria-label={`${b.title} 자료 크게 보기`}
        onClick={() => onOpen(b.assetId, b.url)}
        onKeyDown={keyActivate(() => onOpen(b.assetId, b.url))}
      >
        {t ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="fi-thumb" src={t} alt="" />
        ) : (
          <span className="fi">PDF</span>
        )}
        <div>
          {b.title}
          <small>{assetsById[b.assetId]?.sub ?? "파일"}</small>
        </div>
      </div>
    );
  }
  if (b.type === "link") {
    const id = b.assetId;
    const on = !!id && activeId === id;
    const t = id ? thumbOf(id) : undefined;
    // 영상 자료(카드#009 D) — viewerKind 는 'link' 라 kind 로 판별. 썸네일 위/아이콘 자리에 ▶ 표식.
    const isVideo = !!id && assetsById[id]?.kind === "video";
    return (
      <div
        className={"asset linkcard" + (on ? " active" : "")}
        role="button"
        tabIndex={0}
        aria-label={`${b.title} ${isVideo ? "영상" : "자료"} 크게 보기`}
        onClick={() => id && onOpen(id, b.url)}
        onKeyDown={keyActivate(() => id && onOpen(id, b.url))}
      >
        {t ? (
          <span className="fi-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="fi-thumb" src={t} alt="" />
            {isVideo && (
              <span className="fi-play" aria-hidden="true">
                <IconPlay width={20} height={20} />
              </span>
            )}
          </span>
        ) : (
          <span className="fi">{isVideo ? <IconPlay width={18} height={18} /> : "↗"}</span>
        )}
        <div>
          {b.title}
          <small>{id ? assetsById[id]?.sub : ""}</small>
        </div>
      </div>
    );
  }
  // text 블록 등은 렌더 대상 아님
  return null;
}

const hrStyles = `
  .hrpage { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg2); color: var(--ink); }
  h1,h2,h3{letter-spacing:-.02em;font-weight:800}
  .topbar{height:56px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;padding:0 20px;flex:0 0 auto;z-index:10}
  .logo{font-weight:800;font-size:17px;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px;letter-spacing:-.02em}
  .logo .mark{width:26px;height:26px;border-radius:7px;background:var(--ink);color:#fff;display:grid;place-items:center}
  .logo .mark :global(svg){width:18px;height:18px}
  .logo:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:6px}
  .env{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted)}
  .env .co{background:var(--blue-t);color:var(--blue-d);border-radius:8px;padding:4px 9px;font-weight:700;font-size:11.5px}
  .expiry{font-weight:600;color:var(--ink2)}
  .expiry.exp{color:var(--danger)}
  /* 좌우 패널 모두 넓은 화면에서만 늘어난다 — 좌측 지원자 정보는 280~380px(26vw), 우측 자료는 PDF
     원본이 들어가 넓을수록 읽기 쉬워 380~460px(30vw). 최소폭(1024px)에선 각각 하한(280/380px)에
     걸려 가운데 대화 칸이 눌리지 않는다(26vw=266px < 280px 이라 1024px 레이아웃은 종전과 동일). */
  .three{flex:1;min-height:0;display:grid;grid-template-columns:clamp(280px,26vw,380px) 1fr clamp(380px,30vw,460px);grid-template-rows:minmax(0,1fr)}
  .pl{background:#fff;border-right:1px solid var(--line);padding:22px 18px;display:flex;flex-direction:column;gap:15px;overflow:auto;min-height:0}
  /* 낮은 높이에서 flex 자식이 압축돼 .facts(overflow:hidden) 가 얇은 선으로 붕괴하던 버그 방지 —
     자식은 natural 높이를 유지하고, 초과분은 .pl 의 overflow:auto 로 스크롤한다. */
  .pl>*{flex-shrink:0}
  .pl .av{width:66px;height:66px;border-radius:16px;background:var(--blue);color:#fff;display:grid;place-items:center;font-size:27px;font-weight:800;overflow:hidden}
  .avimg{width:100%;height:100%;object-fit:cover;display:block}
  /* 사진 아바타는 확대 트리거(button) — 기본 버튼 스타일 제거하고 .av 박스만 유지 */
  .pl .avbtn{border:none;padding:0;font-family:var(--sans);cursor:zoom-in;position:relative;display:block}
  .avhint{position:absolute;inset:auto 0 0 0;background:rgba(14,21,36,.62);color:#fff;font-size:9.5px;font-weight:700;padding:3px 0;text-align:center;opacity:0;transition:var(--t)}
  .pl .avbtn:hover .avhint,.pl .avbtn:focus-visible .avhint{opacity:1}
  .pl .avbtn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .vwrap{word-break:break-all}
  .vpre{white-space:pre-line} /* 경력은 여러 줄 입력(textarea) — 줄바꿈 보존 */
  .pl .nm{font-size:20px;font-weight:800}.pl .hl{font-size:13px;color:var(--muted);margin-top:2px}
  .badge-link{display:inline-flex;align-items:center;gap:6px;background:var(--blue-t);color:var(--blue-d);border-radius:8px;padding:6px 10px;font-size:11.5px;font-weight:700;width:fit-content}
  .lbl{font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-top:6px}
  .summary{font-size:13px;color:var(--ink2);line-height:1.6}
  .facts{display:flex;flex-direction:column;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:11px;overflow:hidden}
  .facts .row{display:flex;gap:10px;background:#fff;padding:10px 12px;font-size:13px}
  .facts .row .k{color:var(--muted);width:52px;flex:0 0 auto}
  .facts .row .v{color:var(--ink);font-weight:600}
  .chips{display:flex;flex-wrap:wrap;gap:6px}
  .chips span{background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:5px 10px;font-size:12px;color:var(--ink2);transition:var(--t)}
  .chips span:hover{border-color:var(--blue);color:var(--blue-d)}
  .dl-btn{margin-top:6px;width:100%;border:1px solid var(--line2);background:#fff;color:var(--ink);border-radius:11px;padding:12px;font-family:var(--sans);font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:var(--t)}
  .dl-btn :global(svg){width:16px;height:16px;stroke:var(--blue);flex:0 0 auto;fill:none}
  .dl-btn:hover{border-color:var(--blue);color:var(--blue-d);transform:translateY(-2px);box-shadow:0 8px 20px rgba(47,107,255,.14)}
  .dl-btn:hover :global(svg){stroke:var(--blue-d)}
  .share-btn{width:100%;border:1px dashed var(--line2);background:var(--bg2);color:var(--ink2);border-radius:11px;padding:11px;font-family:var(--sans);font-size:12.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:var(--t)}
  .share-btn :global(svg){width:15px;height:15px;stroke:var(--muted);flex:0 0 auto;fill:none}
  .share-btn:hover{border-color:var(--blue);color:var(--blue-d);background:var(--blue-t)}
  .share-btn:hover :global(svg){stroke:var(--blue-d)}
  .pc{display:flex;flex-direction:column;min-width:0;min-height:0;background:#fff}
  .pc .head{padding:14px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--muted)}
  .pc .head b{color:var(--ink)}
  .pc .head .live{margin-left:auto;display:inline-flex;align-items:center;gap:6px;color:var(--ok);font-weight:600;font-size:12px}
  .pc .head .live i{width:7px;height:7px;border-radius:50%;background:var(--ok);animation:pulse2 1.6s infinite}
  @keyframes pulse2{50%{opacity:.3}}
  .body{flex:1;min-height:0;padding:22px 20px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;background:linear-gradient(180deg,#fff,#fcfdff)}
  .msg{max-width:88%;animation:rise .5s cubic-bezier(.2,.7,.3,1) both}
  @keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){.msg{animation:none}}
  .msg.hr{align-self:flex-end}
  .who{font-size:11px;color:var(--muted);margin:0 4px 6px;font-weight:600}
  .bub{border-radius:14px;padding:12px 15px;font-size:14.5px}
  .msg.hr .bub{background:var(--blue);color:#fff;border-bottom-right-radius:4px}
  .msg.ai .bub{background:#fff;border:1px solid var(--line);border-bottom-left-radius:4px;box-shadow:0 3px 10px rgba(14,21,36,.04)}
  .bub.typing{display:inline-flex;gap:5px;align-items:center}
  .bub.typing span{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:blink 1.2s infinite}
  .bub.typing span:nth-child(2){animation-delay:.2s}
  .bub.typing span:nth-child(3){animation-delay:.4s}
  @keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
  .rich{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
  .asset{cursor:pointer;transition:transform var(--t);border-radius:10px}
  .asset:hover{transform:translateY(-3px)}
  .asset.active{outline:2px solid var(--blue);outline-offset:2px}
  .thumb{width:104px;height:74px;border-radius:10px;position:relative;overflow:hidden;border:1px solid var(--line)}
  .timg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .fi-thumb{width:32px;height:32px;border-radius:8px;object-fit:cover;display:block;flex:0 0 auto;border:1px solid var(--line)}
  /* 영상 자료(카드#009 D) — 썸네일 위 ▶ 표식. 썸네일이 없으면 .fi 자리에 아이콘만 들어간다. */
  .fi-wrap{position:relative;flex:0 0 auto;line-height:0}
  .fi-play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(14,21,36,.42);border-radius:8px}
  .thumb .cap{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);color:#fff;font-size:9.5px;padding:3px 6px}
  .thumb .zoom{position:absolute;inset:0;display:grid;place-items:center;color:#fff;opacity:0;background:rgba(0,0,0,.28);transition:var(--t);font-size:13px;font-weight:700}
  .asset:hover .zoom{opacity:1}
  .filecard,.linkcard{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:12.5px;font-weight:600}
  .filecard:hover,.linkcard:hover{border-color:var(--blue)}
  .filecard small,.linkcard small{color:var(--muted);display:block;font-size:11px;font-weight:400}
  .filecard .fi{width:32px;height:32px;border-radius:8px;background:var(--danger);color:#fff;display:grid;place-items:center;font-size:10px;font-weight:700}
  .linkcard .fi{width:32px;height:32px;border-radius:8px;background:var(--blue);color:#fff;display:grid;place-items:center}
  .meta{display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap}
  .src-badge{display:inline-flex;align-items:center;gap:7px;background:var(--blue-t);border:1px solid #d6e2ff;color:var(--blue-d);border-radius:8px;padding:5px 10px;font-size:11.5px;font-weight:600}
  .src-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--blue)}
  /* 인용 페이지 썸네일(카드#006) — .meta 가 flex-wrap 이라 width:100% 로 자체 행을 차지하고
     출처 배지가 그 아래로 떨어진다. 클릭하면 우측 뷰어에서 같은 페이지를 크게 본다. */
  .srcthumb{width:100%;display:block;position:relative;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--bg2);cursor:pointer;transition:var(--t)}
  .srcthumb:hover{border-color:var(--blue)}
  .srcthumb:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .srcthumb img{display:block;width:100%;max-height:210px;object-fit:cover;object-position:top}
  .srcthumb .pg{position:absolute;top:8px;left:8px;background:rgba(14,21,36,.72);color:#fff;border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700}
  .bub .md-p{margin:0}
  .bub .md-p+.md-p{margin-top:7px}
  .bub .md-ul{margin:7px 0 2px;padding-left:19px;display:flex;flex-direction:column;gap:4px}
  .bub .md-ul li{font-size:14px}
  .bub b{font-weight:700}
  .suggests{display:flex;flex-wrap:wrap;gap:8px;max-width:88%;margin-top:-6px}
  .sug{border:1px solid var(--line2);background:#fff;color:var(--ink2);border-radius:999px;padding:8px 14px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:var(--t);text-align:left}
  .sug:hover{border-color:var(--blue);color:var(--blue-d);background:var(--blue-t)}
  .sug:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .bub.blocked{background:#FEF1F1;border:1px solid #F6D5D6;color:#C0343A}
  .bub.noinfo{background:#FFF8EC;border:1px dashed #F0D599;color:#8A6100}
  .tag-refuse{display:inline-block;font-size:10.5px;color:var(--danger);font-weight:700;letter-spacing:.05em;margin-bottom:5px}
  .send-err{padding:8px 20px 0;color:var(--danger);font-size:12.5px;font-weight:600}
  .input{border-top:1px solid var(--line);padding:14px 16px;display:flex;gap:10px;align-items:center}
  .input .box{flex:1;border:1px solid var(--line2);border-radius:11px;padding:13px 15px;color:var(--ink);font-size:13.5px;background:#fff;transition:var(--t);font-family:inherit}
  .input .box::placeholder{color:var(--muted)}
  .input .box:hover:not(:disabled){border-color:var(--blue)}
  .input .box:focus{border-color:var(--blue);outline:none;box-shadow:0 0 0 3px var(--blue-t)}
  .input .box:disabled{background:var(--bg2);color:var(--muted);cursor:not-allowed}
  .input .send{width:46px;height:46px;flex:0 0 auto;border-radius:11px;background:var(--blue);color:#fff;border:none;font-size:18px;cursor:pointer;transition:var(--t);display:grid;place-items:center}
  .input .send:hover:not(:disabled){background:var(--blue-d);transform:translateY(-2px)}
  .input .send:disabled{opacity:.45;cursor:not-allowed}
  .pr{border-left:1px solid var(--line);background:var(--bg2);display:flex;flex-direction:column;min-width:0;min-height:0}
  .pr .head{padding:14px 18px;border-bottom:1px solid var(--line);font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px}
  .pr .head .k{margin-left:auto;font-size:11px;font-weight:600;color:var(--muted)}
  .viewer{flex:1;padding:18px;overflow:auto}
  /* PDF 내장 뷰어(카드#016 4): 패널 높이를 그대로 쓰고 스크롤은 페이지 목록이 갖는다.
     min-height:0 이 없으면 flex 자식이 내용 높이만큼 밀려 툴바·정보가 패널 밖으로 나간다. */
  .viewer.pdfmode{padding:0;overflow:hidden;display:flex;flex-direction:column;min-height:0}
  .v-card.pdfcard{flex:1;min-height:0;display:flex;flex-direction:column;border:none;border-radius:0;animation:none;background:var(--bg2)}
  .v-card.pdfcard .v-body{flex:0 0 auto;background:#fff;border-top:1px solid var(--line)}
  .v-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--muted);text-align:center;font-size:13px}
  .v-empty .ic{width:52px;height:52px;border-radius:14px;background:#fff;border:1px solid var(--line);display:grid;place-items:center;font-size:22px;color:var(--blue)}
  .v-card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;animation:rise .4s both}
  .v-big{height:240px;display:grid;place-items:center;color:#fff;font-size:13px;padding:18px}
  .v-big.pdf{background:#fff;color:var(--ink)}
  .v-big.hasimg{padding:0;background:var(--bg2);overflow:hidden}
  /* height:100% 는 grid 아이템(place-items:center)에선 참조 높이가 없어 무시된다 — 세로로 긴
     PDF 페이지 썸네일이 240px 를 넘어 .v-body(제목·버튼)를 덮었다(카드#006 실측 483px).
     align-self:stretch 로 grid area 높이를 채우게 하고 contain 이 안에서 축소하게 한다. */
  .vimg{width:100%;align-self:stretch;object-fit:contain;display:block;min-height:0}
  .v-big.pdf .page{width:156px;height:206px;background:#fff;border:1px solid var(--line2);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:12px;font-size:8px;color:#8892a4;line-height:1.5;overflow:hidden;white-space:pre-wrap}
  .v-body{padding:14px 16px}
  .v-body .vt{font-size:15px;font-weight:800;margin-bottom:4px}
  .v-body .vs{font-size:12px;color:var(--muted)}
  .v-meta{display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap}
  .v-actions{display:flex;gap:8px;margin-top:14px}
  .v-actions .b{flex:1;text-align:center;border:1px solid var(--line2);border-radius:9px;padding:9px;font-size:12.5px;font-weight:700;cursor:pointer;transition:var(--t);font-family:inherit;background:#fff;color:var(--ink);text-decoration:none}
  .v-actions .b:focus-visible,.asset:focus-visible,.dl-btn:focus-visible,.share-btn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .v-actions .b.primary{background:var(--blue);color:#fff;border-color:var(--blue)}
  .v-actions a.b:hover{transform:translateY(-2px)}
  .v-actions .b:disabled{opacity:.5;cursor:not-allowed}
  .overlay{position:fixed;inset:0;background:rgba(14,21,36,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:100}
  .modal{background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(14,21,36,.35);width:min(420px,92vw);padding:26px;animation:pop .22s cubic-bezier(.2,.7,.3,1)}
  @keyframes pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  /* 프로필 사진 라이트박스(B1 미니멀 다크) — 원본이 512² 라 그 이상 키우지 않는다(min 으로 뷰포트 제한만). */
  .lightbox{position:relative;animation:pop .22s cubic-bezier(.2,.7,.3,1)}
  .lbimg{width:min(512px,80vw,80vh);height:auto;aspect-ratio:1;object-fit:cover;border-radius:16px;display:block;box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .lbx{position:absolute;top:-14px;right:-14px;width:34px;height:34px;border-radius:50%;background:#fff;border:none;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  .lbx:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .m-ic{width:48px;height:48px;border-radius:13px;background:var(--blue-t);color:var(--blue-d);display:grid;place-items:center;font-size:22px;font-weight:800;margin-bottom:16px}
  .modal h3{font-size:19px;margin-bottom:10px}
  /* keep-all — 안 주면 "계속하시겠/습니까?" 처럼 단어 중간에서 끊긴다(한글 기본 줄바꿈). */
  .modal p{font-size:14px;color:var(--ink2);line-height:1.6;word-break:keep-all}
  .modal p .em{color:var(--blue-d);font-weight:700}
  .m-actions{display:flex;gap:10px;margin-top:22px}
  .m-actions button,.m-actions a{flex:1;border-radius:11px;padding:13px;font-family:var(--sans);font-size:14.5px;font-weight:700;cursor:pointer;transition:var(--t);text-align:center;text-decoration:none;display:grid;place-items:center}
  .m-actions .no{background:#fff;border:1px solid var(--line2);color:var(--ink2)}
  .m-actions .no:hover{border-color:var(--muted)}
  .m-actions .yes{background:var(--blue);border:1px solid var(--blue);color:#fff}
  .m-actions .yes:hover{background:var(--blue-d);transform:translateY(-2px)}
  .unsupported{display:none}
  /* 낮고 넓은 뷰포트(예: 1920×500)에서 좌측 지원자 정보가 스크롤 없이도 최대한 보이게 압축.
     .pl 은 overflow:auto 라 초과분은 내부 스크롤되지만, 짧은 높이에선 기본 노출을 늘린다. */
  @media(max-height:640px){
    .pl{padding:14px 16px;gap:10px}
    .pl .av{width:46px;height:46px;border-radius:12px;font-size:20px}
    .pl .nm{font-size:17px}
    .pl .hl{font-size:12px}
    .summary{font-size:12.5px;line-height:1.5}
    .facts .row{padding:7px 12px}
    .lbl{margin-top:2px}
  }
  @media(max-width:1023px){
    .topbar,.three{display:none}
    .unsupported{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;height:100dvh;padding:32px;text-align:center;background:var(--bg2)}
    .unsupported .uic{width:64px;height:64px;border-radius:18px;background:#fff;border:1px solid var(--line);display:grid;place-items:center}
    .unsupported .uic :global(svg){width:30px;height:30px}
    .unsupported h2{font-size:20px}
    .unsupported p{font-size:14px;color:var(--muted);line-height:1.7;max-width:34ch}
  }
`;

// SessionScreen 은 children(폼/에러 등)을 부모가 렌더 → styled-jsx 스코프가 안 걸리므로 global + .candour-scr 네임스페이스.
const screenStyles = `
  .candour-scr{height:100dvh;display:flex;flex-direction:column;background:var(--bg2);color:var(--ink)}
  .candour-scr .topbar{height:56px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 20px;flex:0 0 auto}
  .candour-scr .logo{font-weight:800;font-size:17px;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px;letter-spacing:-.02em}
  .candour-scr .logo .mark{width:26px;height:26px;border-radius:7px;background:var(--ink);color:#fff;display:grid;place-items:center}
  .candour-scr .logo .mark svg{width:18px;height:18px}
  .candour-scr .logo:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:6px}
  .candour-scr .scr-body{flex:1;min-height:0;display:grid;place-items:center;padding:24px}
  /* 94vw 는 부모 .scr-body 의 padding(24px) 과 합쳐져 뷰포트를 넘겨 모바일에서 카드가 잘린다(카드#020 A-2) */
  .candour-scr .card{width:min(440px,100%);background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 20px 60px rgba(14,21,36,.08);padding:34px 30px;text-align:center}
  .candour-scr .card .ic{width:56px;height:56px;border-radius:15px;display:grid;place-items:center;margin:0 auto 18px;font-size:26px;font-weight:800;background:var(--blue-t);color:var(--blue-d)}
  .candour-scr .card .ic.warn{background:#FEF1F1;color:var(--danger)}
  .candour-scr .card .ic svg{width:26px;height:26px;stroke:currentColor;fill:none}
  .candour-scr .card h1{font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px}
  .candour-scr .card p{font-size:14px;color:var(--ink2);line-height:1.6;margin:0}
  .candour-scr .card .sub{color:var(--muted);font-size:13px;margin-top:6px}
  .candour-scr form{margin-top:20px;display:flex;flex-direction:column;gap:10px;text-align:left}
  .candour-scr label{font-size:12px;font-weight:700;color:var(--muted)}
  .candour-scr .field{border:1px solid var(--line2);border-radius:11px;padding:13px 15px;font-size:14px;font-family:var(--sans);color:var(--ink);transition:var(--t);width:100%}
  .candour-scr .field:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-t)}
  .candour-scr .btn{border:none;border-radius:11px;padding:13px;font-family:var(--sans);font-size:14.5px;font-weight:700;cursor:pointer;transition:var(--t);background:var(--blue);color:#fff}
  .candour-scr .btn:hover:not(:disabled){background:var(--blue-d);transform:translateY(-2px)}
  .candour-scr .btn:disabled{opacity:.55;cursor:not-allowed}
  .candour-scr .btn:focus-visible,.candour-scr .field:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
  .candour-scr .err{color:var(--danger);font-size:12.5px;font-weight:600;margin-top:2px}
  .candour-scr .spin{width:34px;height:34px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--blue);margin:0 auto 16px;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){.candour-scr .spin{animation-duration:1.6s}}
`;
