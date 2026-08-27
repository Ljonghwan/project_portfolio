"use client";

// Sprint p2-6-fix1 — SSR 주입 코드 하이드레이터(label-pop 0).
// layout(server)이 /api/codes를 SSR fetch해 initialCodes로 내려주고, 이 컴포넌트가
// **첫 렌더(서버+클라이언트 공통)에서 동기적으로** lib 가변 라벨/옵션을 채운다.
// → 첫 HTML(SSR)부터 라벨이 들어있고, 클라 hydration도 동일 → remount/pop 없음.
import { hydrateCodes } from "@/lib/codesHydrate";
import { useCodeStore, type CodesBundle } from "@/stores/codeStore";

let hydratedSig = "";

export default function CodesProvider({
  initialCodes,
  children,
}: {
  initialCodes: CodesBundle;
  children: React.ReactNode;
}) {
  // 렌더 도중 동기 하이드레이트(멱등). children 렌더 전에 lib 객체가 채워지도록.
  // ⚠️ 시그니처는 **라벨까지 포함한 전체 내용**으로 비교한다. 키 집합만 비교하면 서버에서
  //    라벨만 변경(키 동일)했을 때 실행 중 프로세스가 재hydrate를 건너뛰어 "새로고침 즉시 반영"이
  //    깨진다(no-store SSR fetch는 새 라벨을 받지만 lib 객체가 stale로 남음). p2-6 핵심 요구.
  const has = initialCodes && Object.keys(initialCodes).length > 0;
  if (has) {
    const sig = JSON.stringify(initialCodes);
    if (hydratedSig !== sig) {
      hydrateCodes(initialCodes);
      useCodeStore.setState({ codes: initialCodes, loaded: true });
      hydratedSig = sig;
    }
  }
  return <>{children}</>;
}
