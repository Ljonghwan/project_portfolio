"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- 아래 사유로 네이티브 <a> 를 쓴다. */
/* 랜딩 CTA·로고 는 네이티브 <a> 로 둔다: styled-jsx 스코프 해시가 <Link>(컴포넌트)의 <a> 에는 안 붙어
   .btn/.logo 등 스코프 스타일이 적용되지 않는다(버튼이 스타일 없이 깨짐). 랜딩→앱 진입은 풀네비여도 무방. */

import { useEffect, useRef } from "react";
import { Prism } from "@/components/Prism";
import { SiteFooter } from "@/components/SiteFooter";

export default function LandingPage() {
  const progRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prog = progRef.current;
    const navEl = navRef.current;
    const pin = pinRef.current;
    // 노드는 마운트 시 1회만 캐싱 (매 스크롤 재조회 방지)
    const blobs = Array.from(document.querySelectorAll<HTMLElement>(".blob"));
    const scenes = pin
      ? Array.from(pin.querySelectorAll<HTMLElement>(".scene"))
      : [];
    const items = pin
      ? Array.from(pin.querySelectorAll<HTMLElement>(".item"))
      : [];

    // rAF 게이팅: 프레임당 1회, 읽기(getBoundingClientRect) 먼저 → 쓰기 나중 (레이아웃 스래싱 방지)
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = document.documentElement;
      const top = h.scrollTop;
      const sc = top / (h.scrollHeight - h.clientHeight || 1);
      const pinRect = pin?.getBoundingClientRect();
      const pinTotal = pin ? pin.offsetHeight - window.innerHeight : 0;

      if (prog) prog.style.width = sc * 100 + "%";
      navEl?.classList.toggle("stuck", top > 8);
      blobs.forEach((b, i) => {
        b.style.transform = `translateY(${top * (i ? 0.06 : 0.1)}px)`;
      });
      if (pinRect && pinTotal > 0) {
        const p = Math.min(Math.max(-pinRect.top / pinTotal, 0), 0.999);
        const idx = Math.min(scenes.length - 1, Math.floor(p * scenes.length));
        scenes.forEach((s, i) => s.classList.toggle("on", i === idx));
        items.forEach((s, i) => s.classList.toggle("on", i === idx));
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    update();

    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));

    const animateCount = (el: HTMLElement) => {
      const to = +(el.dataset.to || "0");
      const suf = el.dataset.suffix || "";
      let s: number | null = null;
      const dur = 1100;
      const tick = (t: number) => {
        if (s === null) s = t;
        const p = Math.min((t - s) / dur, 1);
        el.textContent = Math.round(p * to) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const sio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll<HTMLElement>(".n").forEach(animateCount);
            sio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    if (statsRef.current) sio.observe(statsRef.current);

    // 배경 영상(below-the-fold)은 뷰포트 진입 시에만 로드·재생 (데모 영상과 이중 다운로드 방지)
    const bg = bgVideoRef.current;
    let bgIo: IntersectionObserver | null = null;
    if (bg) {
      bgIo = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) bg.play().catch(() => {});
            else bg.pause();
          });
        },
        { threshold: 0.1 }
      );
      bgIo.observe(bg);
    }

    return () => {
      document.removeEventListener("scroll", onScroll);
      io.disconnect();
      sio.disconnect();
      bgIo?.disconnect();
    };
  }, []);

  return (
    <div className="lp">
      <div className="progress" ref={progRef} />
      <nav ref={navRef}>
        <div className="wrap">
          {/* 로고=홈(카드#019 7). CTA 와 같은 이유로 네이티브 <a>(위 주석). */}
          <a className="logo" href="/">
            <span className="mark">
              <Prism />
            </span>{" "}
            Candour
          </a>
          <div className="links">
            <a className="navlink" href="#how">
              동작방식
            </a>
            <a className="navlink" href="#demo">
              데모영상
            </a>
            <a className="navlink" href="#trust">
              신뢰
            </a>
            <a className="navlink" href="#links">
              링크
            </a>
            <a href="/login" className="btn btn-primary" style={{ padding: "9px 18px" }}>
              무료 시작
            </a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <span className="blob b1" />
        <span className="blob b2" />
        <div className="wrap">
          <div>
            <span className="eyebrow reveal in">
              <span className="dot" />
              사실만, 중립적으로 답하는 AI 대변인
            </span>
            <h1 className="reveal in d1">
              당신의 이력서가
              <br />
              <span className="g">스스로 답합니다</span>
            </h1>
            <p className="sub reveal in d2">
              지원자가 등록한 자료로만 답하는 채용 특화 AI. 지어내지 않고, 어느
              편도 들지 않습니다. 인사담당자에게 제출용 링크 하나만 보내세요.
            </p>
            <div className="cta reveal in d3">
              <a href="/login" className="btn btn-primary btn-lg">
                무료로 시작하기 →
              </a>
              <a href="#demo" className="btn btn-ghost btn-lg">
                데모 영상 보기
              </a>
            </div>
            <div
              className="reveal in d3"
              style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}
            >
              카드 등록 없이 시작 · 1분이면 링크 생성
            </div>
          </div>
          <div className="chatcard reveal in d2">
            <div className="cc-top">
              <i />
              <i />
              <i />
              <span className="t">인사담당자 ↔ AI 대변인</span>
            </div>
            <div className="cc-msg hr" style={{ animationDelay: ".2s" }}>
              <div className="cc-b">대규모 트래픽 경험이 있나요?</div>
            </div>
            <div className="cc-msg ai" style={{ animationDelay: ".7s" }}>
              <div className="cc-b">
                일 평균 <b>12만 건</b>의 결제 트랜잭션을 처리하는 시스템을
                운영했습니다.
                <br />
                <span className="cc-src">
                  <span className="dot" />
                  2026-07-08 기준 · 경력기술서 2p 근거
                </span>
              </div>
            </div>
            <div className="cc-msg hr" style={{ animationDelay: "1.4s" }}>
              <div className="cc-b">주말에 뭐 하세요?</div>
            </div>
            <div className="cc-msg ai" style={{ animationDelay: "1.9s" }}>
              <div className="cc-b" style={{ color: "#C0343A" }}>
                인사·구인과 무관한 질문에는 답변하지 않습니다.
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="logos">
        <div className="wrap">
          <div className="row reveal">
            <span>스타트업</span>
            <span>·</span>
            <span>대기업 채용팀</span>
            <span>·</span>
            <span>헤드헌팅</span>
            <span>·</span>
            <span>프리랜서</span>
            <span>·</span>
            <span>부트캠프 수료생</span>
          </div>
        </div>
      </div>

      <section className="stats">
        <div className="wrap">
          <div className="grid" ref={statsRef}>
            <div className="stat reveal">
              <div className="n" data-to="100" data-suffix="%">
                0
              </div>
              <div className="l">사실·중립 답변</div>
            </div>
            <div className="stat reveal d1">
              <div className="n" data-to="0" data-suffix="">
                0
              </div>
              <div className="l">지어낸 정보</div>
            </div>
            <div className="stat reveal d2">
              <div className="n" data-to="2" data-suffix="종">
                0
              </div>
              <div className="l">범용·회사 맞춤 링크</div>
            </div>
            <div className="stat reveal d3">
              <div className="n" data-to="24" data-suffix="시간">
                0
              </div>
              <div className="l">언제나 최신 자료 기반</div>
            </div>
          </div>
        </div>
      </section>

      <section className="blk" id="how">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="kicker">How it works</div>
            <h2>3단계면 충분합니다</h2>
            <p>
              이력서·경력기술서·포트폴리오를 올리면 AI가 자료를 이해하고, 링크
              하나로 인사담당자의 질문에 답합니다.
            </p>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="img i1">
                <span className="n">STEP 1</span>
                <svg
                  viewBox="0 0 120 120"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="30"
                    y="40"
                    width="46"
                    height="58"
                    rx="5"
                    fill="rgba(255,255,255,.14)"
                  />
                  <path d="M44 56h18M44 68h18M44 80h12" />
                  <path
                    d="M74 34l14 14M74 34v14h14"
                    fill="rgba(255,255,255,.14)"
                  />
                  <path d="M60 30V8M60 8l-9 9M60 8l9 9" />
                </svg>
              </div>
              <div className="tx">
                <h3>자료 등록</h3>
                <p>
                  이력서·경력기술서·포트폴리오·이미지·영상을 업로드하면 AI가
                  페이지 단위로 이해합니다.
                </p>
              </div>
            </div>
            <div className="step reveal d1">
              <div className="img i2">
                <span className="n">STEP 2</span>
                <svg
                  viewBox="0 0 120 120"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M52 68a26 26 0 0 0 39 3l14-14a26 26 0 0 0-37-37l-9 9" />
                  <path d="M68 52a26 26 0 0 0-39-3L15 63a26 26 0 0 0 37 37l9-9" />
                </svg>
              </div>
              <div className="tx">
                <h3>링크 생성</h3>
                <p>
                  범용 링크 또는 회사 맞춤 링크를 발급해 제출하고, 유효 여부를
                  직접 켜고 끄거나 재발급합니다.
                </p>
              </div>
            </div>
            <div className="step reveal d2">
              <div className="img i3">
                <span className="n">STEP 3</span>
                <svg
                  viewBox="0 0 120 120"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M24 40a8 8 0 018-8h34a8 8 0 018 8v18a8 8 0 01-8 8H44l-12 10V66h0a8 8 0 01-8-8z"
                    fill="rgba(255,255,255,.14)"
                  />
                  <path d="M36 46h26M36 54h18" />
                  <circle cx="82" cy="74" r="16" fill="rgba(255,255,255,.2)" />
                  <path d="M75 74l5 5 9-10" />
                </svg>
              </div>
              <div className="tx">
                <h3>AI가 대신 답변</h3>
                <p>인사담당자가 물으면 AI가 근거 자료·출처와 함께 사실만 답합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blk video" id="demo">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="kicker">Demo</div>
            <h2>실제로 이렇게 동작합니다</h2>
            <p>
              인사담당자가 질문하면 AI 대변인이 근거와 함께 답하는 흐름을 데모로
              보세요.
            </p>
          </div>
          <div className="vframe reveal">
            <video
              src="/media/demo.webm"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </div>
        </div>
      </section>

      <section className="blk showcase">
        <div className="wrap">
          <div className="cols">
            <div className="txt reveal">
              <h2>글만이 아니라, 자료와 함께</h2>
              <p>
                답변에는 텍스트뿐 아니라 이미지·PDF·파일·링크가 함께 붙습니다.
                인사담당자는 근거를 바로 확인할 수 있습니다.
              </p>
              <ul>
                <li>이미지엔 AI 캡션, 영상엔 썸네일·요약</li>
                <li>모든 답변에 출처와 타임스탬프 표기</li>
                <li>
                  보유 정보에 없으면 &quot;해당 정보 없음&quot; — 지어내지 않음
                </li>
              </ul>
            </div>
            <div className="answer reveal d1">
              <div className="ab">
                네. 결제 도메인에서 <b>일 평균 12만 건</b>의 트랜잭션을
                처리했습니다.
                <div className="rich">
                  <div className="thumb">
                    <svg
                      viewBox="0 0 64 46"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="6"
                        y="7"
                        width="22"
                        height="14"
                        rx="3"
                        fill="rgba(255,255,255,.18)"
                      />
                      <rect
                        x="36"
                        y="7"
                        width="22"
                        height="14"
                        rx="3"
                        fill="rgba(255,255,255,.18)"
                      />
                      <rect
                        x="21"
                        y="28"
                        width="22"
                        height="12"
                        rx="3"
                        fill="rgba(255,255,255,.28)"
                      />
                      <path d="M17 21v4h15v3M47 21v4H32" />
                    </svg>
                  </div>
                  <div className="fc">
                    <span className="fi">PDF</span>경력기술서.pdf
                  </div>
                  <div className="fc link">
                    <span className="fi">↗</span>포트폴리오
                  </div>
                </div>
                <div>
                  <span className="src">
                    <span className="dot" />
                    2026-07-08 기준 · 경력기술서 2p 근거
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blk pin" id="trust" ref={pinRef}>
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="kicker">Trust by design</div>
            <h2>신뢰는 구조로 만듭니다</h2>
          </div>
          <div className="sticky">
            <div className="visual">
              <div className="scene on" data-i="0">
                <div>
                  <div className="big">
                    <TrustDoc />
                  </div>
                  <div className="cap">
                    등록된 자료 밖은 답하지 않습니다.
                    <br />
                    없으면 &quot;해당 정보 없음&quot;.
                  </div>
                </div>
              </div>
              <div className="scene" data-i="1">
                <div>
                  <div className="big">
                    <TrustScale />
                  </div>
                  <div className="cap">
                    지원자 편이 아닌
                    <br />
                    100% 중립 입장으로 서술합니다.
                  </div>
                </div>
              </div>
              <div className="scene" data-i="2">
                <div>
                  <div className="big">
                    <TrustCert />
                  </div>
                  <div className="cap">
                    모든 답변에 출처·시점을 동결해
                    <br />
                    증빙으로 남깁니다.
                  </div>
                </div>
              </div>
              <div className="scene" data-i="3">
                <div>
                  <div className="big">
                    <TrustShield />
                  </div>
                  <div className="cap">
                    유효 on/off·재발급 + 악의·무관 질문
                    <br />
                    임계 초과 시 링크 자동 비활성화.
                  </div>
                </div>
              </div>
            </div>
            <div className="list">
              <div className="item on" data-i="0">
                <h3>① 사실만</h3>
                <p>보유 자료에 근거해서만 답하고, 없으면 없다고 말합니다.</p>
              </div>
              <div className="item" data-i="1">
                <h3>② 중립적으로</h3>
                <p>과장·편들기 없이 중립 관점으로 서술합니다.</p>
              </div>
              <div className="item" data-i="2">
                <h3>③ 증빙으로</h3>
                <p>출처와 타임스탬프를 답변에 동결해 남깁니다.</p>
              </div>
              <div className="item" data-i="3">
                <h3>④ 안전하게</h3>
                <p>유효 on/off·재발급과 악용 자동방지로 링크를 통제합니다.</p>
              </div>
            </div>
          </div>
          <div className="spacer" />
          <div className="spacer" />
          <div className="spacer" />
        </div>
      </section>

      <section className="blk" id="links" style={{ background: "var(--bg2)" }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="kicker">Two link types</div>
            <h2>상황에 맞는 두 가지 링크</h2>
          </div>
          <div className="links2">
            <div className="lt uni reveal">
              <span className="tag">범용링크</span>
              <h3>누구에게나 하나로</h3>
              <p>
                이름·회사명을 입력받고 대화를 시작합니다. 여러 회사에 같은
                링크로 제출.
              </p>
            </div>
            <div className="lt tgt reveal d1">
              <span className="tag">회사 맞춤 링크</span>
              <h3>그 회사에 딱 맞게</h3>
              <p>
                익명 즉시 대화 + 구직자가 등록한 회사별 Q&amp;A·메모로 맞춤 답변.
                지원동기·비전 질문까지.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bgvideo">
        <video
          ref={bgVideoRef}
          src="/media/demo.webm"
          loop
          muted
          playsInline
          preload="none"
        />
        <div className="scrim" />
        <div className="inner reveal">
          <h2>지원자의 자료가, 대화가 됩니다</h2>
          <p>
            텍스트·이미지·PDF·링크를 넘나드는 답변. 인사담당자는 궁금한 걸 묻고,
            AI는 근거와 함께 답합니다.
          </p>
        </div>
      </section>

      <section className="blk">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>당신을 가장 잘 아는 대변인을 만드세요</h2>
            <p>1분이면 링크가 생성됩니다. 카드 등록 없이 무료로 시작하세요.</p>
            <a href="/login" className="btn btn-white btn-lg">
              무료로 시작하기 →
            </a>
          </div>
        </div>
      </section>

      {/* 자체 푸터를 공용 SiteFooter 로 교체(카드#016 3-3 — 로고·카피 문구는 그대로 이관하고
          이용약관·개인정보처리방침 링크가 추가됐다). 폭은 랜딩 .wrap 과 같은 1180px 기본값. */}
      <SiteFooter />

      <style jsx>{`
        .lp {
          color: var(--ink);
          background: #fff;
          line-height: 1.6;
        }
        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
        }
        h1,
        h2,
        h3 {
          letter-spacing: -0.03em;
          font-weight: 800;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 10px;
          padding: 13px 24px;
          font-family: var(--sans);
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform var(--t), box-shadow var(--t), background var(--t);
        }
        .btn-primary {
          background: var(--blue);
          color: #fff;
          box-shadow: 0 6px 18px rgba(47, 107, 255, 0.28);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(47, 107, 255, 0.36);
          background: var(--blue-d);
        }
        .btn-ghost {
          background: #fff;
          border: 1px solid var(--line2);
          color: var(--ink);
        }
        .btn-ghost:hover {
          border-color: var(--blue);
          color: var(--blue-d);
          transform: translateY(-2px);
        }
        .btn-lg {
          padding: 16px 30px;
          font-size: 16px;
          border-radius: 12px;
        }
        .progress {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          width: 0;
          background: linear-gradient(90deg, var(--blue), #7aa5ff);
          z-index: 60;
          transition: width 0.1s linear;
        }
        nav {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(12px);
          z-index: 50;
          border-bottom: 1px solid transparent;
          transition: box-shadow var(--t), border-color var(--t);
        }
        nav.stuck {
          border-color: var(--line);
          box-shadow: 0 6px 20px rgba(14, 21, 36, 0.05);
        }
        nav .wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .logo {
          font-weight: 800;
          font-size: 19px;
          color: var(--ink);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 9px;
          letter-spacing: -0.02em;
        }
        .logo:focus-visible {
          outline: 2px solid var(--blue);
          outline-offset: 3px;
          border-radius: 6px;
        }
        .logo .mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--ink);
          color: #fff;
          display: grid;
          place-items: center;
        }
        .logo .mark :global(svg) {
          width: 19px;
          height: 19px;
        }
        nav .links {
          display: flex;
          gap: 28px;
          font-size: 14.5px;
          color: var(--ink2);
          font-weight: 600;
          align-items: center;
        }
        nav .links a {
          position: relative;
          padding: 4px 0;
        }
        nav .links a.navlink::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          height: 2px;
          width: 0;
          background: var(--blue);
          transition: width var(--t);
        }
        nav .links a.navlink:hover {
          color: var(--blue-d);
        }
        nav .links a.navlink:hover::after {
          width: 100%;
        }
        .reveal {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.7s cubic-bezier(0.2, 0.7, 0.3, 1),
            transform 0.7s cubic-bezier(0.2, 0.7, 0.3, 1);
        }
        .reveal.in {
          opacity: 1;
          transform: none;
        }
        .reveal.d1 {
          transition-delay: 0.08s;
        }
        .reveal.d2 {
          transition-delay: 0.16s;
        }
        .reveal.d3 {
          transition-delay: 0.24s;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
        .hero {
          padding: 96px 0 64px;
          position: relative;
          overflow: hidden;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(10px);
          pointer-events: none;
          z-index: 0;
        }
        .blob.b1 {
          width: 520px;
          height: 520px;
          right: -120px;
          top: -120px;
          background: radial-gradient(circle, #cfe0ff88, transparent 66%);
        }
        .blob.b2 {
          width: 420px;
          height: 420px;
          left: -160px;
          bottom: -160px;
          background: radial-gradient(circle, #e7eeff88, transparent 66%);
        }
        .hero .wrap {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 48px;
          align-items: center;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--blue-t);
          color: var(--blue-d);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 22px;
        }
        .eyebrow .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--blue);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(47, 107, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 0 7px rgba(47, 107, 255, 0);
          }
        }
        .hero h1 {
          font-size: 60px;
          line-height: 1.08;
          max-width: 14ch;
        }
        .hero h1 .g {
          color: var(--blue);
        }
        .hero p.sub {
          margin-top: 22px;
          font-size: 19px;
          color: var(--ink2);
          max-width: 44ch;
        }
        .hero .cta {
          margin-top: 34px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .chatcard {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(14, 21, 36, 0.12);
          padding: 16px;
          transition: transform var(--t);
        }
        .chatcard:hover {
          transform: translateY(-4px);
        }
        .cc-top {
          display: flex;
          gap: 8px;
          padding: 2px 4px 12px;
          align-items: center;
        }
        .cc-top i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--line2);
        }
        .cc-top .t {
          margin-left: 8px;
          font-size: 12px;
          color: var(--muted);
        }
        .cc-msg {
          margin: 8px 0;
          max-width: 88%;
          width: fit-content;
          opacity: 0;
          transform: translateY(8px);
          animation: rise 0.5s forwards;
        }
        @keyframes rise {
          to {
            opacity: 1;
            transform: none;
          }
        }
        .cc-msg.hr {
          margin-left: auto;
        }
        .cc-b {
          border-radius: 12px;
          padding: 10px 13px;
          font-size: 13.5px;
        }
        .cc-msg.hr .cc-b {
          background: var(--blue);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .cc-msg.ai .cc-b {
          background: var(--bg2);
          border: 1px solid var(--line);
          border-bottom-left-radius: 4px;
        }
        .cc-src {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--blue-t);
          color: var(--blue-d);
          border-radius: 7px;
          padding: 4px 9px;
          font-size: 10.5px;
          font-weight: 600;
          margin-top: 8px;
        }
        .cc-src .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--blue);
        }
        .logos {
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          background: var(--bg2);
          padding: 22px 0;
        }
        .logos .row {
          display: flex;
          gap: 40px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          color: var(--muted);
          font-weight: 700;
          font-size: 15px;
          opacity: 0.8;
        }
        .stats {
          padding: 64px 0;
        }
        .stats .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          text-align: center;
        }
        .stat .n {
          font-size: 46px;
          font-weight: 800;
          color: var(--blue);
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
        }
        .stat .l {
          font-size: 14px;
          color: var(--muted);
          margin-top: 4px;
        }
        section.blk {
          padding: 80px 0;
        }
        .sec-head {
          text-align: center;
          margin-bottom: 48px;
        }
        .sec-head .kicker {
          color: var(--blue);
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .sec-head h2 {
          font-size: 38px;
          margin-top: 10px;
        }
        .sec-head p {
          color: var(--muted);
          margin-top: 12px;
          font-size: 16px;
          max-width: 52ch;
          margin-left: auto;
          margin-right: auto;
        }
        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }
        .step {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
          transition: transform var(--t), box-shadow var(--t);
        }
        .step:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 40px rgba(14, 21, 36, 0.1);
        }
        .step .img {
          height: 170px;
          position: relative;
          display: grid;
          place-items: center;
          color: #fff;
          overflow: hidden;
        }
        .step .img.i1 {
          background: linear-gradient(135deg, #2f6bff, #77a4ff);
        }
        .step .img.i2 {
          background: linear-gradient(135deg, #1e293b, #3a568f);
        }
        .step .img.i3 {
          background: linear-gradient(135deg, #1f9d5b, #66c79a);
        }
        .step .img :global(svg) {
          width: 120px;
          height: 120px;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.22));
        }
        .step .img .n {
          position: absolute;
          top: 12px;
          left: 14px;
          font-size: 12px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.22);
          padding: 4px 10px;
          border-radius: 999px;
          backdrop-filter: blur(4px);
        }
        .step .tx {
          padding: 20px;
        }
        .step h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .step p {
          font-size: 14px;
          color: var(--muted);
        }
        .video {
          background: var(--bg2);
        }
        .vframe {
          max-width: 940px;
          margin: 0 auto;
          border: 1px solid var(--line);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(14, 21, 36, 0.16);
          background: #fff;
          position: relative;
          aspect-ratio: 16 / 9;
          line-height: 0;
        }
        .vframe :global(video) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .bgvideo {
          position: relative;
          min-height: 420px;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: #fff;
          text-align: center;
        }
        .bgvideo :global(video) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .bgvideo .scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            120deg,
            rgba(14, 21, 36, 0.86),
            rgba(30, 79, 208, 0.72)
          );
        }
        .bgvideo .inner {
          position: relative;
          z-index: 2;
          padding: 60px 24px;
          max-width: 720px;
        }
        .bgvideo h2 {
          font-size: 36px;
          margin-bottom: 14px;
        }
        /* CTA(/l/demo) 제거 후 p 가 섹션 마지막 요소 — 하단 여백은 .inner padding 이 담당한다. */
        .bgvideo p {
          color: #dbe5ff;
          font-size: 17px;
        }
        .showcase .cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        .showcase .txt h2 {
          font-size: 32px;
          margin-bottom: 14px;
        }
        .showcase .txt p {
          color: var(--ink2);
          font-size: 16px;
          margin-bottom: 14px;
        }
        .showcase .txt ul {
          margin: 0;
          padding: 0;
        }
        .showcase .txt li {
          color: var(--ink2);
          font-size: 15px;
          margin: 8px 0 8px 4px;
          list-style: none;
          padding-left: 26px;
          position: relative;
        }
        .showcase .txt li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: var(--blue);
          font-weight: 800;
        }
        .answer {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 18px 44px rgba(14, 21, 36, 0.1);
          padding: 18px;
        }
        .answer .ab {
          background: var(--bg2);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 14px;
          font-size: 14px;
        }
        .answer .rich {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .answer .thumb {
          width: 100px;
          height: 72px;
          border-radius: 9px;
          background: linear-gradient(135deg, #1e293b, #2f6bff);
          position: relative;
          transition: transform var(--t);
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .answer .thumb :global(svg) {
          width: 64px;
          height: 46px;
        }
        .answer .thumb:hover {
          transform: scale(1.05);
        }
        .answer .fc {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 9px;
          padding: 8px 11px;
          font-size: 12px;
          font-weight: 600;
          transition: var(--t);
        }
        .answer .fc:hover {
          border-color: var(--blue);
        }
        .answer .fc .fi {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: var(--danger);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 9px;
          font-weight: 700;
        }
        .answer .fc.link .fi {
          background: var(--blue);
        }
        .answer .src {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--blue-t);
          color: var(--blue-d);
          border-radius: 7px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 12px;
        }
        .answer .src .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--blue);
        }
        .pin {
          position: relative;
        }
        .pin .sticky {
          position: sticky;
          top: 80px;
          height: calc(100vh - 120px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        .pin .visual {
          position: relative;
          height: 360px;
          border-radius: 20px;
          border: 1px solid var(--line);
          background: var(--bg2);
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .pin .visual .scene {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          opacity: 0;
          transform: scale(0.96);
          transition: opacity 0.5s, transform 0.5s;
          text-align: center;
          padding: 30px;
        }
        .pin .visual .scene.on {
          opacity: 1;
          transform: none;
        }
        .pin .visual .big {
          margin-bottom: 16px;
          display: flex;
          justify-content: center;
        }
        .pin .visual .big :global(svg) {
          width: 116px;
          height: 116px;
        }
        .pin .visual .cap {
          color: var(--ink2);
          font-size: 15px;
        }
        .pin .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pin .item {
          border-left: 3px solid var(--line);
          padding: 14px 18px;
          border-radius: 0 12px 12px 0;
          transition: var(--t);
        }
        .pin .item.on {
          border-color: var(--blue);
          background: var(--blue-t);
        }
        .pin .item h3 {
          font-size: 19px;
          margin-bottom: 4px;
        }
        .pin .item p {
          font-size: 14px;
          color: var(--muted);
        }
        .pin .spacer {
          height: 80vh;
        }
        .links2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .lt {
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 26px;
          transition: transform var(--t), box-shadow var(--t), border-color var(--t);
        }
        .lt:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(14, 21, 36, 0.09);
          border-color: var(--blue);
        }
        .lt .tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          border-radius: 7px;
          padding: 4px 10px;
          margin-bottom: 12px;
        }
        .lt.uni .tag {
          background: var(--blue-t);
          color: var(--blue-d);
        }
        .lt.tgt .tag {
          background: #eaf7f0;
          color: var(--ok);
        }
        .lt h3 {
          font-size: 22px;
          margin-bottom: 8px;
        }
        .lt p {
          color: var(--muted);
          font-size: 14.5px;
        }
        .cta-band {
          background: linear-gradient(135deg, #1e293b, #2f6bff);
          color: #fff;
          border-radius: 24px;
          padding: 56px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-band h2 {
          font-size: 38px;
          margin-bottom: 12px;
        }
        .cta-band p {
          color: #d7e3ff;
          font-size: 17px;
          margin-bottom: 26px;
        }
        .cta-band :global(.btn-white) {
          background: #fff;
          color: var(--blue-d);
        }
        .cta-band :global(.btn-white):hover {
          transform: translateY(-2px);
        }
        @media (max-width: 960px) {
          .hero .wrap {
            grid-template-columns: 1fr;
          }
          .hero h1 {
            font-size: 42px;
          }
          .stats .grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .steps {
            grid-template-columns: 1fr;
          }
          .showcase .cols {
            grid-template-columns: 1fr;
          }
          .links2 {
            grid-template-columns: 1fr;
          }
          .pin .sticky {
            grid-template-columns: 1fr;
            height: auto;
            position: static;
          }
          .pin .spacer {
            display: none;
          }
          .pin .visual {
            height: 240px;
          }
        }
        @media (max-width: 760px) {
          nav .links a.navlink {
            display: none;
          }
          nav .links {
            gap: 0;
          }
          nav .wrap {
            height: 58px;
          }
        }
        @media (max-width: 600px) {
          .wrap {
            padding: 0 18px;
          }
          .hero {
            padding: 56px 0 36px;
          }
          .hero h1 {
            font-size: 32px;
            line-height: 1.18;
          }
          .hero p.sub {
            font-size: 15.5px;
            margin-top: 16px;
          }
          .eyebrow {
            font-size: 12px;
            margin-bottom: 16px;
          }
          .hero .cta {
            margin-top: 24px;
            gap: 10px;
          }
          .btn-lg {
            padding: 13px 22px;
            font-size: 15px;
          }
          .hero .cta .btn,
          .hero .cta a {
            flex: 1;
            justify-content: center;
          }
          section.blk {
            padding: 52px 0;
          }
          .sec-head {
            margin-bottom: 32px;
          }
          .sec-head h2 {
            font-size: 26px;
          }
          .sec-head p {
            font-size: 14.5px;
            margin-top: 10px;
          }
          .stats {
            padding: 44px 0;
          }
          .stat .n {
            font-size: 36px;
          }
          .stats .grid {
            gap: 24px 12px;
          }
          .showcase .txt h2 {
            font-size: 24px;
          }
          .bgvideo {
            min-height: 340px;
          }
          .bgvideo h2 {
            font-size: 26px;
          }
          .bgvideo p {
            font-size: 15px;
          }
          .cta-band {
            padding: 34px 22px;
            border-radius: 18px;
          }
          .cta-band h2 {
            font-size: 26px;
          }
          .cta-band p {
            font-size: 15px;
          }
          .pin .item h3 {
            font-size: 17px;
          }
          .logos {
            padding: 18px 0;
          }
          .logos .row {
            gap: 8px 14px;
            font-size: 13px;
          }
          .logos .row span:nth-child(even) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function TrustDoc() {
  return (
    <svg viewBox="0 0 116 116" fill="none" stroke="#2F6BFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="26" y="18" width="52" height="66" rx="6" fill="rgba(47,107,255,.08)" />
      <path d="M38 38h28M38 50h28M38 62h16" />
      <circle cx="78" cy="78" r="18" fill="#fff" />
      <path d="M70 78l6 6 11-12" />
    </svg>
  );
}
function TrustScale() {
  return (
    <svg viewBox="0 0 116 116" fill="none" stroke="#2F6BFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M58 20v72M34 92h48" />
      <path d="M30 34h56M58 24l0 4" />
      <path d="M30 34l-12 22h24zM18 56a12 8 0 0024 0" fill="rgba(47,107,255,.08)" />
      <path d="M86 34l-12 22h24zM74 56a12 8 0 0024 0" fill="rgba(47,107,255,.08)" />
    </svg>
  );
}
function TrustCert() {
  return (
    <svg viewBox="0 0 116 116" fill="none" stroke="#2F6BFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 20h40a4 4 0 014 4v72l-10-7-8 7-8-7-8 7-10-7V24a4 4 0 014-4z" fill="rgba(47,107,255,.08)" />
      <path d="M42 38h24M42 50h24M42 62h14" />
      <circle cx="76" cy="72" r="14" fill="#fff" />
      <path d="M69 72l5 5 9-9" />
    </svg>
  );
}
function TrustShield() {
  return (
    <svg viewBox="0 0 116 116" fill="none" stroke="#2F6BFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M58 16l30 12v22c0 22-14 34-30 42-16-8-30-20-30-42V28z" fill="rgba(47,107,255,.08)" />
      <circle cx="58" cy="54" r="15" fill="#fff" />
      <path d="M58 46v9l6 4" />
    </svg>
  );
}
