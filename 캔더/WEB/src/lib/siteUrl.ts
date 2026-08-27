// 공개 링크(/l/{slug}·/r/{token})의 주소 — **표시와 복사가 같은 출처를 쓰게 하는 단일 소스**.
// 화면에 도메인을 적어 두면(예전 `candour.kr` 하드코딩) 배포 도메인이 바뀔 때 안내와 실제 링크가 갈린다.
//
// 기준값은 빌드 시 주입되는 `NEXT_PUBLIC_SITE_URL`(Docker ARG), 없으면 브라우저가 실제로 열려 있는 오리진.
// ⚠️ 폴백은 `??` 가 아니라 `||` — ARG 를 빠뜨리면 undefined 가 아니라 빈 문자열이 들어온다(학습 mseekhl8).
// SSR 에는 window 가 없어 `''`(상대경로)로 떨어지지만, 이 값을 쓰는 화면은 전부 fetch 후에 렌더된다.
function origin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window === "undefined" ? "" : window.location.origin)
  );
}

/** 복사·공유용 절대 URL. */
export function siteUrl(path: string): string {
  return `${origin()}${path}`;
}

/** 화면 표시용 — 스킴을 뗀 host+path. */
export function siteUrlLabel(path: string): string {
  return siteUrl(path).replace(/^https?:\/\//, "");
}
