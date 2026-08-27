"use client";

// p2-notifications: 알림 전체보기 페이지. 로그인 필수. 목록 + 페이지네이션 + 클릭 read + 모두 읽음.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NotiIcon from "@/components/NotiIcon";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useMinimumLoading } from "@/lib/useMinimumLoading";
import { useMe } from "@/lib/useMe";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  notificationHref,
  notificationText,
  notificationIcon,
  formatRelative,
  type NotificationItem,
} from "@/lib/notifications";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const { me, loading: meLoading } = useMe(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await listNotifications(p, PAGE_SIZE);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setUnread(res.data.unread);
      setPage(res.data.page);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (meLoading) return;
    if (!me) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) router.push("/login");
      else router.push("/");
      return;
    }
    void load(1);
  }, [me, meLoading, load, router]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // 로딩 깜빡임 방지(프로젝트 로딩 규칙). meLoading 포함 — 인증 확인 중에도 로딩 표시.
  const showLoading = useMinimumLoading(loading || meLoading);

  const onClickItem = async (n: NotificationItem) => {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
      setUnread((u) => Math.max(0, u - 1));
    }
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  const onReadAll = async () => {
    const res = await markAllNotificationsRead();
    if (res.success) {
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      setUnread(0);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap support-shell" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div className="support-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1>알림</h1>
            <p>최근 알림을 모아봤어요{unread > 0 ? ` · 안 읽음 ${unread}건` : ""}.</p>
          </div>
          {unread > 0 && (
            <button type="button" className="go-btn" onClick={onReadAll}>
              모두 읽음
            </button>
          )}
        </div>

        {showLoading ? (
          <div className="noti-state"><LoadingIndicator fullPage={false} /></div>
        ) : items.length === 0 ? (
          <div className="noti-state noti-page-empty">새 알림이 없습니다.</div>
        ) : (
          <ul className="noti-page-list">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`noti-item${n.isRead ? "" : " unread"}`}
                  onClick={() => onClickItem(n)}
                >
                  <div className={`ico ${notificationIcon(n.type)}`} aria-hidden="true">
                    <NotiIcon kind={notificationIcon(n.type)} />
                  </div>
                  <div className="body">
                    <p>{notificationText(n)}</p>
                    {n.payload?.excerpt && <p className="exc">{n.payload.excerpt}</p>}
                    <div className="when">{formatRelative(n.createdAt)}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="pager" style={{ marginTop: 16 }}>
            <button type="button" disabled={page <= 1} onClick={() => load(page - 1)}>
              이전
            </button>
            <span style={{ padding: "0 12px" }}>
              {page} / {totalPages}
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => load(page + 1)}>
              다음
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
