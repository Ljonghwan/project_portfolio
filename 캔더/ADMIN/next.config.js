// /api/* 를 candour 백엔드로 프록시(rewrites) — 브라우저는 same-origin 으로 호출하므로
// httpOnly 관리자 쿠키가 CORS/SameSite 제약 없이 그대로 동작한다.
// 포트가 다르면 API_BASE_URL 로 덮어쓴다(예: API_BASE_URL=http://localhost:4010 npm run dev).
const apiBase = process.env.API_BASE_URL || "http://localhost:4000";

// .ts 가 아니라 .js 인 이유: Next 15 의 `next start` 는 기동 시 config 를 transpile 하는데
// 런타임 이미지는 `npm prune --omit=dev` 로 typescript 를 버린다 → 기동 1회 크래시(Dockerfile 참조).
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
};

module.exports = nextConfig;
