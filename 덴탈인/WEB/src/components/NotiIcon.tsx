// G5 N1: 알림 아이콘 SVG 공통 컴포넌트.
//   헤더 알림 팝업(NotificationBell)과 /notifications 페이지가 동일 SVG를 쓰도록 단일 소스화.
//   kind는 lib/notifications.ts의 notificationIcon(type) 반환값.
export default function NotiIcon({ kind }: { kind: "heart" | "cmt" | "job" | "check" }) {
  if (kind === "heart")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9C1.2 9.4 2.7 6 6 6c2 0 3.4 1 4 2 .6-1 2-2 4-2 3.3 0 4.8 3.4 3.5 6-2.5 4.5-9.5 9-9.5 9z" />
      </svg>
    );
  if (kind === "cmt")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  if (kind === "job")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2 4 4L19 4l2 2-12 12z" />
    </svg>
  );
}
