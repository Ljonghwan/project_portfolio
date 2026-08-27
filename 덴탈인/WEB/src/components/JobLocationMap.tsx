"use client";

// 채용 상세 근무위치 인라인 카카오 지도.
//   - 좌표(lat/lng) 있으면 그 위치, 없으면 address로 지오코딩 fallback.
//   - 좌표/주소 모두 없거나 SDK 로드/지오코딩 실패 시 → placeholder 텍스트(깨지지 않음).
//   - `.map-box` 컨테이너 안에 렌더(기존 퍼블 박스 재사용).

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps, geocodeAddress } from "@/lib/kakaoMap";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function JobLocationMap({
  latitude,
  longitude,
  address,
  hospitalName,
  fallbackText,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  hospitalName: string;
  fallbackText: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const kakao = await loadKakaoMaps();
        if (cancelled) return;

        // 좌표 우선, 없으면 주소 지오코딩.
        let lat = latitude;
        let lng = longitude;
        if (lat == null || lng == null) {
          if (!address) { setFailed(true); return; }
          const geo = await geocodeAddress(address);
          if (cancelled) return;
          if (!geo) { setFailed(true); return; }
          lat = geo.lat; lng = geo.lng;
        }

        const el = boxRef.current;
        if (!el) return;
        const center = new kakao.maps.LatLng(lat, lng);
        const map = new kakao.maps.Map(el, { center, level: 4 });
        const marker = new kakao.maps.Marker({ position: center });
        marker.setMap(map);
        // 병원명 인포윈도우(있을 때만)
        if (hospitalName) {
          const iw = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;font-weight:700;white-space:nowrap;">${escapeHtml(hospitalName)}</div>`,
          });
          iw.open(map, marker);
        }
        // 컨테이너 늦은 사이즈 보정(레이아웃 후 relayout)
        setTimeout(() => { try { map.relayout(); map.setCenter(center); } catch { /* noop */ } }, 0);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, [latitude, longitude, address, hospitalName]);

  if (failed) {
    // 지도 불가(키/주소/좌표 없음·도메인 미인증 등) → 기존 placeholder 유지.
    return (
      <div className="map-box" aria-label="근무지 지도">
        <span>{fallbackText}</span>
      </div>
    );
  }

  return <div ref={boxRef} className="map-box" aria-label="근무지 지도" style={{ overflow: "hidden" }} />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
