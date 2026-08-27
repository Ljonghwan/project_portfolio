// API client — 토큰은 localStorage("accessToken")에 저장, refresh는 httpOnly 쿠키.

// 17300 배포 BUG-1 fix: NEXT_PUBLIC_*는 빌드 타임에 인라인되므로 클라이언트 절대 URL(localhost:3001)이
//   박혀 ERR_CONNECTION_REFUSED 발생. 브라우저(클라)는 상대경로(/api/*) → nginx→Next rewrites(API_PROXY_TARGET)
//   →API로 프록시(same-origin, CORS 불필요). NEXT_PUBLIC_API_BASE_URL은 SSR(서버 컴포넌트)에서만 절대 URL로 사용.
const BASE = (
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
    : ""
).replace(/\/$/, "");

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  issues?: { path: string; message: string }[];
  /** HTTP status. 네트워크 오류는 0. (p2-cleanup: 401만 로그아웃 판별용) */
  status?: number;
  [k: string]: unknown;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("accessToken");
}
export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("accessToken", token);
  else window.localStorage.removeItem("accessToken");
}

export type ApiOptions = RequestInit & { auth?: boolean };

async function refreshAccess(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
    if (json.success && json.data?.accessToken) {
      setAccessToken(json.data.accessToken);
      return json.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

// 토큰 exp가 30초 이내로 임박하면 만료 임박으로 간주 → 사전 refresh로 401 노이즈 회피
function isTokenExpiringSoon(token: string): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(typeof atob !== "undefined" ? atob(padded) : Buffer.from(padded, "base64").toString());
    const exp = payload?.exp;
    if (typeof exp !== "number") return true;
    return exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { auth = false, headers, body, ...rest } = opts;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const h: Record<string, string> = { ...(headers as Record<string, string> | undefined) };
  if (!isFormData && body && !h["Content-Type"]) h["Content-Type"] = "application/json";
  if (auth) {
    let t = getAccessToken();
    if (t && isTokenExpiringSoon(t)) {
      const next = await refreshAccess();
      if (next) t = next;
    }
    if (t) h["Authorization"] = `Bearer ${t}`;
  }
  const url = path.startsWith("http") ? path : `${BASE}${path.startsWith("/api") ? path : `/api${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: h, body, credentials: "include" });
    if (res.status === 401 && auth) {
      const next = await refreshAccess();
      if (next) {
        h["Authorization"] = `Bearer ${next}`;
        res = await fetch(url, { ...rest, headers: h, body, credentials: "include" });
      }
    }
  } catch {
    return { success: false, code: "NETWORK_ERROR", message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", status: 0 };
  }
  const json = (await res.json().catch(() => ({ success: false, message: "응답 파싱 실패" }))) as ApiResponse<T>;
  return { ...json, status: res.status };
}

export const api = {
  get: <T = unknown>(path: string, auth = false) => apiFetch<T>(path, { method: "GET", auth }),
  post: <T = unknown>(path: string, body?: unknown, auth = false) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, auth }),
  patch: <T = unknown>(path: string, body?: unknown, auth = false) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, auth }),
  del: <T = unknown>(path: string, auth = false, body?: unknown) =>
    apiFetch<T>(path, { method: "DELETE", body: body !== undefined ? JSON.stringify(body) : undefined, auth }),
  upload: <T = unknown>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: "POST", body: formData, auth: true }),
};
