"use client";

import { useEffect, useRef, useState } from "react";

// Sprint p2-4 작업3 — 로딩 UI 최소 노출 시간 보장 (프로젝트 공통).
// 로컬 API가 수십 ms로 끝나면 스켈레톤/인디케이터가 "뿅" 하고 사라져 UX가 나쁨.
// active(로딩/데이터 미도착)가 켜지면, 응답이 아무리 빨라도 최소 minMs(기본 500ms)
// 동안 로딩 UI를 유지하도록 show 플래그를 지연 해제한다.
//
// 사용: const showSkeleton = useMinimumLoading(loading || !data);  // 리스트
//       const showLoading  = useMinimumLoading(loading || !detail); // 상세
export function useMinimumLoading(active: boolean, minMs = 500): boolean {
  const [show, setShow] = useState(active);
  const startRef = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    if (active) {
      if (startRef.current === null) startRef.current = Date.now();
      setShow(true);
      return;
    }
    // active=false: 최소 노출 시간 채웠는지 확인 후 해제
    if (startRef.current === null) {
      setShow(false);
      return;
    }
    const remaining = minMs - (Date.now() - startRef.current);
    if (remaining <= 0) {
      startRef.current = null;
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      startRef.current = null;
      setShow(false);
    }, remaining);
    return () => clearTimeout(t);
  }, [active, minMs]);

  return show;
}
