import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 17300 배포: standalone 산출물(.next/standalone/server.js) → pm2
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_PROXY_TARGET || "http://localhost:3000"}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
