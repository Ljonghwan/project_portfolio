// 다음 우편번호 서비스 실연동 (무료, API key 불필요).
// docs: https://postcode.map.daum.net/guide

const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
const SCRIPT_ID = "daum-postcode-script";

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: DaumPostcodeOptions) => { open: () => void };
    };
  }
}

type DaumPostcodeOptions = {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose?: (state: "FORCE_CLOSE" | "COMPLETE_CLOSE") => void;
  width?: number | string;
  height?: number | string;
};

export type DaumPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sido: string;
  sigungu: string;
};

export type PostcodeResult = {
  zonecode: string;
  address: string;
  region: string; // sido 원문(우편번호 제공값)
  sigungu: string;
};

let loadingPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("not in browser"));
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script load failed")));
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loadingPromise = null;
      reject(new Error("script load failed"));
    };
    document.head.appendChild(s);
  });
  return loadingPromise;
}

export async function openDaumPostcode(): Promise<PostcodeResult | null> {
  try {
    await loadScript();
  } catch {
    alert("주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    return null;
  }
  return new Promise<PostcodeResult | null>((resolve) => {
    if (!window.daum?.Postcode) {
      resolve(null);
      return;
    }
    let settled = false;
    const popup = new window.daum.Postcode({
      oncomplete: (data) => {
        settled = true;
        resolve({
          zonecode: data.zonecode,
          address: data.roadAddress || data.address,
          region: data.sido || "",
          sigungu: data.sigungu || "",
        });
      },
      onclose: (state) => {
        if (!settled && state === "FORCE_CLOSE") resolve(null);
      },
    });
    popup.open();
  });
}
