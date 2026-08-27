"use client";

import { useEffect, type RefObject } from "react";

// 모달 접근성 공용 훅 — 열릴 때 첫 요소로 포커스 이동, Tab 트랩, ESC 닫기, 닫히면 트리거로 복귀.
// 사용처: HR 화면 PDF 다운로드 모달·프로필 사진 라이트박스, 대시보드 온보딩 오버레이.
export function useModalA11y(
  open: boolean,
  close: () => void,
  boxRef: RefObject<HTMLElement | null>,
  triggerRef?: RefObject<HTMLElement | null>,
  // ESC 닫기만 끄고 포커스 트랩은 유지(예: 온보딩 분석 중 — 실수로 닫으면 일일 할당량만 소모).
  disableEsc?: boolean,
) {
  useEffect(() => {
    if (!open) return;
    const box = boxRef.current;
    if (!box) return;
    const trigger = triggerRef?.current;
    const getFocusable = () =>
      Array.from(
        box.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    // 포커스 가능한 자식이 없는 단계(예: 온보딩 분석 중 스피너)는 컨테이너 자신으로 — 그래야
    // 포커스가 모달 안에 머문다(컨테이너에 tabIndex={-1} 이 있어야 먹는다).
    (getFocusable()[0] ?? box).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!disableEsc) close();
        return;
      }
      if (e.key !== "Tab") return;
      const f = getFocusable();
      // 갈 곳이 없으면 Tab 자체를 막는다 — 그냥 return 하면 포커스가 모달 밖으로 새 나간다.
      if (f.length === 0) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
    // close 는 매 렌더 새로 만들어지는 클로저 — 의존성에 넣으면 열릴 때마다 재구독되고
    // cleanup 의 trigger?.focus() 가 입력 중 포커스를 빼앗는다. open/ref/disableEsc 변화에만 반응한다.
    // (disableEsc 가 바뀌는 시점 = 모달 단계 전환이라, 재구독하며 새 단계 첫 요소로 포커스가 옮겨간다.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, boxRef, triggerRef, disableEsc]);
}
