"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SupportShell from "@/components/SupportShell";
import EmptyState from "@/components/EmptyState";
import { listNotices, type SupportNoticeItem } from "@/lib/supportFaq";

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${da}`;
}

function NoticeListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(pageParam);
  const [items, setItems] = useState<SupportNoticeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const res = await listNotices(page, pageSize);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      setItems([]);
      setTotal(0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const handlePageChange = (p: number) => {
    setPage(p);
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    router.replace(`/support/notice${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  return (
    <SupportShell active="notice">
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/support/notice">고객센터</Link> · <b>공지사항</b>
        </div>

        <div className="support-head">
          <h1>공지사항</h1>
          <p>덴탈인의 새로운 소식과 업데이트를 안내드립니다.</p>
        </div>

        {loading && <p style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>불러오는 중…</p>}

        {!loading && items.length === 0 && (
          <EmptyState
            icon="📣"
            title="등록된 공지사항이 없습니다"
            description="새로운 공지가 올라오면 이곳에서 확인할 수 있습니다."
            testId="support-notice-empty"
          />
        )}

        {!loading && items.length > 0 && (
          <ul className="notice-list" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
            {items.map((it) => (
              <li key={it.id}>
                <Link href={`/support/notice/${it.id}`} className="notice-card">
                  <div className="notice-card-head">
                    {it.isPinned && <span className="notice-pin">공지</span>}
                    <span className="notice-date">{formatDate(it.createdAt)}</span>
                    <span className="notice-views">조회 {it.viewCount}</span>
                  </div>
                  <h4 className="notice-title">{it.title}</h4>
                  {it.excerpt && <p className="notice-excerpt">{it.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {total > pageSize && (
          <div className="pager" style={{ marginTop: 16 }}>
            <button type="button" className="nav" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page <= 1}>‹</button>
            {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
              const start = Math.max(1, Math.min(totalPages - 9, page - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button key={p} type="button" className={p === page ? "on" : ""} onClick={() => handlePageChange(p)}>{p}</button>
              );
            })}
            <button type="button" className="nav" onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>›</button>
          </div>
        )}
    </SupportShell>
  );
}

export default function NoticeListPage() {
  return (
    <Suspense fallback={<div />}>
      <NoticeListContent />
    </Suspense>
  );
}
