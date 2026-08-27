"use client";

// p2-notifications: 헤더 알림 벨 + unreadCount badge + 드롭다운 패널(시안 STATE2/3 noti-list).
// 로그인 사용자(개인/기업 공통)에만 렌더. 진입 시 unread-count 1회 fetch(과한 실시간 폴링 X).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  notificationHref,
  notificationText,
  notificationIcon,
  formatRelative,
  type NotificationItem,
} from "@/lib/notifications";
import NotiIcon from "@/components/NotiIcon"; // G5 N1: 팝업/전체보기 공통 아이콘

export default function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // 진입 시 unread-count 1회.
  useEffect(() => {
    let alive = true;
    getUnreadCount().then((n) => {
      if (alive) setUnread(n);
    });
    return () => {
      alive = false;
    };
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await listNotifications(1, 8);
    if (res.success && res.data) {
      setItems(res.data.items);
      setUnread(res.data.unread);
    }
    setLoading(false);
  }, []);

  // 드롭다운 열릴 때 목록 로드 + 외부 클릭 닫기.
  useEffect(() => {
    if (!open) return;
    void loadList();
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, loadList]);

  const onClickItem = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.isRead) {
      const res = await markNotificationRead(n.id);
      if (res.success && res.data) setUnread(res.data.unread);
      else setUnread((u) => Math.max(0, u - 1));
    }
    const href = notificationHref(n);
    if (href) router.push(href);
    else router.push("/notifications");
  };

  const onReadAll = async () => {
    const res = await markAllNotificationsRead();
    if (res.success) {
      setUnread(0);
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
    }
  };

  return (
    <div className="noti-wrap" ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="bell-btn"
        aria-label={`알림${unread > 0 ? ` ${unread}건` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          // H4(G7)+④(D2): 모바일/태블릿(≤1024)은 드롭다운 팝업이 가려 안 보이므로 /notifications 이동. 데스크탑(≥1025)만 팝업.
          if (typeof window !== "undefined" && window.matchMedia("(max-width:1024px)").matches) {
            router.push("/notifications");
          } else {
            setOpen((v) => !v);
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="badge">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="noti-panel" role="dialog" aria-label="알림">
          <div className="head">
            <h4>알림</h4>
            {unread > 0 && (
              <button type="button" className="read-all" onClick={onReadAll}>
                모두 읽음
              </button>
            )}
          </div>
          <div className="noti-list">
            {loading ? (
              <div className="noti-empty">불러오는 중…</div>
            ) : items.length === 0 ? (
              <div className="noti-empty">새 알림이 없습니다.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`noti-item${n.isRead ? "" : " unread"}`}
                  onClick={() => onClickItem(n)}
                >
                  <div className={`ico ${notificationIcon(n.type)}`}>
                    <NotiIcon kind={notificationIcon(n.type)} />
                  </div>
                  <div className="body">
                    <p>{notificationText(n)}</p>
                    {n.payload?.excerpt && <p className="exc">{n.payload.excerpt}</p>}
                    <div className="when">{formatRelative(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="foot">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              알림 전체보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
