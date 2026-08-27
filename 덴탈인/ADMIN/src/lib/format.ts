// G4 C1/C2: 휴대폰/사업자번호 "표시 전용" 포맷 유틸.
//   - DB/전송값은 항상 숫자만(하이픈 미저장). 읽기(표시) 시점에만 하이픈 삽입.
//   - 입력값을 먼저 `\D` 제거해 정규화하므로 레거시 하이픈 저장분도 중복 하이픈 없이 재포맷.
//   - 자릿수가 기대와 다르면 "원본 입력값"을 그대로 반환(방어).

/**
 * 휴대폰/전화번호 하이픈 포맷.
 *  - 11자리(01x): 3-4-4 → 010-1234-5678
 *  - 10자리 01x: 3-3-4 → 011-123-4567
 *  - 10자리 02(서울): 2-4-4 → 02-1234-5678
 *  - 9자리 02: 2-3-4 → 02-123-4567
 *  - 그 외(휴대폰/전화 외 형식): 3-3/4-나머지 기본 분할 또는 원본 반환
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const d = String(value).replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) {
    if (d.startsWith("02")) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 9 && d.startsWith("02")) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  return String(value); // 기대 자릿수 아님 → 원본 그대로
}

/**
 * 사업자등록번호 하이픈 포맷. 10자리 → 3-2-5 (201-86-48538). 그 외 원본 반환.
 */
export function formatBizNo(value: string | null | undefined): string {
  if (!value) return "";
  const d = String(value).replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  return String(value);
}
