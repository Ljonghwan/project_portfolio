import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// 백엔드 오리진 — src/lib/api.ts 의 API_BASE 와 같은 규칙(NEXT_PUBLIC_API_BASE 로 오버라이드).
// 비어 있으면 같은 오리진(nginx 프록시) 전제라 CSP 는 'self' 만으로 충분하다.
// ⚠️ prod 빌드에서도 이 값을 반영해야 한다 — 개발서버(#017-4)처럼 프록시 없이 포트를
//    직접 노출하면 front:10391 → api:10392 가 크로스 오리진이라 'self' 만으로는 전부 차단된다(실측).
const apiOrigin = process.env.NEXT_PUBLIC_API_BASE || (isDev ? "http://localhost:4000" : "");
const allowApi = apiOrigin ? ` ${apiOrigin}` : "";

// 토스페이먼츠 결제창(카드#020 C). 토스는 CSP 허용 도메인 목록을 **문서로 공개하지 않는다**
// (docs.tosspayments.com 에 CSP 가이드 페이지가 없음 — 검색·FAQ 확인). 그래서 실제 결제를 돌려
// 브라우저가 보고한 `securitypolicyviolation` 을 수집해 **나온 오리진만** 넣었다.
// 재측정 방법은 deploy/candour/README.md 의 결제 항목에 적어뒀다(결제수단 추가·SDK 업그레이드 시 필수).
 // ⚠️ 위반은 **한 번에 다 나오지 않는다** — 앞의 차단이 풀려야 다음 요청이 시도되므로 위반 0 이 될
//    때까지 반복 측정해야 한다(이번에도 3회 돌려 확정했다).
// ⚠️ `-sandbox` 호스트는 **테스트키 전용**이고 라이브 키는 접미사 없는 호스트를 쓴다. 지금 테스트키로만
//    검증했으므로 라이브 전환 시 콘솔을 한 번 더 볼 것 — 그래서 둘 다 미리 넣어뒀다.
// ⚠️ 와일드카드(*.tosspayments.com)를 쓰지 않는다 — 서브도메인 하나가 뚫리면 전부 열린다.
//   js.tosspayments.com     SDK 스크립트(loadTossPayments 가 <script> 로 주입)
//   log·event.tosspayments.com  SDK 진단 로그·web-vitals. 막으면 결제창이 뜨기 전에 멈춘다
//   apigw[-sandbox]         결제창 파라미터 조회(XHR)
//   payment-gateway[-sandbox]  결제창 본체. **iframe 으로 뜬다** → frame-src
const TOSS_CONNECT = [
  "https://js.tosspayments.com",
  "https://log.tosspayments.com",
  "https://event.tosspayments.com",
  "https://apigw.tosspayments.com",
  "https://apigw-sandbox.tosspayments.com",
];
const TOSS_FRAME = [
  "https://js.tosspayments.com",
  "https://payment-gateway.tosspayments.com",
  "https://payment-gateway-sandbox.tosspayments.com",
];

// 개발 모드의 React 는 디버깅용 eval() 을 쓰므로 dev 에서만 'unsafe-eval' 허용.
const csp = [
  "default-src 'self'",
  // 자료 파일 미리보기는 별도 포트 백엔드 이미지 → API 오리진 허용(connect-src 와 동일 패턴).
  `img-src 'self' data: blob:${allowApi}`,
  "media-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.tosspayments.com`,
  // 별도 포트 백엔드로 XHR → API 오리진 허용. 같은 오리진 프록시 배포면 'self' 만 남는다.
  `connect-src 'self'${allowApi} ${TOSS_CONNECT.join(" ")}`,
  // 결제창은 iframe 으로 뜬다. default-src 'self' 를 상속받던 자리라 지시자를 새로 여는 순간
  // 'self' 를 직접 적어줘야 한다(현재 우리 화면에 다른 프레임은 없다).
  `frame-src 'self' ${TOSS_FRAME.join(" ")}`,
  "font-src 'self' data:",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
