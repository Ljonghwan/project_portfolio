// 카카오 지도 SDK 공통 로더 + 주소→좌표 지오코딩 (client-only).
//   - SDK: dapi.kakao.com/v2/maps/sdk.js?appkey=...&libraries=services&autoload=false → kakao.maps.load(cb)
//   - JS 키는 빌드타임 인라인 env(NEXT_PUBLIC_KAKAO_JS_KEY). 카카오 콘솔 Web 플랫폼 도메인 등록 필요.
//   - 중복 로드 방지(싱글톤 Promise). 키 없으면 reject → 호출부가 fallback(placeholder/주소링크).

/* eslint-disable @typescript-eslint/no-explicit-any */
type KakaoNS = any;

declare global {
  interface Window {
    kakao?: KakaoNS;
  }
}

const SCRIPT_ID = "kakao-maps-sdk";
let loadPromise: Promise<KakaoNS> | null = null;

export function kakaoJsKey(): string {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";
}

export function loadKakaoMaps(): Promise<KakaoNS> {
  if (typeof window === "undefined") return Promise.reject(new Error("not in browser"));
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao);
  if (loadPromise) return loadPromise;

  const key = kakaoJsKey();
  if (!key) return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY 미설정"));

  loadPromise = new Promise<KakaoNS>((resolve, reject) => {
    const finish = () => {
      if (!window.kakao?.maps) {
        reject(new Error("kakao maps SDK 로드 실패"));
        return;
      }
      // autoload=false → load 콜백 후에야 kakao.maps.* 사용 가능
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.kakao?.maps) finish();
      else {
        existing.addEventListener("load", finish);
        existing.addEventListener("error", () => { loadPromise = null; reject(new Error("script load failed")); });
      }
      return;
    }

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    s.onload = finish;
    s.onerror = () => { loadPromise = null; reject(new Error("script load failed")); };
    document.head.appendChild(s);
  });
  return loadPromise;
}

// 주소 문자열 → {lat,lng}. 실패(키 없음/미인식 주소/도메인 미등록) 시 null.
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const addr = address?.trim();
  if (!addr) return null;
  let kakao: KakaoNS;
  try {
    kakao = await loadKakaoMaps();
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(addr, (result: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
        } else {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

// 카카오맵 외부 링크: 좌표 있으면 핀, 없으면 검색.
export function kakaoMapLink(name: string, lat?: number | null, lng?: number | null, address?: string | null): string {
  if (lat != null && lng != null) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(name || "위치")},${lat},${lng}`;
  }
  const q = (address || name || "").trim();
  return `https://map.kakao.com/link/search/${encodeURIComponent(q)}`;
}
