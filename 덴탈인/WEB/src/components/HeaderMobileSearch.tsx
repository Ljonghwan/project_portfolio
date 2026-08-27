"use client";

// H6(G7): 모바일 전역검색 — 항상 펼친 인풋 대신 돋보기 아이콘만 노출, 터치 시 헤더에 인풋이 펼쳐지고 자동 포커스.
//   데스크탑은 기존 HeaderSearch(variant=desktop) 유지. 이 컴포넌트는 CSS로 모바일에서만 노출.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function HeaderMobileSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // ESC로 닫기.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    setOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <>
      <button
        type="button"
        className="m-search-toggle"
        aria-label="검색"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div className="m-search-pop">
          <form className="m-search-pop-form" onSubmit={submit} role="search">
            <input
              ref={inputRef}
              name="header-search-m"
              type="search"
              autoComplete="off"
              placeholder="병원명, 지역, 직종 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="go" type="submit" aria-label="검색">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
          <button type="button" className="m-search-close" aria-label="검색 닫기" onClick={() => setOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
