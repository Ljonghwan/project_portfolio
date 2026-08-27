# 모두의드라이브 (모드)

드라이브 메이트 매칭 소셜 플랫폼 (앱 + 관리자 웹 + 랜딩 사이트)

> 🤖 **AI Native Development** — 이 프로젝트는 Claude Code 기반 AI Native 환경에서 기획·개발·QA·배포 전 과정을 AI 에이전트와 협업하며 개발했습니다.

| 항목 | 내용 |
|------|------|
| **개발 기간** | 2026.03 ~ 진행 중 |
| **역할** | 풀스택 단독 개발 (기획, 프론트엔드, 백엔드, 인프라, 배포) |
| **상태** | 운영 중 |
| **사이트** | [modudrive.co.kr](https://modudrive.co.kr) |
| **개발 방식** | `🤖 AI Native` Claude Code 협업 개발 |

## 🚗 프로젝트 개요

차종·운전 스타일·관심 지역이 맞는 드라이브 메이트를 찾아주는 매칭 소셜 앱입니다. 오너/게스트 양방향 매칭(1:1·모임), 실시간 채팅, 매너 점수와 노쇼 방지 시스템, 드라이브 코스 후기 공유 기능을 제공합니다.

## 🛠 기술 스택

### APP (사용자 앱)
- **Framework:** React Native 0.81, Expo 54, Expo Router 6
- **State Management:** Zustand
- **Real-time:** Socket.io (실시간 채팅)
- **Authentication:** 카카오, Apple, Facebook 소셜 로그인
- **Payment:** react-native-iap (인앱 결제 / 포인트 충전)
- **Push:** Expo Notifications
- **Editor:** TipTap 3 (코스 후기 리치 에디터, WebView 번들 커스텀 빌드)
- **Monitoring:** Firebase Analytics / Crashlytics / Performance
- **UI/UX:** Reanimated 4, FlashList 2, Bottom Sheet

### ADMIN (관리자 웹)
- **Framework:** React 19, Vite
- **UI:** Ant Design, dnd-kit (드래그 앤 드롭), TipTap
- **차트/통계:** 대시보드 기반 운영 지표 관리

### 랜딩WEB (소개 사이트)
- **Framework:** React 19, Vite, Ant Design

### Backend / Infra (비공개)
- **Runtime:** Node.js, Express, Sequelize, MySQL
- **Infra:** AWS (EC2 + Docker, ALB, S3 + CloudFront, CloudWatch 알람 9종, Lambda 일일 리포트, SNS), pm2

### 주요 라이브러리
```json
{
  "socket.io-client": "^4.8.3",            // 실시간 채팅
  "react-native-iap": "^15.3.1",           // 인앱 결제 (포인트)
  "@react-native-kakao/user": "^2.4.5",    // 카카오 로그인
  "expo-apple-authentication": "~8.0.8",   // Apple 로그인
  "react-native-fbsdk-next": "^13.4.3",    // Facebook 로그인 + 광고 이벤트
  "@tiptap/core": "^3.22.3",               // 코스 후기 리치 에디터
  "expo-notifications": "~0.32.16",        // 푸시 알림
  "@shopify/flash-list": "^2.3.1",         // 고성능 리스트
  "zustand": "^5.0.12"                     // 전역 상태 관리
}
```

## ✨ 주요 기능

### 1. 드라이브 메이트 매칭
- **양방향 매칭:** 오너(차주)와 게스트가 서로 모집글을 올리고 신청하는 구조
- **매칭 유형:** 1:1 매칭 / 모임 매칭
- **상세 필터:** 지역, 날짜, 차종, 성별, 연령대 필터링
- **일정 조율:** 매칭 성사 후 약속 시간·장소 채팅으로 조율

### 2. 실시간 커뮤니케이션
- **실시간 채팅:** Socket.io 기반 매칭별 채팅방
- **푸시 알림:** 매칭 신청/성사/채팅 알림

### 3. 신뢰/안전 시스템
- **매너 점수:** 드라이브 후 상호 매너 평가
- **노쇼 방지:** 불참 처리 및 페널티 정책
- **신고/차단:** 사용자 신고 및 차단 기능

### 4. 코스 후기 & 콘텐츠
- **드라이브 후기:** TipTap 리치 에디터 기반 사진·장소 포함 후기 작성
- **소식/공지:** 뉴스, 공지사항, FAQ

### 5. 포인트 & 결제
- **인앱 결제:** iOS/Android 포인트 충전
- **리워드:** 후기 작성·초대 등 활동 기반 포인트 지급
- **친구 초대:** 초대 코드 시스템

### 6. 관리자 시스템
- **회원/매칭/포인트/신고/문의/콘텐츠/운영 관리** 등 운영 전반 모듈
- **드래그 앤 드롭** 기반 콘텐츠 정렬 관리

## 📁 프로젝트 구조

```
APP/
├── app/                    # 화면 (Expo Router)
│   ├── (tabs)/            # 홈 · 찾기 · 채팅 · 알림 · 마이
│   ├── auth/              # 로그인/회원가입
│   ├── match/             # 매칭 등록/상세/신청
│   ├── chat/              # 실시간 채팅
│   ├── review/            # 매너 평가 · 드라이브 후기
│   ├── point/             # 포인트 충전/내역
│   └── invite.js          # 친구 초대
├── src/
│   ├── api/               # API 클라이언트
│   ├── components/        # 공용 컴포넌트
│   ├── hooks/             # Custom Hooks
│   └── store/             # Zustand 스토어
├── patches/               # patch-package 네이티브 패치
└── plugins/               # Expo Config Plugin (커스텀 네이티브 설정)

ADMIN/
└── src/pages/             # 회원 · 매칭 · 포인트 · 신고 · 문의 · 콘텐츠 · 운영 관리

랜딩WEB/
└── src/components/        # Hero · Features · HowItWorks · DownloadCTA
```

## 🎯 주요 기술적 도전

1. **양방향 매칭 도메인 설계:** 오너/게스트가 모두 모집자이자 신청자가 되는 대칭 구조의 매칭 상태 머신(모집→신청→성사→진행→종료/불참) 설계
2. **TipTap WebView 번들링:** React Native에서 TipTap 에디터를 쓰기 위해 esbuild로 전용 번들을 생성해 WebView에 주입하는 커스텀 파이프라인 구축
3. **Expo Config Plugin 커스터마이징:** Android 빌드 이슈, 광고 리퍼러, iOS Firebase SPM 충돌을 자체 Config Plugin으로 해결
4. **매너 점수·노쇼 페널티 시스템:** 상호 평가와 불참 처리에 따른 점수 산정 및 제재 정책 구현
5. **운영 자동화 인프라:** CloudWatch 알람 9종 + Lambda 일일 리포트로 무인 모니터링 체계 구축

> **서버 소스**는 보안상 비공개입니다.
