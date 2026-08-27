// N-A item3: 사업자등록번호 공통 검증(외부 API 미사용 — 오프라인 국세청 체크섬 알고리즘).
// server `src/utils/bizNo.ts`와 동일 로직 유지.

/** 하이픈/공백 등 제거 후 숫자만(최대 10자리). */
export function bizNoDigits(raw: string): string {
  return (raw ?? "").replace(/[^0-9]/g, "").slice(0, 10);
}

/**
 * 국세청 사업자등록번호 체크섬 검증.
 * 가중치 [1,3,7,1,3,7,1,3,5] + 9번째 자리×5의 십의자리 보정, 합 mod 10 → (10-나머지) mod 10 == 10번째 자리.
 */
export function isValidBizNo(raw: string): boolean {
  const d = (raw ?? "").replace(/[^0-9]/g, "");
  if (d.length !== 10) return false;
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * weights[i];
  sum += Math.floor((Number(d[8]) * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(d[9]);
}
