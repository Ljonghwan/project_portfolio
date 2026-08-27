import type { NextConfig } from "next";

// API 프록시 타깃: env 우선, 미지정 시 server 실제 포트(3000)로 fallback(구 4000 불일치 수정).
const apiBase = process.env.API_BASE_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone", // 17300 배포: standalone 산출물(.next/standalone/server.js) → pm2
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  },
};

export default nextConfig;
