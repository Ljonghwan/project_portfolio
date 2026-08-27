# 포트폴리오

> 모든 프로젝트를 프론트엔드, 백엔드, 배포까지 **풀스택으로 단독 개발**하였습니다.

## 연락처

- **Email:** whdghks8021@gmail.com

## 참고 사항

- 서버 소스는 보안상 비공개이며, 자영업자 매장관리 앱의 서버 소스만 일부 공개하였습니다
- 추가 소스가 필요하시면 요청해 주세요. 보안 검토 후 발췌하여 전달드리겠습니다
- 각 프로젝트별 상세 설명은 해당 폴더의 README.md를 참고해주세요
- `🤖 AI Native` 태그가 붙은 프로젝트는 Claude Code 기반 **AI Native 개발 환경**에서 기획·개발·QA·배포 전 과정을 AI 에이전트와 협업하며 개발하였습니다

---

## 주요 프로젝트

### 1. 캔더 (Candour) `2026.07 ~ 진행 중` `🤖 AI Native`
AI 이력서 대변인 서비스 — 이력서가 인사담당자의 질문에 스스로 답합니다

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16, TypeScript, styled-jsx, pdfjs |
| Admin | Next.js, Ant Design, Recharts |
| Backend | Node.js, Express, **Claude API** (비공개) |
| Payment | Toss Payments (빌링키) |

- Claude API 기반 AI 대변인 — 이력서(PDF) 근거 페이지 인용과 함께 실시간 답변
- 공개 링크로 인사담당자에게 이력서 공유 + PDF 뷰어 인용 하이라이트
- 토스페이먼츠 빌링키 결제 기반 크레딧 시스템

