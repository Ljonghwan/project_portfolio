"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import SupportShell from "@/components/SupportShell";
import LoadingIndicator from "@/components/LoadingIndicator";
import { getNotice, type SupportNoticeDetail } from "@/lib/supportFaq";

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notice, setNotice] = useState<SupportNoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await getNotice(Number(id));
      if (!alive) return;
      if (res.success && res.data) setNotice(res.data);
      else setNotFound(true);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SupportShell active="notice">
        <LoadingIndicator /> {/* G5 N4: 다른 게시판 상세와 동일 로딩 인디케이터 */}
      </SupportShell>
    );
  }

  if (notFound || !notice) {
    return (
      <SupportShell active="notice">
        <div style={{ padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700 }}>공지사항을 찾을 수 없습니다.</p>
          <Link href="/support/notice" className="btn cancel" style={{ marginTop: 16, display: "inline-flex" }}>
            목록으로
          </Link>
        </div>
      </SupportShell>
    );
  }

  return (
    <SupportShell active="notice">
        <div className="crumb" style={{ marginBottom: 12, fontSize: 13, color: "var(--ink-3)" }}>
          <Link href="/">홈</Link> · <Link href="/support/notice">고객센터</Link> · <Link href="/support/notice">공지사항</Link> · <b>상세</b>
        </div>

        <article className="notice-detail">
          <div className="notice-detail-head">
            {notice.isPinned && <span className="notice-pin">공지</span>}
            <span className="notice-date">{formatDate(notice.createdAt)}</span>
            <span className="notice-views">조회 {notice.viewCount}</span>
          </div>
          <h1 className="notice-detail-title">{notice.title}</h1>
          {/* G3 A7: 공지 본문 = admin 스마트에디터 HTML(서버 sanitizeRichHtml allowImages 저장) → DOMPurify 2차 방어 후 렌더. 채용/약관 상세와 동일 패턴. */}
          <div
            className="notice-detail-body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content) }}
          />
        </article>

        {/* F3: 이전글/다음글 네비 */}
        <nav className="notice-nav" aria-label="공지 이전·다음글">
          <Link
            href={notice.next ? `/support/notice/${notice.next.id}` : "#"}
            className={`notice-nav-row${notice.next ? "" : " disabled"}`}
            aria-disabled={!notice.next}
            onClick={(e) => { if (!notice.next) e.preventDefault(); }}
          >
            <span className="dir">다음글</span>
            <span className="t">{notice.next ? notice.next.title : "다음 글이 없습니다"}</span>
          </Link>
          <Link
            href={notice.prev ? `/support/notice/${notice.prev.id}` : "#"}
            className={`notice-nav-row${notice.prev ? "" : " disabled"}`}
            aria-disabled={!notice.prev}
            onClick={(e) => { if (!notice.prev) e.preventDefault(); }}
          >
            <span className="dir">이전글</span>
            <span className="t">{notice.prev ? notice.prev.title : "이전 글이 없습니다"}</span>
          </Link>
        </nav>

        <div style={{ marginTop: 16 }}>
          <Link href="/support/notice" className="btn cancel" style={{ display: "inline-flex" }}>목록으로</Link>
        </div>
    </SupportShell>
  );
}
