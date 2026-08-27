"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SupportShell from "@/components/SupportShell";
import EmptyState from "@/components/EmptyState";
import {
  listFaqs,
  listFaqCategories,
  type FaqCategoryItem,
  type SupportFaqItem,
} from "@/lib/supportFaq";

function FaqContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get("category"); // categoryId (string) | null
  const currentCat: number | "all" = catParam && Number.isFinite(Number(catParam)) ? Number(catParam) : "all";

  const [categories, setCategories] = useState<FaqCategoryItem[]>([]);
  const [items, setItems] = useState<SupportFaqItem[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listFaqCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data.items);
    });
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const res = await listFaqs(currentCat === "all" ? undefined : currentCat);
    if (res.success && res.data) setItems(res.data.items);
    else setItems([]);
    setLoading(false);
  }, [currentCat]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCatChange = (cat: number | "all") => {
    const params = new URLSearchParams();
    if (cat !== "all") params.set("category", String(cat));
    router.replace(`/support/faq${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  return (
    <SupportShell active="faq">
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/support/notice">고객센터</Link> · <b>자주 묻는 질문</b>
        </div>

        <div className="support-head">
          <h1>자주 묻는 질문</h1>
          <p>덴탈인 이용 중 자주 묻는 질문을 모았습니다. 원하는 답을 못 찾으셨다면 <Link href="/support/qna/new">문의하기</Link>를 이용해 주세요.</p>
        </div>

        <div className="faq-cats" role="tablist">
          <button
            type="button"
            role="tab"
            className={currentCat === "all" ? "on" : ""}
            onClick={() => handleCatChange("all")}
          >
            전체
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={currentCat === c.id ? "on" : ""}
              onClick={() => handleCatChange(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading && <p style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>불러오는 중…</p>}

        {!loading && items.length === 0 && (
          <EmptyState
            icon="💡"
            title="등록된 FAQ가 없습니다"
            description="자주 묻는 질문이 등록되면 이곳에서 확인할 수 있어요. 궁금한 점은 문의하기로 알려주세요."
            actionLabel="문의하기"
            actionHref="/support/qna/new"
            testId="support-faq-empty"
          />
        )}

        {!loading && items.length > 0 && (
          <ul className="faq-list" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
            {items.map((it) => {
              const open = openId === it.id;
              return (
                <li key={it.id} className={`faq-item${open ? " open" : ""}`}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : it.id)}
                  >
                    <span className="faq-cat">{it.categoryName ?? "기타"}</span>
                    <span className="faq-q-text">{it.question}</span>
                    <svg className="faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {open && (
                    <div className="faq-a">{it.answer}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div style={{ marginTop: 24, padding: 16, background: "var(--bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--ink-2)", textAlign: "center" }}>
          원하는 답을 찾지 못하셨나요? <Link href="/support/qna/new" style={{ color: "var(--brand-ink)", fontWeight: 700 }}>문의하기</Link>로 운영팀에 직접 물어보세요.
        </div>
    </SupportShell>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={<div />}>
      <FaqContent />
    </Suspense>
  );
}
