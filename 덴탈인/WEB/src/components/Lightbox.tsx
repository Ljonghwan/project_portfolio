"use client";

// 사진 확대보기(라이트박스) — yet-another-react-lightbox + Zoom/Counter 플러그인.
// Zoom 플러그인이 모바일 핀치줌·더블탭 줌·드래그 패닝, 데스크탑 휠/더블클릭 줌을 라이브러리 내부에서 처리
// → 페이지 viewport 줌 차단(layout.tsx user-scalable=no)과 무관하게 라이트박스 안에서는 줌이 동작.
// 보듬자리 GalleryLightbox 패턴 차용. props 시그니처는 기존 자체구현과 동일(jobs/urgents/talks 무수정).
import YARLightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

type Props = {
  images: string[];
  index: number; // 시작 인덱스
  open: boolean;
  onClose: () => void;
};

export default function Lightbox({ images, index, open, onClose }: Props) {
  const count = images.length;
  if (count === 0) return null;

  return (
    <YARLightbox
      open={open}
      index={Math.min(Math.max(index, 0), count - 1)}
      close={onClose}
      slides={images.map((src, i) => ({ src, alt: `확대 이미지 ${i + 1}` }))}
      plugins={[Zoom, Counter]}
      // 보듬자리 차용 값 — 핀치/더블탭/휠 줌 동작 파라미터
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true, doubleTapDelay: 280, doubleClickMaxStops: 2 }}
      // 단일 이미지면 좌우 순환/네비 비활성(화살표 자동 숨김)
      carousel={{ finite: count <= 1 }}
      controller={{ closeOnBackdropClick: true }}
      counter={{ container: { style: { top: "unset", bottom: 0, left: "50%", transform: "translateX(-50%)" } } }}
      // 컨테이너 배경 + 헤더(50)/모달(1000) 위로(라이브러리 root 기본 z-index 9999 유지 — 충돌 없음).
      styles={{ container: { backgroundColor: "rgba(8, 11, 15, 0.92)" } }}
    />
  );
}
