# 포트폴리오

> 모든 프로젝트를 프론트엔드, 백엔드, 배포까지 **풀스택으로 단독 개발**하였습니다.

## 연락처

- **Email:** whdghks8021@gmail.com

## 참고 사항

- 서버 소스는 보안상 비공개이며, 자영업자 매장관리 앱의 서버 소스만 일부 공개하였습니다
- 추가 소스가 필요하시면 요청해 주세요. 보안 검토 후 발췌하여 전달드리겠습니다
- 각 프로젝트별 상세 설명은 해당 폴더의 README.md를 참고해주세요

---

## 주요 프로젝트

### 1. 자영업자 매장관리 앱 `2025.10 ~ 2026.02`
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

### 2. 소개팅 앱 `2026.01 ~ 진행 중`
실시간 매칭 기반 소셜 데이팅 플랫폼

| 구분 | 기술 |
|------|------|
| Frontend | React Native, Expo, Zustand |
| Backend | Node.js (비공개) |
| Infra | Firebase, Twilio |

- Socket.io 실시간 1:1 채팅 및 Twilio Voice SDK 음성 통화
- 4개 플랫폼 소셜 로그인 (카카오, 네이버, Google, Apple)
- iOS/Android 인앱 결제 및 정기 구독 시스템

**상태:** 개발 완료, 기능 추가 기획 중

[상세보기 →](./소개팅%20앱)

---

### 3. 캐나다&미국 카풀 앱 `2025.02 ~ 2025.09`
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

### 4. 밍글 홈페이지 `2025.04 ~ 진행 중`
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

## 기타 프로젝트

위 주요 프로젝트 외에도 다양한 React / React Native 프로젝트를 개발하였습니다.

### React (Web)

| 프로젝트 | 설명 | 주요 기술 |
|---------|------|----------|
| **Lime** | 소셜/커뮤니케이션 플랫폼 | React, Sendbird (영상통화/채팅), Firebase, 소셜 로그인 |
| **ESR** | 부동산 관리 시스템 | React, Socket.io, PDF, 지도 API, DnD |
| **PMS** | 프로퍼티 관리 시스템 | React, 음성인식, PDF, 지도 API, DnD |
| **JJNomad** | 에듀테크 플랫폼 | React, 차트, DnD, Fullpage Scroll |
| **Layhome** | 부동산 매물 플랫폼 | React, Redux, 날짜 선택 |
| **MyCash** | 개인 재무 관리 | React, 카카오맵, PDF 내보내기 |
| **Portfolio** | 3D 인터랙티브 포트폴리오 | React, Three.js, Spline, Vite |
| **Tebibox** | 이커머스/리테일 플랫폼 | React, Material-UI, Swiper |
| **부동산알리다** | 부동산 알림 서비스 | React, 카카오맵, PDF, DnD |
| **Widai** | 비디오 플레이어 | React 19, Video.js, Vite |
| **AIWith** | AI 서비스 | React, 카카오/네이버 로그인 |
| **성과급계산기** | 성과급 계산 유틸리티 | React |

### React Native (Mobile)

| 프로젝트 | 설명 | 주요 기술 |
|---------|------|----------|
| **CloneFit** | 피트니스/헬스 트래킹 앱 | RN, 차트, 카메라, TTS, 캘린더 |
| **GOA** | BLE 웨어러블 헬스 트래킹 앱 | RN, Bluetooth, GPS, 소셜 로그인 |
| **Lime** | 메시징/영상통화 앱 | RN, Sendbird, 푸시 알림, 채팅 |
| **BreeDing** | 매칭/데이팅 앱 | RN, 채팅, 갤러리, 영상, 캘린더 |
| **Lefi** | 금융/주식/크립토 앱 | RN, 차트, Redux |
| **MyCash** | 개인 재무 관리 앱 | RN, 이미지 처리, 로컬 저장소 |
| **WATaxi / WADriver** | 택시 승객/기사 앱 | RN, BLE, GPS, 위치 추적, TTS |
| **JavaTaxi** | 택시/라이드쉐어 앱 | RN, BLE, 위치 추적 |
| **Yackssock** | 소셜 네트워킹 앱 | RN, Expo, AWS Amplify, Firebase, Lottie |
