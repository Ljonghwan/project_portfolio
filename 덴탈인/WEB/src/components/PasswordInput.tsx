"use client";

// F9: 비밀번호 입력 + 보기/숨기기(눈) 토글 공용 컴포넌트.
// 페이지별 input 클래스(.input/.input-base 등)를 그대로 받아 스타일 일관 유지.
// 눈 버튼은 래퍼 기준 절대배치(자기완결 인라인 스타일 — 전역 CSS 의존 없음).
import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ className, style, ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "block", width: "100%" }}>
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={className}
        // 눈 버튼과 겹치지 않도록 우측 패딩 확보
        style={{ ...style, paddingRight: 44 }}
      />
      <button
        type="button"
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
        onClick={() => setShow((v) => !v)}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: 0,
          padding: 0,
          cursor: "pointer",
          color: "var(--ink-3)",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {show ? (
          // 눈-슬래시(숨김 상태로 전환 가능 표시)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.45 18.45 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61" />
            <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  );
}
