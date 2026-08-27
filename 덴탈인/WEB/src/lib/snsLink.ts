// SNS OAuth link 토큰(JWT) — front는 표시용으로만 payload를 디코드(서명 검증 X).
//   실제 신뢰는 서버가 가입(`/api/auth/signup/sns`)에서 link를 재검증 → snsId/email은 서버만 신뢰.
export type SnsProvider = "kakao" | "naver" | "google";

export interface SnsLinkInfo {
  provider: SnsProvider;
  snsId: string;
  email: string | null;
  name: string | null;
  phone: string | null;
}

// base64url JWT payload 디코드(검증 없이 내용만). 실패/형식오류 시 null.
export function decodeSnsLink(token: string | null | undefined): SnsLinkInfo | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(escape(atob(b64)))) as Record<string, unknown>;
    if (json.t !== "sns_link" || typeof json.provider !== "string" || typeof json.snsId !== "string") return null;
    return {
      provider: json.provider as SnsProvider,
      snsId: json.snsId,
      email: typeof json.email === "string" ? json.email : null,
      name: typeof json.name === "string" ? json.name : null,
      phone: typeof json.phone === "string" ? json.phone : null,
    };
  } catch {
    return null;
  }
}
