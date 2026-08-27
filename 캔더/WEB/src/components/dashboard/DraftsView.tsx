"use client";

// 지원서 문항 답변 초안(카드#035). 등록해 둔 프로필·자료를 근거로 회사·직무에 맞춘 초안을 만든다.
// 🔒 여기서 만든 글은 인사담당자 챗봇의 답변 근거가 되지 않는다(서버가 chunks 와 분리 보관).
// 회사·직무·공고는 한 번만 입력하고 문항만 여러 개 넣는다 — 카드 1개 = 그룹 1개, 문항 1개 = 초안 1건이다.
import { Fragment, useEffect, useRef, useState } from "react";
import {
  IconBack,
  IconCheck,
  IconClipboard,
  IconHelp,
  IconInfo,
  IconPlus,
  IconReissue,
  IconTrash,
} from "@/components/icons";
import {
  analyzeJobPosting,
  ApiError,
  createDrafts,
  deleteDraft,
  deleteDraftGroup,
  getDraftGroup,
  listDrafts,
  refineDraft,
  updateDraftContent,
  type ApiDraft,
  type ApiDraftGroup,
} from "@/lib/api";
import { fmtDate } from "@/lib/datetime";
import type { DraftLength, DraftOptions, DraftStyle } from "@/types/domain";
import { dashStyles } from "./dashStyles";

// 값은 서버 스키마(server/src/models/Draft.ts)와 1:1 — 버튼 값이 곧 요청 값이다.
// help = `?` 툴팁에 함께 보여줄 설명(무엇이 달라지는지 사용자 말로).
const STYLES: { id: DraftStyle; label: string; help: string }[] = [
  { id: "plain", label: "사실 위주", help: "한 일과 결과만 담담하게" },
  { id: "passionate", label: "열의 강조", help: "지원 의지와 태도를 앞세워" },
  { id: "logical", label: "짜임새 있게", help: "상황 → 한 일 → 결과 순서로" },
];
const LENGTHS: { id: DraftLength; label: string }[] = [
  { id: "short", label: "짧게" },
  { id: "medium", label: "보통" },
  { id: "long", label: "길게" },
];

const DEFAULT_OPTIONS: DraftOptions = { style: "plain", length: "medium", extra: null };
// 서버 스키마(server/src/schemas/draft.ts)와 같은 값 — 넘으면 서버가 400 을 준다.
const QUESTION_MAX = 100;
const JOB_SUMMARY_MAX = 8000;

// 진행 상황 폴링 — 문항 1건이 34~72초(실측)라 2초면 진행률이 촘촘하고 요청도 낭비되지 않는다.
const POLL_MS = 2000;
// 문항당 폴링 상한(2초 × 90 = 3분). 서버 잡이 흔적 없이 사라져도 화면이 영원히 도는 일은 없게 하는 안전장치다.
const POLL_TICKS_PER_QUESTION = 90;

// 생성이 막히는 사유는 화면 안내가 달라진다 — 크레딧은 충전으로, 자료 없음은 자료 탭으로 보낸다.
type BlockKind = "credits" | "assets" | null;
// 생성에 실패해 저장되지 않은 문항(서버 job.failed 와 같은 모양). 같은 카드에 다시 시도할 수 있게 사유를 들고 있는다.
interface FailedQuestion {
  question: string;
  code: string;
  message: string;
}

interface Props {
  onGoWallet: () => void;
}

/**
 * 라벨 옆 `?` — 마우스 hover · 터치 탭 · 키보드 포커스 모두로 열린다.
 * · hover 는 **마우스 포인터일 때만** 연다(터치는 tap 이 pointerenter 를 합성해 의도치 않게 열린다).
 * · 클릭은 토글이 아니라 **열기**다 — 마우스는 올린 순간 이미 열려 있어서, 토글이면 누르는 즉시 닫힌다.
 *   닫기는 마우스 벗어남 · 바깥 클릭/탭 · Esc · 포커스 이동이 맡는다.
 */
