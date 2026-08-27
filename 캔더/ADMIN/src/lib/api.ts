// 관리자 API 클라이언트 — 서버 응답 봉투 { data } / { error:{code,message} } 를 언랩.
// 인증은 **httpOnly 쿠키(candour_admin_sid)** 이므로 토큰을 JS 로 다루지 않는다(XSS 로도 탈취 불가).
// next.config rewrites 로 /api/* 가 백엔드로 프록시되므로 same-origin 상대경로 + credentials:'include'.

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* 빈 본문 허용 */
  }
  const b = body as { data?: T; error?: { code?: string; message?: string } } | null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      b?.error?.code ?? "UNKNOWN",
      b?.error?.message ?? "요청을 처리하지 못했습니다.",
    );
  }
  return (b?.data ?? ({} as T)) as T;
}

export const api = {
  get: <T>(path: string) => req<T>(path),
  post: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => req<T>(path, { method: "DELETE" }),
};

// 쿼리스트링 빌더(빈 값 제외).
export function qs(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function fmtUsd(v: string | number | null | undefined): string {
  const n = Number(v ?? 0);
  return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
}
export function fmtInt(v: string | number | null | undefined): string {
  return Number(v ?? 0).toLocaleString("ko-KR");
}
