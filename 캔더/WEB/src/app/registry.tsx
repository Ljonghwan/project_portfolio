"use client";

// styled-jsx SSR 레지스트리(App Router 필수 — `next/dist/docs/01-app/02-guides/css-in-js.md` §styled-jsx).
// 이게 없으면 서버가 그린 HTML 에 <style> 이 하나도 실리지 않는다. 브라우저는 스타일 없는 마크업을
// 먼저 그리고 JS 번들이 도착해야 styled-jsx 가 런타임 주입 → 느린 회선에서 화면이 통째로 번쩍인다(FOUC).
// useServerInsertedHTML 이 렌더 중 수집된 규칙을 스트리밍 HTML 에 끼워 넣어 그 창을 없앤다.
import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { createStyleRegistry, StyleRegistry } from "styled-jsx";

export default function StyledJsxRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // 스타일시트는 한 번만 생성한다(lazy initial state) — 매 렌더 새로 만들면 규칙이 유실된다.
  const [jsxStyleRegistry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = jsxStyleRegistry.styles();
    jsxStyleRegistry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={jsxStyleRegistry}>{children}</StyleRegistry>;
}
