"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { variant: "desktop" | "mobile" };

export default function HeaderSearch({ variant }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const isMobile = variant === "mobile";
  const className = isMobile ? "m-search" : "search";
  const inputName = isMobile ? "header-search-m" : "header-search";
  const placeholder = isMobile
    ? "병원명, 지역, 직종 검색"
    : "병원명, 지역, 직종, 키워드로 검색해보세요";

  return (
    <form className={className} onSubmit={submitSearch} role="search">
      <input
        name={inputName}
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        suppressHydrationWarning
      />
      <button className="go" aria-label="검색" type="submit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
