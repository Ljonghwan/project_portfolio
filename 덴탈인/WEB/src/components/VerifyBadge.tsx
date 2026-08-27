// G5 N3: 면허/사업자 인증완료(active+verified) 회원 표시 뱃지(공통).
//   카드/상세/수다방 어디서나 동일하게 보이도록 자기완결 인라인 스타일(전역 .verify는 .rv-detail-top 스코프 전용이라 미사용).
export default function VerifyBadge({ title = "인증 완료" }: { title?: string }) {
  return (
    <span
      className="verify-badge"
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 15,
        height: 15,
        marginLeft: 4,
        color: "var(--brand)",
        verticalAlign: "middle",
        flex: "0 0 auto",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 12l2 2 4-4M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
      </svg>
    </span>
  );
}