function HelpTip({ label, items }: { label: string; items: { label: string; help: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      className="dftip"
      ref={ref}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
    >
      <button
        type="button"
        className="dftipbtn"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <IconHelp width={14} height={14} />
      </button>
      {open && (
        <span className="dftipbox" role="tooltip">
          {items.map((it) => (
            <span key={it.label} className="dftiprow">
              {/* 라벨과 설명 사이 공백은 명시 — JSX 는 줄바꿈으로 나뉜 요소 사이 공백을 지운다.
                  CSS margin 으로만 벌리면 스크린리더가 "사실 위주한 일과…" 로 붙여 읽는다. */}
              <b>{it.label}</b> {it.help}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

export function DraftsView({ onGoWallet }: Props) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [groups, setGroups] = useState<ApiDraftGroup[]>([]);
  const [keepLimit, setKeepLimit] = useState(100);
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [view, setView] = useState<"list" | "form" | "group">("list");

  // 작성 폼 — 회사·직무·공고는 한 벌, 문항만 배열.
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobSummary, setJobSummary] = useState("");
  // 공고에서 읽어온 회사 맥락 — **화면에 그리지 않는다**(같은 내용이 공고 요약과 두 번 보이면 반려됐다).
  // 생성 요청 body 로 그대로 되돌려 보내는 값이라 state 로만 들고 있는다(jobSummary 와 같은 왕복).
  const [companyContext, setCompanyContext] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [style, setStyle] = useState<DraftStyle>(DEFAULT_OPTIONS.style);
  const [length, setLength] = useState<DraftLength>(DEFAULT_OPTIONS.length);
  const [extra, setExtra] = useState("");

  // 결과(그룹 상세) — 문항 행들 + 저장되지 못한 문항.
  const [groupId, setGroupId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ApiDraft[]>([]);
  const [failed, setFailed] = useState<FailedQuestion[]>([]);
  const [contents, setContents] = useState<Record<string, string>>({}); // 문항 id → 편집 중 본문
  const [instructions, setInstructions] = useState<Record<string, string>>({});

  // 생성 진행률 — 완료 문항 수는 실측(k/N), 진행 중인 문항은 그 구간 안에서만 추정으로 차오른다.
  const [prog, setProg] = useState<{ done: number; total: number } | null>(null);
  const [pct, setPct] = useState(0);
  const progRef = useRef({ done: 0, total: 0 }); // 타이머가 렌더 없이 읽는 최신값

  const [analyzing, setAnalyzing] = useState(false);
  // 공고 읽어오기 결과 — 성공·부분성공·실패를 **누른 자리(URL 행) 바로 아래** 한 자리에 띄운다.
  // 폼 맨 아래 공용 err 슬롯에 두면 스크롤을 내려야 보여 "못 불러온 건지 뻑난 건지" 알 수 없었다(카드#035 마스터 반려).
  const [jobMsg, setJobMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false); // 생성 중(연타 방지)
  const [busyId, setBusyId] = useState<string | null>(null); // 재생성 중인 문항
  const [retryIdx, setRetryIdx] = useState<number | null>(null); // 재시도 중인 실패 문항(그 카드에만 진행률)
  const [savingId, setSavingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [block, setBlock] = useState<BlockKind>(null);
  const [note, setNote] = useState<string | null>(null); // 복사·저장 완료 안내
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // 폴링 간격·마무리 대기
  const aliveRef = useRef(true); // 언마운트 후에는 폴링을 잇지 않는다
  const sessionRef = useRef(0); // 화면 세대 — 화면이 바뀌면 올라가고, 그 전에 시작된 폴링은 결과를 쓰지 못한다
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const reload = async () => {
    const r = await listDrafts();
    setGroups(r.groups);
    setKeepLimit(r.keepLimit);
    setMaxQuestions(r.maxQuestions);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await reload();
        if (alive) setPhase("ready");
      } catch {
        if (alive) setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 타이머 정리 — 언마운트 후 setState 를 남기지 않는다.
  // 🚨 alive 는 **본문에서 다시 true 로 올린다**. StrictMode(개발)는 mount→unmount→mount 로 한 번 더 도는데,
  //    cleanup 에서 내리기만 하면 재마운트 뒤에도 false 로 남아 폴링이 첫 tick 에 죽는다(생성이 통째로 실패).
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (noteTimer.current) clearTimeout(noteTimer.current);
      if (waitTimer.current) clearTimeout(waitTimer.current);
    };
  }, []);

  /**
   * 응답을 기다리는 동안 진행 중인 문항 구간을 완만히 채운다.
   * · 구간 끝에는 **닿지 않는다**(85%까지) — 완료 확정은 응답이 도착했을 때만 한다.
   * · 남은 거리에 비례해 느려진다 — 일정 속도로 올리면 상한에 먼저 닿아 수십 초를 멈춘 채
   *   기다리게 된다(문항 1건이 34~60초, 상한 도달은 13초). 이 곡선은 40초 넘게 계속 움직인다.
   * · 퍼센트는 뒤로 가지 않는다(단조 증가).
   * busy 가 내려가거나 언마운트되면 정리된다.
   */
  useEffect(() => {
    if ((!busy && !busyId) || progRef.current.total === 0) return;
    const id = setInterval(() => {
      const { done, total } = progRef.current;
      const seg = 100 / total;
      const cap = done * seg + seg * 0.85;
      setPct((p) => (p < cap ? p + (cap - p) * 0.03 : p));
    }, 300);
    return () => clearInterval(id);
  }, [busy, busyId]);

  const flash = (msg: string) => {
    setNote(msg);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 2400);
  };

  const resetAll = () => {
    setUrl("");
    setCompany("");
    setJobTitle("");
    setJobSummary("");
    setCompanyContext("");
    setQuestions([""]);
    setStyle(DEFAULT_OPTIONS.style);
    setLength(DEFAULT_OPTIONS.length);
    setExtra("");
    setGroupId(null);
    setDrafts([]);
    setFailed([]);
    setContents({});
    setInstructions({});
    setErr(null);
    setJobMsg(null);
    setBlock(null);
    progRef.current = { done: 0, total: 0 };
    setProg(null);
    setPct(0);
    // 화면을 갈아끼우므로 세대를 올린다 — 돌던 폴링은 결과를 이 화면에 쓰지 못하고 다음 tick 에 멈춘다.
    // (그룹 A 생성 중 "목록으로" → 그룹 B 열람 → 뒤늦게 끝난 A 가 B 화면을 덮던 문제)
    sessionRef.current += 1;
    setBusy(false);
    setBusyId(null);
    setRetryIdx(null);
  };

  const openNew = () => {
    resetAll();
    setView("form");
  };

  // 그룹(카드) 열기 — 문항 행 전체를 받아 섹션으로 편다.
  const openGroup = async (gid: string) => {
    resetAll();
    const live = captureSession();
    setView("group");
    setBusy(true);
    try {
      const { drafts } = await getDraftGroup(gid);
      if (!live()) return;
      setGroupId(gid);
      setDrafts(drafts);
      setContents(Object.fromEntries(drafts.map((d) => [d.id, d.content])));
      const first = drafts[0];
      if (first) {
        setCompany(first.company);
        setJobTitle(first.jobTitle);
        setJobSummary(first.jobSummary ?? "");
        setCompanyContext(first.companyContext ?? "");
        setUrl(first.jobUrl ?? "");
        setStyle(first.options.style);
        setLength(first.options.length);
        setExtra(first.options.extra ?? "");
      }
    } catch (e) {
      if (live()) setErr(e instanceof ApiError ? e.message : "초안을 불러오지 못했습니다.");
    } finally {
      if (live()) setBusy(false);
    }
  };

  const backToList = () => {
    resetAll();
    setView("list");
    void reload().catch(() => {});
  };

  // 실패 사유별 화면 분기 — 크레딧 부족·자료 없음은 오류가 아니라 다음 행동 안내다.
  const handleError = (e: unknown, fallback: string) => {
    if (e instanceof ApiError) {
      setErr(e.message);
      setBlock(e.code === "INSUFFICIENT_CREDITS" ? "credits" : e.code === "ASSETS_REQUIRED" ? "assets" : null);
      return;
    }
    setErr(fallback);
    setBlock(null);
  };

  const analyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setJobMsg(null);
    setBlock(null);
    try {
      const job = await analyzeJobPosting(url.trim());
      // 읽어온 값으로 **덮어쓴다** — 다른 공고를 읽어오면 회사·직무도 그 공고 값으로 바뀐다(카드#035 마스터 반려).
      // 못 뽑아낸 항목(빈 값)만 기존 값을 지킨다 — 분석이 못 읽었다고 이미 채운 칸을 지우지는 않는다.
      if (job.company.trim()) setCompany(job.company.trim());
      if (job.jobTitle.trim()) setJobTitle(job.jobTitle.trim());
      // 읽어온 내용은 붙여넣기 칸을 채워 준다 — 그대로 두거나 손으로 고칠 수 있다.
      if (job.jobSummary.trim()) setJobSummary(job.jobSummary);
      // 🚨 회사 맥락은 **빈 값이어도 그대로 교체**한다(위 세 칸과 규칙이 다르다). 화면에 없어 사용자가
      //    고칠 수 없는 값이라 "빈 값이면 기존 유지"를 적용하면, 다른 공고를 읽어왔을 때 회사·직무만
      //    바뀌고 회사 맥락은 앞 공고 것이 남아 프롬프트로 들어간다.
      setCompanyContext(job.companyContext.trim());
      if (job.partial) {
        setJobMsg({
          tone: "bad",
          text: "공고 본문까지는 읽지 못했습니다. 주요업무·자격요건을 아래 칸에 붙여넣어주세요.",
        });
      } else if (job.company.trim() || job.jobTitle.trim()) {
        setJobMsg({ tone: "ok", text: "공고를 읽어왔습니다. 회사·직무와 아래 칸을 채웠습니다." });
      } else {
        // 본문은 읽었는데 회사·직무를 못 뽑은 경우 — 채웠다고 말하면 거짓이 된다.
        setJobMsg({ tone: "bad", text: "공고에서 회사명과 직무를 찾지 못했습니다. 아래에 직접 입력해주세요." });
      }
    } catch (e) {
      // 크롤 실패는 정상 분기 — 붙여넣기 칸이 늘 열려 있으니 안내만 띄운다.
      if (e instanceof ApiError) {
        setJobMsg({ tone: "bad", text: e.message });
        // 충전·자료 등록 유도는 그대로 살린다(결과 안내는 누른 자리에, 다음 행동 버튼은 아래에).
        setBlock(
          e.code === "INSUFFICIENT_CREDITS" ? "credits" : e.code === "ASSETS_REQUIRED" ? "assets" : null,
        );
      } else {
        setJobMsg({ tone: "bad", text: "공고를 읽어오지 못했습니다." });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const filledQuestions = questions.map((q) => q.trim()).filter(Boolean);
  const summaryOver = jobSummary.length > JOB_SUMMARY_MAX;
  const canGenerate =
    !!company.trim() && !!jobTitle.trim() && filledQuestions.length > 0 && !summaryOver && !busy;

  // 진행 문구는 자연어로 — 마지막 문항 응답이 온 뒤 결과로 넘어가기 전 320ms 동안은 "마무리하는 중".
  const progLabel = !prog
    ? ""
    : busyId
      ? "다시 쓰는 중"
      : prog.done >= prog.total
        ? "마무리하는 중"
        : prog.total > 1
          ? `${prog.total}개 문항 중 ${prog.done + 1}번째를 쓰는 중`
          : "초안을 쓰는 중";

  // 진행률 — 생성·재시도·다시 생성이 같은 모양을 쓴다(각자 누른 자리 바로 아래에 띄운다).
  const progressBar = prog && (
    <div className="dfprog">
      <div className="dfprogtext">{progLabel}</div>
      <div className="dfprogrow">
        <span
          className="dfprogbar"
          role="progressbar"
          aria-label="초안 생성 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(pct)}
        >
          <span className="dfprogfill" style={{ width: `${pct}%` }} />
        </span>
        <span className="dfprogpct">{Math.floor(pct)}%</span>
      </div>
    </div>
  );

  const setQuestionAt = (i: number, v: string) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? v : q)));

  // 그룹 커버리지 — 문항 전체를 합산한다. 분모는 **문항들이 실제로 보고한 요구역량의 합집합**이고,
  // 붙여넣은 공고 본문의 줄 수가 아니다: 사람인·잡코리아처럼 상세를 JS 로 그리는 공고는 사용자가
  // **공고 전문을 붙여넣는 게 기본 경로**라(서버 partial:true) 줄 수가 곧 요구역량 수가 아니다
  // ("요구역량 132개 중 3개를 다뤘습니다" 가 뜬다).
  // 🔒 여기 담기는 문자열은 전부 서버가 공고 원문 항목으로 대조·치환해 저장한 값이다 — 가공하지 않는다.
  const covered: string[] = [];
  for (const d of drafts) {
    for (const t of d.coverage?.targets ?? []) if (!covered.includes(t)) covered.push(t);
  }
  const uncovered: string[] = [];
  for (const d of drafts) {
    for (const m of d.coverage?.missing ?? []) {
      if (!covered.includes(m) && !uncovered.includes(m)) uncovered.push(m);
    }
  }
  // 0 이면 리포트 없음 — 공고 요약이 없었거나(분석 실패·수동 미입력) 카드#036 이전 초안이다. 통째로 숨긴다.
  const reqTotal = covered.length + uncovered.length;

  // 문항 하나의 매칭 리포트. coverage 가 null 인 기존 초안은 아무것도 그리지 않는다.
  const coverageOf = (d: ApiDraft) =>
    d.coverage &&
    (d.coverage.targets.length > 0 || d.coverage.missing.length > 0) && (
      <div className="dfcov">
        {d.coverage.targets.length > 0 && (
          <div className="dfcovrow">
            <span className="flabel">이 답변이 증명한 역량</span>
            <div className="dfchips">
              {d.coverage.targets.map((t) => (
                <span className="badge b-univ" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {d.coverage.missing.length > 0 && (
          <div className="dfcovrow">
            <span className="flabel">아직 안 다룬 역량</span>
            <div className="dfchips">
              {d.coverage.missing.map((t) => (
                <span className="badge b-co" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );

  // 폴링이 준 그룹 상태를 화면에 반영한다(서버가 그 그룹의 행 전체를 준다).
  const showGroup = (gid: string, rows: ApiDraft[]) => {
    setGroupId(gid);
    setDrafts(rows);
    setContents((prev) => {
      const next = { ...prev };
      // 편집 중인 본문은 덮지 않는다 — 폴링은 그룹 전체를 주므로 그대로 합치면 사용자가 고치던 글이 사라진다.
      for (const d of rows) if (next[d.id] === undefined) next[d.id] = d.content;
      return next;
    });
  };

  // 잡이 돌려준 실패 사유를 화면 안내로 옮긴다 — 크레딧 부족·자료 없음은 오류가 아니라 다음 행동 안내다.
  const showFailure = (f: { code: string; message: string } | undefined, fallback: string) => {
    setErr(f?.message ?? fallback);
    setBlock(f?.code === "INSUFFICIENT_CREDITS" ? "credits" : f?.code === "ASSETS_REQUIRED" ? "assets" : null);
  };

  // 이 시점의 화면 세대를 붙잡는다 — 비동기 결과를 화면에 쓰기 전에 반드시 통과시킨다.
  const captureSession = () => {
    const gen = sessionRef.current;
    return () => aliveRef.current && sessionRef.current === gen;
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      waitTimer.current = setTimeout(resolve, ms);
    });

  /**
   * 생성 잡이 끝날 때까지 그룹을 폴링한다.
   * · 완료 문항 수(k/N)는 **서버 실측**이고, 진행 중인 문항 구간만 위의 곡선이 메운다.
   * · 폴링 1회가 실패해도(일시적 네트워크 오류) 생성을 실패로 만들지 않는다 — 서버는 계속 쓰고 있다.
   * · `job` 이 null 이면(서버 재시작으로 잡 유실·만료) 저장된 초안까지를 결과로 본다 — 진행 화면에 갇히지 않는다.
   * · 화면이 바뀌면(언마운트·다른 그룹·목록으로 이동) 멈추고 `null` 을 준다 — 호출자는 아무것도 반영하지 않는다.
   */
  const pollJob = async (
    gid: string,
    total: number,
    live: () => boolean,
  ): Promise<{ drafts: ApiDraft[]; failed: FailedQuestion[] } | null> => {
    for (let tick = 0; tick < total * POLL_TICKS_PER_QUESTION; tick++) {
      await sleep(POLL_MS);
      if (!live()) return null;
      let r;
      try {
        r = await getDraftGroup(gid);
      } catch {
        continue;
      }
      const done = r.job ? r.job.done : total;
      progRef.current = { done, total };
      setProg({ done, total });
      setPct((p) => Math.max(p, (done * 100) / total));
      if (!r.job || !r.job.running) return { drafts: r.drafts, failed: r.job?.failed ?? [] };
    }
    // 상한 도달 — 그때까지 저장된 것을 결과로 준다(실패 사유는 알 수 없다).
    const r = await getDraftGroup(gid);
    return live() ? { drafts: r.drafts, failed: r.job?.failed ?? [] } : null;
  };

  /**
   * 생성은 **접수만 하고 진행률을 폴링**한다(자료 업로드와 같은 모양).
   * 요청 안에서 LLM 을 기다리면 문항 1건(34~72초 실측)만으로도 게이트웨이 60초 상한에 걸려 504 가 나고,
   * 그때 화면은 "서버에 연결할 수 없습니다"인데 서버는 초안을 저장하고 크레딧도 이미 썼다 —
   * 다시 누르면 중복 생성·중복 과금이 된다(카드#035 마스터 반려). 이제 응답은 LLM 시간과 무관하다.
   * 문항별 순차 실행·중단 사유·부분 성공은 서버 잡이 맡는다(server/src/services/draft/jobs.ts).
   */
  const generate = async () => {
    if (!canGenerate) return;
    const live = captureSession();
    const qs = filledQuestions;
    setBusy(true);
    setErr(null);
    setBlock(null);
    progRef.current = { done: 0, total: qs.length };
    setProg({ done: 0, total: qs.length });
    setPct(0);

    try {
      const { groupId: gid, total } = await createDrafts({
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        jobUrl: url.trim() || undefined,
        jobSummary: jobSummary.trim() || undefined,
        companyContext: companyContext.trim() || undefined,
        questions: qs,
        options: { style, length, extra: extra.trim() || null },
      });
      const r = await pollJob(gid, total, live);
      if (!r) return;

      // 하나도 못 만들었으면 폼에 머문 채 안내한다 — 충전·자료 등록 링크가 그대로 산다.
      if (r.drafts.length === 0) {
        showFailure(r.failed[0], "초안을 만들지 못했습니다.");
        return;
      }
      // 100% 를 눈으로 확인할 수 있게 잠깐 두고 결과로 넘어간다.
      await sleep(320);
      if (!live()) return;
      showGroup(gid, r.drafts);
      setFailed(r.failed);
      setView("group");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (live()) handleError(e, "초안을 만들지 못했습니다.");
    } finally {
      if (live()) {
        setProg(null);
        setBusy(false);
      }
    }
  };

  // 실패한 문항만 같은 카드에 다시 시도(groupId 를 넘겨 같은 그룹에 이어 붙인다).
  const retry = async (idx: number) => {
    const target = failed[idx];
    if (!target || !groupId || busy || busyId) return;
    const live = captureSession();
    setBusy(true);
    setRetryIdx(idx);
    setErr(null);
    setBlock(null);
    progRef.current = { done: 0, total: 1 };
    setProg({ done: 0, total: 1 });
    setPct(0);
    try {
      const { groupId: gid, total } = await createDrafts({
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        jobUrl: url.trim() || undefined,
        jobSummary: jobSummary.trim() || undefined,
        companyContext: companyContext.trim() || undefined,
        questions: [target.question],
        groupId,
        options: { style, length, extra: extra.trim() || null },
      });
      const r = await pollJob(gid, total, live);
      if (!r) return;
      showGroup(gid, r.drafts);
      // 같은 문항 텍스트가 여럿일 수 있어 텍스트가 아니라 index 로 제거한다.
      setFailed((prev) => prev.filter((_, i) => i !== idx).concat(r.failed));
    } catch (e) {
      if (live()) handleError(e, "초안을 만들지 못했습니다.");
    } finally {
      if (live()) {
        setProg(null);
        setBusy(false);
        setRetryIdx(null);
      }
    }
  };

  // 문항 1개 다시 생성 — 위의 문체·분량과 이어서 요청한 내용을 반영한다. 생성과 같은 잡·폴링 경로다.
  const regenerate = async (d: ApiDraft) => {
    if (busyId || busy) return;
    const live = captureSession();
    setBusyId(d.id);
    setErr(null);
    setBlock(null);
    progRef.current = { done: 0, total: 1 };
    setProg({ done: 0, total: 1 });
    setPct(0);
    try {
      const { groupId: gid, total } = await refineDraft(d.id, {
        options: { style, length, extra: extra.trim() || null },
        instruction: instructions[d.id]?.trim() || undefined,
      });
      const r = await pollJob(gid, total, live);
      if (!r) return;
      if (r.failed.length > 0) {
        showFailure(r.failed[0], "다시 만들지 못했습니다.");
        return;
      }
      const updated = r.drafts.find((x) => x.id === d.id);
      if (updated) {
        setDrafts((prev) => prev.map((x) => (x.id === d.id ? updated : x)));
        // 다시 쓴 본문은 편집 중이던 값 위에 덮는다 — 사용자가 요청한 결과다.
        setContents((prev) => ({ ...prev, [d.id]: updated.content }));
      }
      setInstructions((prev) => ({ ...prev, [d.id]: "" }));
    } catch (e) {
      if (live()) handleError(e, "다시 만들지 못했습니다.");
    } finally {
      if (live()) {
        setProg(null);
        setBusyId(null);
      }
    }
  };

  const save = async (d: ApiDraft) => {
    if (savingId) return;
    setSavingId(d.id);
    setErr(null);
    try {
      const r = await updateDraftContent(d.id, contents[d.id] ?? "");
      setDrafts((prev) => prev.map((x) => (x.id === d.id ? r.draft : x)));
      flash("저장했습니다");
    } catch (e) {
      handleError(e, "저장하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  const copy = async (d: ApiDraft) => {
    const text = contents[d.id] ?? "";
    try {
      await navigator.clipboard.writeText(text);
      flash("복사했습니다");
    } catch {
      // 클립보드 권한이 막힌 브라우저 — 본문이 길어 prompt 창은 못 쓴다(LinksView 의 짧은 URL 과 다르다).
      // 대신 본문을 통째로 선택해 두면 사용자가 바로 복사할 수 있다.
      bodyRefs.current[d.id]?.select();
      flash("본문을 선택했습니다. 직접 복사해주세요");
    }
  };

  // 문항 1개 삭제. 카드의 마지막 문항이면 카드 자체가 사라지므로 목록으로 돌아간다.
  const removeQuestion = async (d: ApiDraft) => {
    if (!window.confirm("이 문항의 초안을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.")) return;
    try {
      await deleteDraft(d.id);
      const rest = drafts.filter((x) => x.id !== d.id);
      setDrafts(rest);
      if (rest.length === 0 && failed.length === 0) backToList();
    } catch (e) {
      handleError(e, "삭제하지 못했습니다.");
    }
  };

  // 카드 삭제 = 그 회사·직무의 문항 전부 삭제.
  const removeGroup = async (gid: string, count: number) => {
    if (
      !window.confirm(
        `이 지원서의 초안 ${count}건을 모두 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }
    try {
      await deleteDraftGroup(gid);
      if (groupId === gid) backToList();
      else await reload();
    } catch (e) {
      handleError(e, "삭제하지 못했습니다.");
    }
  };

  if (phase === "loading") {
    return (
      <>
        <div className="state">
          <div className="spin" />
          <p>불러오는 중…</p>
        </div>
        <style jsx>{dashStyles}</style>
      </>
    );
  }
  if (phase === "error") {
    return (
      <>
        <div className="state">
          <p>초안을 불러오지 못했습니다.</p>
        </div>
        <style jsx>{dashStyles}</style>
      </>
    );
  }

  return (
    <>
      {view === "list" && (
        <>
          <div className="head">
            <div>
              <h1>지원서 작성</h1>
              <div className="sub">
                등록해 둔 프로필과 자료를 근거로 지원서 문항 답변 초안을 만듭니다. 보관은 {keepLimit}건까지입니다.
              </div>
            </div>
            <button type="button" className="newbtn" onClick={openNew}>
              <IconPlus width={16} height={16} />
              새로 작성
            </button>
          </div>

          {err && <div className="dferr">{err}</div>}

          {groups.length === 0 ? (
            <div className="empty">아직 만든 초안이 없습니다. 새로 작성해보세요.</div>
          ) : (
            <div className="cards">
              {groups.map((g) => (
                <div className="card dfcard" key={g.groupId}>
                  <button type="button" className="dfopen" onClick={() => void openGroup(g.groupId)}>
                    <div className="row1">
                      <span className="label">{g.company}</span>
                      <span className="badge b-univ">{g.jobTitle}</span>
                    </div>
                    <div className="meta dfq">문항 {g.questionCount}개</div>
                    <div className="dfdate">{fmtDate(g.createdAt)} 작성</div>
                  </button>
                  <div className="actions">
                    <button
                      type="button"
                      className="act danger"
                      onClick={() => void removeGroup(g.groupId, g.questionCount)}
                    >
                      <IconTrash width={14} height={14} />
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "form" && (
        <>
          <div className="backbar">
            <button type="button" className="backbtn" onClick={backToList}>
              <IconBack width={14} height={14} />
              목록으로
            </button>
            {note && <span className="dfnote">{note}</span>}
          </div>

          <div className="pform">
            <div className="frow">
              <label className="flabel" htmlFor="df-url">
                채용공고 주소
              </label>
              <div className="dfurl">
                <input
                  id="df-url"
                  className="finput"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setJobMsg(null); // 주소를 고치면 지난 결과 안내는 지운다
                  }}
                  disabled={analyzing}
                />
                <button
                  type="button"
                  className="pbtn"
                  onClick={() => void analyze()}
                  disabled={analyzing || !url.trim()}
                >
                  {analyzing ? "읽는 중…" : "공고 읽어오기"}
                </button>
              </div>
              {/* 결과 안내는 힌트를 **대체**한다 — 자리가 원래 있던 곳이라 안내가 떠도 아래 폼이 밀리지 않는다. */}
              {jobMsg ? (
                <div className={`fhint dfurlmsg ${jobMsg.tone}`} role="status">
                  <IconInfo width={13} height={13} />
                  {/* 문장을 각각 inline-block 으로 묶어 의미 단위로 접는다 — 좁은 화면에서 "아래 / 칸에" 처럼
                      한 어절이 갈리지 않고, 자리가 없으면 문장이 통째로 다음 줄로 내려간다(.dfguard 와 같은 방식). */}
                  <span>
                    {jobMsg.text.split(". ").map((sentence, i, all) => (
                      <Fragment key={i}>
                        {i > 0 && " "}
                        <span>{i < all.length - 1 ? `${sentence}.` : sentence}</span>
                      </Fragment>
                    ))}
                  </span>
                </div>
              ) : (
                <div className="fhint">
                  주소를 넣고 눌러보세요. 읽어온 내용은 아래 칸에 채워지고, 그대로 고칠 수 있습니다.
                </div>
              )}
            </div>

            <div className="frow">
              <label className="flabel" htmlFor="df-paste">
                공고 내용
              </label>
              <textarea
                id="df-paste"
                className="ftext dfpaste"
                value={jobSummary}
                onChange={(e) => {
                  setJobSummary(e.target.value);
                  setJobMsg(null); // 직접 붙여넣으면 읽어오기 결과 안내는 역할을 다했다
                }}
              />
              <div className="fhint dfcountrow">
                <span>
                  주요업무·자격요건을 붙여넣으면 그대로 반영합니다. 주소 없이 붙여넣기만 해도 됩니다.
                </span>
                <span className={summaryOver ? "dfcount over" : "dfcount"}>
                  {jobSummary.length.toLocaleString()} / {JOB_SUMMARY_MAX.toLocaleString()}자
                </span>
              </div>
              {summaryOver && (
                <div className="dferr dfslim">
                  공고 내용이 너무 깁니다. {JOB_SUMMARY_MAX.toLocaleString()}자에 맞춰 지원 직무와 관련된
                  부분만 남겨주세요.
                </div>
              )}
            </div>

            <div className="frow two">
              <div>
                <label className="flabel" htmlFor="df-company">
                  회사명
                </label>
                <input
                  id="df-company"
                  className="finput"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="flabel" htmlFor="df-job">
                  직무
                </label>
                <input
                  id="df-job"
                  className="finput"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>

            <div className="frow">
              <span className="flabel">지원서 문항</span>
              {questions.map((q, i) => (
                // 입력 칸은 순서로만 구분된다 — 값을 key 로 쓰면 같은 값 두 개가 합쳐진다.
                <div className="dfqrow" key={i}>
                  <input
                    className="finput"
                    value={q}
                    onChange={(e) => setQuestionAt(i, e.target.value)}
                    maxLength={QUESTION_MAX}
                    aria-label={`지원서 문항 ${i + 1}`}
                  />
                  <span className="dfqcount">
                    {q.length} / {QUESTION_MAX}자
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="dfqdel"
                      aria-label={`문항 ${i + 1} 삭제`}
                      onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  )}
                </div>
              ))}
              {questions.length < maxQuestions && (
                <button
                  type="button"
                  className="dfqadd"
                  onClick={() => setQuestions((prev) => [...prev, ""])}
                >
                  <IconPlus width={14} height={14} />
                  문항 추가
                </button>
              )}
              <div className="fhint">
                지원서에 적힌 질문을 그대로 옮겨 적어주세요. 한 문항은 {QUESTION_MAX}자까지, 한 번에{" "}
                {maxQuestions}개까지 넣을 수 있습니다. 문항마다 초안이 따로 만들어지고 크레딧도 문항 수만큼
                차감됩니다.
              </div>
            </div>

            <div className="frow">
              <span className="flabel dflabelrow">
                문체
                <HelpTip label="문체 설명 보기" items={STYLES} />
              </span>
              <div className="dfseg">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={style === s.id ? "on" : ""}
                    onClick={() => setStyle(s.id)}
                    aria-pressed={style === s.id}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="frow">
              <span className="flabel">분량</span>
              <div className="dfseg">
                {LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={length === l.id ? "on" : ""}
                    onClick={() => setLength(l.id)}
                    aria-pressed={length === l.id}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="fhint">짧게 400자 · 보통 800자 · 길게 1500자 내외로 씁니다.</div>
            </div>

            <div className="frow">
              <label className="flabel" htmlFor="df-extra">
                추가 요청
              </label>
              <input
                id="df-extra"
                className="finput"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                maxLength={300}
              />
              <div className="fhint">강조하고 싶은 경험이나 빼고 싶은 내용을 적으면 반영합니다.</div>
            </div>

            {err && <div className="dferr">{err}</div>}
            {block === "credits" && (
              <button type="button" className="dfgo" onClick={onGoWallet}>
                <IconInfo width={15} height={15} />
                크레딧 충전하러 가기 →
              </button>
            )}
            {block === "assets" && (
              <div className="dfgo static">
                <IconInfo width={15} height={15} />
                자료 탭에서 이력서나 포트폴리오를 먼저 등록해주세요.
              </div>
            )}

            <div className="prow-btn">
              <button type="button" className="psave" onClick={() => void generate()} disabled={!canGenerate}>
                {busy ? "초안을 쓰는 중…" : "초안 생성"}
              </button>
            </div>
            {progressBar}
          </div>
        </>
      )}

      {view === "group" && (
        <>
          <div className="backbar">
            <button type="button" className="backbtn" onClick={backToList}>
              <IconBack width={14} height={14} />
              목록으로
            </button>
            {note && <span className="dfnote">{note}</span>}
          </div>

          <div className="pform">
            <div className="dfghead">
              <div className="dfgtitle">
                <span className="label">{company}</span>
                <span className="badge b-univ">{jobTitle}</span>
              </div>
              <div className="dfgmeta">문항 {drafts.length}개</div>
            </div>

            {reqTotal > 0 && (
              <div className="dfcov top">
                <div className="dfcovsum">
                  공고 요구역량 {reqTotal}개 중 <b>{covered.length}개</b>를 다뤘습니다.
                </div>
                {uncovered.length > 0 && (
                  <div className="dfcovrow">
                    <span className="flabel">아직 안 다룬 역량 {uncovered.length}개</span>
                    <div className="dfchips">
                      {uncovered.map((t) => (
                        <span className="badge b-co" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="fhint">이 역량을 다룰 문항을 추가해보세요.</div>
                  </div>
                )}
              </div>
            )}

            <div className="dfguard">
              {/* 의미 단위 줄바꿈 — 좁은 화면에서 "직접 / 확인하세요" 로 갈리지 않게 문장을 각각
                  inline-block 으로 묶는다(들어갈 자리가 없으면 문장 통째로 다음 줄로 내려간다). */}
              <IconInfo width={15} height={15} />
              <span>
                <span>AI 초안입니다.</span> <span>제출 전 사실관계를 직접 확인하세요.</span>
              </span>
            </div>

            <div className="frow">
              <span className="flabel dflabelrow">
                문체
                <HelpTip label="문체 설명 보기" items={STYLES} />
              </span>
              <div className="dfseg">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={style === s.id ? "on" : ""}
                    onClick={() => setStyle(s.id)}
                    aria-pressed={style === s.id}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="frow">
              <span className="flabel">분량</span>
              <div className="dfseg">
                {LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={length === l.id ? "on" : ""}
                    onClick={() => setLength(l.id)}
                    aria-pressed={length === l.id}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="fhint">문체·분량을 바꾼 뒤 아래 문항의 &lsquo;다시 생성&rsquo;을 누르면 반영됩니다.</div>
            </div>

            {err && <div className="dferr">{err}</div>}
            {block === "credits" && (
              <button type="button" className="dfgo" onClick={onGoWallet}>
                <IconInfo width={15} height={15} />
                크레딧 충전하러 가기 →
              </button>
            )}
            {block === "assets" && (
              <div className="dfgo static">
                <IconInfo width={15} height={15} />
                자료 탭에서 이력서나 포트폴리오를 먼저 등록해주세요.
              </div>
            )}
          </div>

          {drafts.map((d, i) => (
            <div className="pform dfsec" key={d.id}>
              <div className="dfsechead">
                <span className="dfsecno">문항 {i + 1}</span>
                <button type="button" className="act danger" onClick={() => void removeQuestion(d)}>
                  <IconTrash width={14} height={14} />
                  삭제
                </button>
              </div>
              <p className="dfsecq">{d.question}</p>

              <textarea
                ref={(el) => {
                  bodyRefs.current[d.id] = el;
                }}
                className="ftext dfbody"
                value={contents[d.id] ?? ""}
                onChange={(e) => setContents((prev) => ({ ...prev, [d.id]: e.target.value }))}
                maxLength={8000}
                aria-label={`문항 ${i + 1} 초안 본문`}
                disabled={busyId === d.id}
              />
              <div className="dfbar">
                <span className="dflen">{(contents[d.id] ?? "").length}자</span>
                <button
                  type="button"
                  className="pbtn"
                  onClick={() => void copy(d)}
                  disabled={!(contents[d.id] ?? "").trim()}
                >
                  <IconClipboard width={14} height={14} />
                  복사
                </button>
                <button
                  type="button"
                  className="pbtn"
                  onClick={() => void save(d)}
                  disabled={
                    savingId === d.id ||
                    busyId === d.id ||
                    (contents[d.id] ?? "").trim() === d.content.trim()
                  }
                >
                  <IconCheck width={14} height={14} />
                  {savingId === d.id ? "저장 중…" : "저장"}
                </button>
              </div>

              {coverageOf(d)}

              <div className="dfagain">
                <label className="flabel" htmlFor={`df-inst-${d.id}`}>
                  이어서 요청하기
                </label>
                <div className="dfurl">
                  <input
                    id={`df-inst-${d.id}`}
                    className="finput"
                    value={instructions[d.id] ?? ""}
                    onChange={(e) => setInstructions((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    maxLength={300}
                    disabled={busyId === d.id}
                  />
                  <button
                    type="button"
                    className="pbtn"
                    onClick={() => void regenerate(d)}
                    disabled={busyId === d.id}
                  >
                    <IconReissue width={14} height={14} />
                    {busyId === d.id ? "다시 쓰는 중…" : "다시 생성"}
                  </button>
                </div>
                <div className="fhint">
                  더 짧게, 협업 경험 강조처럼 고치고 싶은 점을 적어주세요. 이 문항만 다시 씁니다.
                </div>
                {busyId === d.id && progressBar}
              </div>
            </div>
          ))}

          {failed.map((f, i) => (
            <div className="pform dfsec dffail" key={i}>
              <div className="dfsechead">
                <span className="dfsecno">만들지 못한 문항</span>
              </div>
              <p className="dfsecq">{f.question}</p>
              <div className="dferr dfslim">{f.message}</div>
              <button
                type="button"
                className="pbtn"
                onClick={() => void retry(i)}
                disabled={busy}
              >
                <IconReissue width={14} height={14} />
                {retryIdx === i ? "다시 쓰는 중…" : "다시 시도"}
              </button>
              {retryIdx === i && progressBar}
            </div>
          ))}
        </>
      )}
      <style jsx>{dashStyles}</style>
    </>
  );
}
