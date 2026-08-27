"use client";

// 덴탈인 ADMIN 로고 — 사이드바(AdminShell)와 로그인 화면이 공유.
//   민트 그라데이션 배지 + 치아 마크 + "덴탈인" 워드마크 + ADMIN 표기.
//   variant: "dark"(어두운 사이드바, 흰 워드마크) / "light"(밝은 배경=로그인, 잉크 워드마크).
//   collapsed=true면 배지만(사이드바 접힘).
export default function AdminLogo({
  variant = "dark",
  collapsed = false,
  badgeSize = 34,
  fontSize = 20,
}: {
  variant?: "dark" | "light";
  collapsed?: boolean;
  badgeSize?: number;
  fontSize?: number;
}) {
  const wordColor = variant === "dark" ? "#fff" : "#11161D";
  const accentColor = variant === "dark" ? "#22D3BC" : "#0FB5A6";
  const adminColor = variant === "dark" ? "#7DE3D8" : "#0FB5A6";
  const iconSize = Math.round(badgeSize * 0.59);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: wordColor,
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          width: badgeSize,
          height: badgeSize,
          borderRadius: Math.round(badgeSize * 0.29),
          background: "linear-gradient(135deg, #0FB5A6 0%, #22D3BC 100%)",
          color: "#fff",
          boxShadow: "inset 0 -2px 0 rgba(0,0,0,.08)",
          flexShrink: 0,
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-3 0-5 1.5-7 1.5C3 4.5 3 8 4 11c1 3 1 4 1.5 6S6.5 21 8 21s2-3 2.5-5 1-2.5 1.5-2.5 1 .5 1.5 2.5S15 21 16.5 21s2-2 2.5-4 .5-3 1.5-6 1-6.5-1-6.5C17.5 4.5 15 3 12 3z" />
        </svg>
      </span>
      {!collapsed && (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
          <span>
            덴<span style={{ color: accentColor }}>탈인</span>
          </span>
          <span style={{ fontSize: Math.round(fontSize * 0.6), fontWeight: 700, letterSpacing: "0.02em", color: adminColor }}>ADMIN</span>
        </span>
      )}
    </span>
  );
}
