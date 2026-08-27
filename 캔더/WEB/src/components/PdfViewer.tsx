"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconMinus, IconPlus } from "@/components/icons";

// HR 자료 뷰어 안에서 PDF 원본을 여는 컴포넌트(카드#016 4).
// - 바이트는 대화 스코프 인가가 걸린 URL 에서 fetch(credentials:'include') → getDocument({data}).
// - 100p 문서까지 들어오므로 placeholder 를 먼저 깔고 IntersectionObserver 로 보이는 페이지만 canvas 렌더.
// - 실패(fetch·파싱·worker)는 전부 onFail 로 올려 기존 썸네일 UI 로 폴백한다. 오류 원장에는 남기지 않는다.

type PdfDoc = { numPages: number; getPage(n: number): Promise<PdfPage>; destroy?: () => void };
type PdfPage = {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    transform?: number[] | null;
  }): { promise: Promise<void>; cancel(): void };
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export function PdfViewer({
  fileUrl,
  citePage,
  onFail,
}: {
  fileUrl: string;
  citePage: number | null;
  onFail: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const holdersRef = useRef<(HTMLDivElement | null)[]>([]);
  const pdfRef = useRef<PdfDoc | null>(null);
  const tasksRef = useRef<Map<number, { cancel(): void }>>(new Map());
  const baseScaleRef = useRef(1);

  // 첫 페이지 기준 비율(placeholder 높이 계산용). 페이지마다 크기가 달라도 실제 렌더 때 보정된다.
  // ref 가 아니라 state 인 이유: 렌더에서 읽는 값이라 ref 로 두면 갱신이 화면에 반영되지 않는다.
  const [ratio, setRatio] = useState(1.414);
  const [numPages, setNumPages] = useState(0);
  const [curPage, setCurPage] = useState(citePage ?? 1);
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);

  // 문서 로드 — 자료가 바뀌면 이전 loadingTask 를 destroy 해 워커를 회수한다.
  useEffect(() => {
    let alive = true;
    let task: { promise: Promise<PdfDoc>; destroy(): Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // 🔒 worker 는 same-origin 로컬 번들에서만 서빙한다 — prod CSP 가 script-src 'self' 라
        //    CDN worker 는 차단된다(front/next.config.ts). public/ 에 복사해 둔 파일을 가리킨다.
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const res = await fetch(fileUrl, { credentials: "include" });
        if (!res.ok) throw new Error(`file ${res.status}`);
        const data = await res.arrayBuffer();
        if (!alive) return;
        task = pdfjs.getDocument({ data }) as unknown as typeof task;
        const doc = (await task!.promise) as PdfDoc;
        if (!alive) return;
        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setRatio(vp.height / vp.width);
        // 패널 실제 폭에 맞춘 배율(fit width) 을 zoom 1 로 삼는다 — 3분할 중 좁은 칸이라 고정 scale 은 못 쓴다.
        const panelW = scrollRef.current?.clientWidth ?? 360;
        baseScaleRef.current = Math.max(0.2, (panelW - 24) / vp.width);
        pdfRef.current = doc;
        holdersRef.current = new Array(doc.numPages).fill(null);
        setNumPages(doc.numPages);
        setReady(true);
      } catch {
        // 폴백은 정상 흐름 — 뷰어가 죽어도 근거 확인은 썸네일로 된다.
        if (alive) onFail();
      }
    })();
    const tasks = tasksRef.current;
    return () => {
      alive = false;
      for (const t of tasks.values()) t.cancel();
      tasks.clear();
      pdfRef.current = null;
      // destroy 가 진행 중인 렌더를 끊으며 거부할 수 있다 — 정리 단계라 무시한다.
      task?.destroy().catch(() => {});
    };
  }, [fileUrl, onFail]);

  // canvas 는 React 가 그린 자식(인용 배지)을 지우지 않도록 전용 슬롯 안에만 넣는다.
  const slotOf = (holder: HTMLDivElement | null) =>
    holder?.querySelector<HTMLDivElement>(".cv") ?? null;

  const renderPage = useCallback(
    async (n: number) => {
      const doc = pdfRef.current;
      const holder = holdersRef.current[n - 1];
      if (!doc || !holder || tasksRef.current.has(n)) return;
      const scale = baseScaleRef.current * zoom;
      try {
        const page = await doc.getPage(n);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        const task = page.render({
          canvasContext: ctx,
          viewport: vp,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        });
        tasksRef.current.set(n, task);
        await task.promise;
        // 자리표시 비율을 풀고 실제 렌더 높이를 쓴다(페이지마다 크기가 다른 문서 대응).
        holder.style.aspectRatio = "";
        slotOf(holder)?.replaceChildren(canvas);
      } catch {
        tasksRef.current.delete(n); // 취소·실패한 페이지는 다시 보일 때 재시도
      }
    },
    [zoom],
  );

  // 보이는 페이지만 렌더하고, 화면 밖으로 나가면 canvas 를 버려 메모리를 되돌린다.
  // rootMargin 을 화면 한 장만큼 잡아 스크롤 중 빈 페이지가 보이지 않게 한다.
  // 배율이 바뀌면 renderPage 가 새로 만들어져 이 관찰자도 함께 재생성된다 — 재생성이 곧 재렌더 신호다
  // (배율만 바뀌면 교차 상태는 그대로라 기존 관찰자는 콜백을 다시 쏘지 않아 빈 페이지만 남는다).
  useEffect(() => {
    if (!ready || !numPages) return;
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.page);
          if (e.isIntersecting) {
            renderPage(n);
          } else {
            const t = tasksRef.current.get(n);
            if (t) {
              t.cancel();
              tasksRef.current.delete(n);
            }
            const holder = holdersRef.current[n - 1];
            const slot = slotOf(holder);
            if (slot?.firstChild) {
              holder!.style.aspectRatio = `1 / ${ratio}`;
              slot.replaceChildren();
            }
          }
        }
      },
      { root, rootMargin: "100% 0px" },
    );
    // 현재 페이지 표시는 별도 관찰자로 — 위 관찰자는 rootMargin 이 화면 한 장이라 화면 밖 페이지도
    // intersecting 이다(그걸로 페이지 번호를 정하면 보이지도 않는 페이지가 표시된다).
    // 밴드는 뷰포트 **상단 15%** — 페이지 이동은 항상 그 페이지를 위에 붙이므로, 도착한 페이지가
    // 곧바로 번호에 반영된다(중앙 밴드로 잡으면 6p 로 갔는데 7 이 표시된다).
    const ioCur = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurPage(Number((e.target as HTMLElement).dataset.page));
        }
      },
      { root, rootMargin: "0px 0px -85% 0px" },
    );
    for (const h of holdersRef.current) {
      if (h) {
        io.observe(h);
        ioCur.observe(h);
      }
    }
    return () => {
      io.disconnect();
      ioCur.disconnect();
    };
  }, [ready, numPages, renderPage, ratio]);

  // 인용 페이지로 이동 — 근거를 클릭한 이유가 "그 페이지를 보려는 것"이므로 열리자마자 거기서 시작한다.
  useEffect(() => {
    if (!ready) return;
    const n = citePage && citePage >= 1 && citePage <= numPages ? citePage : 1;
    // 툴바 번호를 외부(근거 클릭·문서 교체)와 맞추는 동기화 — 스크롤이 없는 1p 이동에는 관찰자가
    // 발화하지 않아 여기서 직접 세워야 한다. 렌더 파생값이 아니므로 cascading 렌더는 이 한 번뿐.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurPage(n);
    if (n > 1) holdersRef.current[n - 1]?.scrollIntoView({ block: "start" });
  }, [ready, citePage, numPages]);

  // 배율이 바뀌면 진행 중인 렌더만 버린다 — 그려진 canvas 교체·폐기는 재생성된 관찰자가 맡는다
  // (보이는 페이지는 새 배율로 다시 그리고, 화면 밖 페이지는 퇴장 분기가 비운다).
  const changeZoom = (next: number) => {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(next.toFixed(2))));
    if (z === zoom) return;
    for (const t of tasksRef.current.values()) t.cancel();
    tasksRef.current.clear();
    const stay = curPage;
    setZoom(z);
    // 배율이 바뀌면 페이지 높이가 통째로 달라져 같은 scrollTop 이 다른 페이지를 가리킨다(6p 에서
    // 확대하면 5p 로 밀린다). 새 폭이 커밋된 다음 프레임에 보던 페이지를 다시 위에 붙인다.
    requestAnimationFrame(() => holdersRef.current[stay - 1]?.scrollIntoView({ block: "start" }));
  };

  const goto = (n: number) => {
    const t = Math.min(numPages, Math.max(1, n));
    setCurPage(t);
    holdersRef.current[t - 1]?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="pdfv">
      <div className="pdfbar">
        <button type="button" onClick={() => goto(curPage - 1)} disabled={curPage <= 1}>
          이전
        </button>
        <span className="pg">
          {ready ? `${curPage} / ${numPages}` : "여는 중…"}
        </span>
        <button type="button" onClick={() => goto(curPage + 1)} disabled={curPage >= numPages}>
          다음
        </button>
        <span className="zoom">
          <button
            type="button"
            aria-label="축소"
            onClick={() => changeZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
          >
            <IconMinus width={14} height={14} />
          </button>
          <b>{Math.round(zoom * 100)}%</b>
          <button
            type="button"
            aria-label="확대"
            onClick={() => changeZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
          >
            <IconPlus width={14} height={14} />
          </button>
        </span>
      </div>

      <div className="pdfscroll" ref={scrollRef}>
        {!ready && <div className="pdfload"><div className="spin" /></div>}
        {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={"pdfpage" + (n === citePage ? " cited" : "")}
            data-page={n}
            ref={(el) => {
              holdersRef.current[n - 1] = el;
            }}
            // 자리표시 높이는 폭 기반 비율로 — 고정 px 이면 패널 폭이 바뀔 때 스크롤 길이가 어긋난다.
            // 확대는 페이지 폭 자체를 키운다(canvas 는 width:100% 라 여기에 따라온다). 렌더 배율도
            // 같은 zoom 을 쓰므로 픽셀도 함께 올라가고, 넘치는 폭은 .pdfscroll 이 가로 스크롤한다.
            style={{ aspectRatio: `1 / ${ratio}`, width: `${zoom * 100}%` }}
          >
            <div className="cv" />
            {n === citePage && <span className="citetag">인용 {n}p</span>}
          </div>
        ))}
      </div>

      <style jsx>{`
        .pdfv {
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }
        .pdfbar {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fff;
          border-bottom: 1px solid var(--line);
          font-size: 12px;
        }
        .pdfbar button {
          border: 1px solid var(--line2);
          background: #fff;
          border-radius: 8px;
          padding: 5px 9px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink2);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
        }
        .pdfbar button:hover:not(:disabled) {
          border-color: var(--blue);
          color: var(--blue-d);
        }
        .pdfbar button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .pg {
          font-weight: 700;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .zoom {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .zoom b {
          font-size: 11.5px;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
          min-width: 34px;
          text-align: center;
        }
        .pdfscroll {
          flex: 1;
          min-height: 0;
          overflow: auto;
          background: var(--bg2);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pdfpage {
          flex: 0 0 auto;
          position: relative;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(14, 21, 36, 0.06);
        }
        .cv {
          display: block;
        }
        /* 인용 페이지 강조(시안 컨펌 대상) */
        .pdfpage.cited {
          border: 2px solid var(--blue);
          box-shadow: 0 4px 14px rgba(47, 107, 255, 0.22);
        }
        .citetag {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 1;
          background: var(--blue);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          padding: 3px 7px;
        }
        .pdfload {
          display: grid;
          place-items: center;
          padding: 40px 0;
        }
        .spin {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid var(--line);
          border-top-color: var(--blue);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .spin {
            animation-duration: 1.6s;
          }
        }
      `}</style>
    </div>
  );
}
