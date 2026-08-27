"use client";

import { useEffect, useRef } from "react";

/** 로그인 화면 전용 프리즘 배경(카드#020 A-1).
 *  - 캔버스는 클릭을 먹지 않는다(pointer-events:none) → 좌표는 window 리스너로 받는다.
 *  - rAF 단일 루프 · DPR 캡 2 · document.hidden 정지 · reduced-motion 정지(정적 1프레임). */
export function LoginBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    // 색은 globals.css 토큰 단일 소스에서 읽는다(새 색 도입 금지).
    const css = getComputedStyle(document.documentElement);
    const rgb = (name: string) => {
      const n = parseInt(css.getPropertyValue(name).trim().slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
    };
    const BLUE = rgb("--blue");
    const BLUE_D = rgb("--blue-d");
    const BLUE_T = rgb("--blue-t");
    type C = readonly number[];
    const rgba = (c: C, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const mix = (a: C, b: C, k: number): C => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * k);

    let w = 0;
    let h = 0;
    // 포인터는 정규화 좌표(0~1). 목표값 t* 로 받아 매 프레임 감쇠 추종 — 커서를 튕기듯 따라가지 않는다.
    // 기본 위치는 카드를 피한다 — 좁은 화면은 카드가 가로를 거의 채우므로 위쪽, 넓은 화면은 카드 왼쪽.
    let touched = false;
    let tx = 0.26;
    let ty = 0.3;
    let px = tx;
    let py = ty;

    // seed() 가 스폰 여부를 여기서 판단하므로 리스너 등록보다 먼저 선언한다
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // ── 부유 조각 ──
    // pop = 스폰 진행도. 음수 = 아직 대기(안 그림) · 0~1 = 튀어나오는 중 · 1 = 다 컸다.
    // hx,hy = 제자리. 커서에 밀려난 뒤 여기로 돌아온다.
    type Shard = { x: number; y: number; hx: number; hy: number; vx: number; vy: number; s: number; r: number; vr: number; k: number; pop: number };
    const POP = 0.42; // 팝 지속(초)
    // easeOutBack — 목표 크기를 살짝 넘겼다 제자리로. 게임에서 아이템이 튀어나오는 그 곡선.
    const ease = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;
    /** 조각을 화면 안 임의 위치에 새로 세운다. delay<0 이면 그만큼 기다렸다 튀어나온다. */
    const spawn = (s: Shard, delay: number) => {
      s.x = Math.random() * w;
      s.y = Math.random() * h;
      s.hx = s.x;
      s.hy = s.y;
      s.vx = (Math.random() - 0.5) * 6;
      s.vy = (Math.random() - 0.5) * 6;
      s.s = 26 + Math.random() * 56;
      s.r = Math.random() * Math.PI * 2;
      s.vr = (Math.random() - 0.5) * 0.12;
      s.k = Math.random();
      // reduced-motion 은 정적 1프레임만 그리므로 팝 없이 다 큰 상태로 놓는다
      s.pop = mq.matches ? 1 : delay;
    };
    let shards: Shard[] = [];
    const seed = () => {
      // 면적 기준 상한 — 넓은 화면이라고 무한정 늘지 않게 44개에서 자른다.
      const n = Math.max(14, Math.min(44, Math.round((w * h) / 30000)));
      shards = Array.from({ length: n }, () => {
        const s = {} as Shard;
        spawn(s, -Math.random() * 4); // 최대 1.7초에 걸쳐 하나씩
        return s;
      });
    };

    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      if (!touched) {
        // 카드(min(420px,100%))가 가로를 거의 채우는 좁은 화면에서는 빛의 초점을 위로 올린다
        tx = w < 720 ? 0.5 : 0.26;
        ty = w < 720 ? 0.15 : 0.3;
        px = tx;
        py = ty;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    /** 부유 프리즘 조각: 삼각 조각이 떠다니고 포인터 근처에서 물러나며 밝아진다. */
    const draw = (t: number, dt: number) => {
      const cx = px * w;
      const cy = py * h;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
      g.addColorStop(0, rgba(BLUE_T, 0.85));
      g.addColorStop(1, rgba(BLUE_T, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const R = Math.min(w, h) * 0.3;
      const HOLE = R * 0.3;
      // 조각이 피하는 대상은 빛(px,py)이 아니라 커서 실좌표다 — 지연된 점을 피하면 도망이 아니라 끌려다니는 것처럼 보인다.
      const mx = tx * w;
      const my = ty * h;
      const damp = Math.pow(0.1, dt); // 밀린 속도를 ~1초에 죽인다(프레임레이트 무관)
      for (const s of shards) {
        s.pop += dt / POP;
        if (s.pop < 0) continue; // 아직 대기 중 — 순서대로 하나씩 튀어나오게 한다

        const dx = s.x - mx;
        const dy = s.y - my;
        const d = Math.hypot(dx, dy) || 1;
        let near = 0;
        if (d < R) {
          near = 1 - d / R;
          // 제곱 — 멀리서 슬금슬금 밀리는 대신 코앞에서 확 튄다
          s.vx += (dx / d) * near * near * 1500 * dt;
          s.vy += (dy / d) * near * near * 1500 * dt;
          // 속도만으론 빠르게 지나가는 커서를 못 피한다 → 코앞은 자리째 밀어 커서 주위에 구멍을 판다
          if (d < HOLE) {
            s.x += (dx / d) * (HOLE - d);
            s.y += (dy / d) * (HOLE - d);
          }
        }
        // 밀려난 조각은 제자리로 돌아온다 — 없으면 휘저을수록 가장자리에만 쌓인다
        s.vx += (s.hx - s.x) * 1.4 * dt;
        s.vy += (s.hy - s.y) * 1.4 * dt;
        s.vx *= damp;
        s.vy *= damp;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.r += s.vr * dt;
        // 화면 밖으로 나가면 사라지고 다른 자리에서 다시 뿅 하고 나타난다
        const m = s.s;
        if (s.x < -m || s.x > w + m || s.y < -m || s.y > h + m) {
          spawn(s, 0);
          continue;
        }

        const col =
          s.k < 0.5 ? mix(BLUE_T, BLUE, s.k * 2) : mix(BLUE, BLUE_D, (s.k - 0.5) * 2);
        const grow = s.pop < 1 ? ease(s.pop) : 1;
        const a =
          (0.1 + near * 0.22 + Math.sin(t * 0.5 + s.k * 6) * 0.03) * Math.min(1, s.pop * 1.6);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.r);
        ctx.scale(grow, grow);
        ctx.beginPath();
        ctx.moveTo(0, -s.s * 0.6);
        ctx.lineTo(s.s * 0.55, s.s * 0.45);
        ctx.lineTo(-s.s * 0.55, s.s * 0.45);
        ctx.closePath();
        ctx.fillStyle = rgba(col, Math.max(0.04, a));
        ctx.fill();
        // 확대·축소된 좌표계라 선 굵기는 되돌려 준다(작을 때 실처럼 얇아지지 않게)
        ctx.lineWidth = 1 / grow;
        ctx.strokeStyle = rgba(col, Math.max(0.06, a * 1.6));
        ctx.stroke();
        ctx.restore();
      }
    };

    const frame = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      draw(t, dt);
    };

    let raf: number | null = null;
    let last = 0;
    let clock = 0;

    const loop = (now: number) => {
      // 탭 복귀·첫 프레임의 큰 델타를 잘라 순간 점프를 막는다
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt;
      px += (tx - px) * Math.min(1, dt * 3.2);
      py += (ty - py) * Math.min(1, dt * 3.2);
      frame(clock, dt);
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      // reduced-motion 이거나 숨은 탭이면 루프를 돌리지 않는다. raf 핸들 가드로 중복 실행 방지.
      if (mq.matches) {
        px = tx;
        py = ty;
        // 정적 1프레임이라 팝이 진행되지 않는다 → 대기 중인 조각까지 다 큰 상태로 보여준다
        for (const s of shards) s.pop = 1;
        frame(0, 0);
        return;
      }
      if (raf !== null || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    let rz: number | null = null;
    const onResize = () => {
      if (rz !== null) return;
      rz = requestAnimationFrame(() => {
        rz = null;
        resize();
        if (mq.matches || raf === null) frame(clock, 0);
      });
    };
    const onPointer = (e: PointerEvent) => {
      touched = true;
      // 캔버스 크기로 나눈다 — 세로 스크롤바가 있으면 innerWidth 가 캔버스보다 넓어 회피 중심이 커서에서 어긋난다
      tx = e.clientX / w;
      ty = e.clientY / h;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const onMq = () => {
      stop();
      start();
    };

    resize();
    start();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    mq.addEventListener("change", onMq);

    return () => {
      stop();
      if (rz !== null) cancelAnimationFrame(rz);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="bd" aria-hidden="true" />
      <style jsx>{`
        .bd {
          position: fixed;
          inset: 0;
          z-index: 0;
          display: block;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
