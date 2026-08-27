// 17300 배포 BUG-1 fix: NEXT_PUBLIC_*는 빌드 타임 인라인이라 클라 절대 URL이 박혀 연결 실패.
//   브라우저(클라)는 상대경로(/api/*) → Next rewrites(API_BASE_URL)→API. NEXT_PUBLIC_API_BASE_URL은 SSR 전용.
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
};

function token(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("adminAccessToken");
}
export function setAdminToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem("adminAccessToken", t);
  else window.localStorage.removeItem("adminAccessToken");
}

async function refresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/admin/auth/refresh`, { method: "POST", credentials: "include" });
    const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
    if (json.success && json.data?.accessToken) {
      setAdminToken(json.data.accessToken);
      return json.data.accessToken;
    }
    return null;
  } catch { return null; }
}

export async function apiFetch<T = unknown>(path: string, opts: RequestInit & { auth?: boolean } = {}): Promise<ApiResponse<T>> {
  const { auth = true, headers, body, ...rest } = opts;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const h: Record<string, string> = { ...(headers as Record<string, string> | undefined) };
  if (!isFormData && body && !h["Content-Type"]) h["Content-Type"] = "application/json";
  if (auth) {
    const t = token();
    if (t) h["Authorization"] = `Bearer ${t}`;
  }
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  let res = await fetch(url, { ...rest, headers: h, body, credentials: "include" });
  if (res.status === 401 && auth) {
    const next = await refresh();
    if (next) {
      h["Authorization"] = `Bearer ${next}`;
      res = await fetch(url, { ...rest, headers: h, body, credentials: "include" });
    } else if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      // 그룹4 ②: access+refresh 모두 만료/무효(예: 14일 경과·비번변경 후 연속 작업)면
      //   "관리자 토큰이 유효하지 않습니다" 토스트만 반복되지 않도록 토큰 정리 + 재로그인 유도.
      setAdminToken(null);
      window.location.href = "/login";
    }
  }
  return (await res.json().catch(() => ({ success: false, message: "응답 파싱 실패" }))) as ApiResponse<T>;
}

export const api = {
  get: <T = unknown>(p: string, auth = true) => apiFetch<T>(p, { method: "GET", auth }),
  post: <T = unknown>(p: string, b?: unknown, auth = true) => apiFetch<T>(p, { method: "POST", body: b ? JSON.stringify(b) : undefined, auth }),
  patch: <T = unknown>(p: string, b?: unknown, auth = true) => apiFetch<T>(p, { method: "PATCH", body: b ? JSON.stringify(b) : undefined, auth }),
  del: <T = unknown>(p: string, auth = true) => apiFetch<T>(p, { method: "DELETE", auth }),
};