**상태:** 운영 중 | [candour.mingle.company](https://candour.mingle.company)

[상세보기 →](./캔더)

---

### 2. 덴탈인 `2026.05 ~ 2026.07` `🤖 AI Native`
치과 종사자 구인구직 + 익명 커뮤니티 플랫폼

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Zustand |
| Admin | Next.js, Ant Design, Recharts |
| Backend | Node.js, TypeScript, Express, Sequelize, MySQL (비공개) |
| Infra | AWS (S3, CloudFront), Docker |

- 지역/고용형태/경력/급여 복합 필터 채용정보 + 급구 게시판
- 익명 닉네임 자동 생성 기반 병원후기·수다방 커뮤니티
- 개인(직종별)/병원 이원화 회원 모델, 자체 JWT 인증

**상태:** 운영 중 | [dentalin.kr](https://dentalin.kr)

[상세보기 →](./덴탈인)

---

### 3. 모두의드라이브 `2026.03 ~ 진행 중` `🤖 AI Native`
드라이브 메이트 매칭 소셜 플랫폼 (앱 + 관리자 웹 + 랜딩)

| 구분 | 기술 |
|------|------|
| Frontend | React Native, Expo, Zustand, Socket.io |
| Admin/Web | React, Vite, Ant Design |
| Backend | Node.js (비공개) |
| Infra | AWS (EC2, ALB, CloudWatch, Lambda), Firebase |

- 오너/게스트 양방향 매칭 (1:1·모임) + 매너 점수·노쇼 방지 시스템
- Socket.io 실시간 채팅, 카카오/Apple/Facebook 소셜 로그인
- react-native-iap 인앱 결제 기반 포인트 시스템
- TipTap 에디터 WebView 번들링으로 리치 후기 작성

**상태:** 운영 중 | [modudrive.co.kr](https://modudrive.co.kr)

[상세보기 →](./모두의드라이브)

---

### 4. 소개팅 앱 `2026.01 ~ 2026.07`
실시간 매칭 기반 소셜 데이팅 플랫폼

| 구분 | 기술 |
|------|------|
| Frontend | React Native, Expo, Zustand |
| Backend | Node.js (비공개) |
| Infra | Firebase, Twilio |

- Socket.io 실시간 1:1 채팅 및 Twilio Voice SDK 음성 통화
- 4개 플랫폼 소셜 로그인 (카카오, 네이버, Google, Apple)
- iOS/Android 인앱 결제 및 정기 구독 시스템

**상태:** 운영 중 | [sasohan.net](https://sasohan.net) | [App Store](https://apps.apple.com/kr/app/id6743611412) | [Google Play](https://play.google.com/store/apps/details?id=com.sasohan.meetings)

[상세보기 →](./소개팅%20앱)

---

### 5. 자영업자 매장관리 앱 `2025.10 ~ 2026.02`
자영업자를 위한 올인원 매장 관리 솔루션 (앱 + 서버 + 관리자 웹)

| 구분 | 기술 |
|------|------|
| Frontend | React Native, Expo, Zustand |
| Backend | Node.js, Express, PostgreSQL, Sequelize |
| Admin | React, Vite, ECharts |
| Infra | AWS (S3, Secrets Manager), Firebase |

- OpenAI API 기반 영수증 OCR 자동 인식
- 홈택스/카드사 외부 API 연동으로 세무 자료 자동 수집
- 전자 서명 및 PDF 계약서 관리
- 매출/매입/직원/고객 통합 관리 (14개 업무 모듈)

**상태:** 개발 완료, 기능 추가 기획 중 | 서버 소스 일부 공개

[상세보기 →](./자영업자%20매장관리%20앱)

---

### 6. 밍글 홈페이지 `2025.04 ~ 진행 중`
디지털 크리에이티브 에이전시 공식 웹사이트 (메인 + 구독 서비스)

| 구분 | 기술 |
|------|------|
| Frontend | React, Vite, GSAP, Framer Motion |
| Design | CSS Modules, Locomotive Scroll, Matter.js |

- GSAP ScrollTrigger 스크롤 기반 애니메이션 + Matter.js 물리 엔진 인터랙션
- Framer Motion 페이지 전환 효과 및 커스텀 커서
- 반응형 웹 디자인 (Mobile/Tablet/Desktop)

**상태:** 운영 중 | [mingle.company](https://mingle.company) | [sub.mingle.company](https://sub.mingle.company)

[상세보기 →](./밍글홈페이지)

---

### 7. 캐나다&미국 카풀 앱 `2025.02 ~ 2025.09`
북미 지역 장거리 카풀 매칭 플랫폼 (승객 앱 + 기사 앱)

| 구분 | 기술 |
|------|------|
| Frontend | React Native, Expo, Zustand |
| Backend | Node.js (비공개) |
| Infra | Firebase, Stripe, Expo Location |

- Expo Location + Task Manager를 이용한 백그라운드 GPS 실시간 위치 추적
- Stripe 결제 연동 및 기사 정산 시스템
- 승객/기사 분리된 2개 앱 아키텍처

**상태:** 개발 완료, 기능 추가 기획 중

[상세보기 →](./캐나다%26미국%20카풀%20앱)

---

## 기타 프로젝트

위 주요 프로젝트 외에도 다양한 React / React Native 프로젝트를 개발하였습니다.

### React (Web)

| 프로젝트 | 설명 | 주요 기술 |
|---------|------|----------|
| **Widai** | AI 이미지&영상 제작 서비스 | React 19, Vite, Video.js |
| **AIWith** | AI 이미지&영상 제작 서비스 | React, Zustand, Framer Motion, 카카오/네이버 로그인 |
| **21세기전파상** | 중고폰 매입 플랫폼 | React |
| **Lime** | 상담 플랫폼 | React, Sendbird (영상통화/채팅), Firebase, Socket.io, Highcharts, 소셜 로그인 |
| **ESR** | 부동산 관리 시스템 | React, Socket.io, 네이버 지도, PDF, DnD, Redux |
| **PMS** | 프로젝트 관리 시스템 | React, Socket.io, DnD, Redux, Swiper |
| **Layhome** | 부동산 매물 플랫폼 | React, Redux, Swiper |
| **Tebibox** | 유아기 놀이중심 교육제공 플랫폼 | React, Material-UI, Redux, Swiper |
| **부동산알리다** | 부동산중개인 고객관리 서비스 | React, 카카오맵, 카카오 로그인, PDF, Redux |

### React Native (Mobile)

| 프로젝트 | 설명 | 주요 기술 |
|---------|------|----------|
| **CloneFit** | AI기반 체성분 관리 앱 | RN, Vision Camera, Firebase, BLE, 카카오/네이버 로그인, Zustand |
| **스스므** | 패션 커뮤니티 웹 & 앱 | RN,Firebase, 카카오/네이버 로그인, Zustand |
| **GOA** | BLE 웨어러블 앱 | RN, BLE, GPS, Firebase, 카카오/네이버/Google 로그인, Redux |
| **Lime** | 상담 플랫폼 앱 | RN, Sendbird, Firebase, 푸시 알림 |
| **MyCash** | 전당포 앱 | RN, Firebase, 이미지 처리, 다음 우편번호, Redux |
| **WATaxi / WADriver** | 택시 승객/기사 앱 | RN, BLE, GPS, Background Timer, Redux |
| **Yackssock** | 복약알림 BLE 앱 | RN, Expo, AWS Amplify, Firebase, Lottie, Redux |

### PHP (PC + Mobile)

| 프로젝트 | 설명 | 주요 기술 |
|---------|------|----------|
| **Hola** | 주식 종목 추천 | PHP, laravel |
| **자동문의고수** | 자동문 설치 중개 플랫폼 | PHP, laravel |
