// 사용자 대면 날짜·시각 표기 단일 출처.
// 화면에 개발자식 포맷(YYYY-MM-DD / HH:MM)을 쓰지 않는다. 시각은 12시간제이고 **시는 zero-pad 없음**,
// 분만 2자리. 로컬 타임존 기준 — `toISOString().slice()` 로 만들던 예전 표기는 UTC 라 9시간 어긋났다.

function toDate(v: string | Date): Date | null {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(v: string | Date): string {
  const d = toDate(v);
  return d ? `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` : "";
}

export function fmtTime(v: string | Date): string {
  const d = toDate(v);
  if (!d) return "";
  const h = d.getHours();
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${h12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtDateTime(v: string | Date): string {
  const d = toDate(v);
  return d ? `${fmtDate(d)} ${fmtTime(d)}` : "";
}
