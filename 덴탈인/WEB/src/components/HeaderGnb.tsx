"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string }[] = [
  { href: "/reviews", label: "익명 병원후기" },
  { href: "/talks", label: "익명 수다방" },
  { href: "/urgents", label: "급구 게시판" },
  { href: "/jobs", label: "채용정보" },
];

export default function HeaderGnb() {
  const pathname = usePathname() || "/";
  const isActive = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + "/") ? "active" : "";

  return (
    <nav className="gnb">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className={isActive(it.href)}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
