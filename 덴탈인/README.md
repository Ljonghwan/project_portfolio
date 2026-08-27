# 덴탈인

치과 종사자 구인구직 + 익명 커뮤니티 플랫폼 (사용자 웹 + 관리자 웹)

> 🤖 **AI Native Development** — 이 프로젝트는 Claude Code 기반 AI Native 환경에서 기획·개발·QA 전 과정을 AI 에이전트와 협업하며 개발했습니다.

| 항목 | 내용 |
|------|------|
| **개발 기간** | 2026.05 ~ 2026.07 |
| **역할** | 풀스택 단독 개발 (기획, 프론트엔드, 백엔드, 배포) |
| **상태** | 운영 중 |
| **사이트** | [dentalin.kr](https://dentalin.kr) |
| **개발 방식** | `🤖 AI Native` Claude Code 협업 개발 |

## 🦷 프로젝트 개요

치과위생사·치과기공사 등 치과 종사자를 위한 버티컬 플랫폼입니다. 상세 필터 기반 채용정보와 급구 게시판, 익명 병원 후기·수다방 커뮤니티를 제공하며, 개인 회원과 병원(기업) 회원이 분리된 구조로 운영됩니다.

## 🛠 기술 스택

### WEB (사용자 웹)
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **State Management:** Zustand
- **Security:** isomorphic-dompurify (XSS 방어)
- **UI/UX:** 디자인 토큰 기반 커스텀 CSS (Pretendard), yet-another-react-lightbox

### ADMIN (관리자 웹)
- **Framework:** Next.js 15, TypeScript
- **UI:** Ant Design
- **차트:** Recharts (운영 대시보드)

### Backend (비공개)
- **Runtime:** Node.js, TypeScript (strict), Express, Sequelize, MySQL
- **인증:** 자체 JWT (accessToken + refreshToken)
- **파일 업로드:** S3 + CloudFront (환경별 스토리지 드라이버 분기)
- **Infra:** Docker + pm2

## ✨ 주요 기능

### 1. 채용정보
- **상세 검색:** 지역(17개 시도), 고용형태, 경력, 최소 급여 복합 필터
- **정렬/즐겨찾기:** 최신순·급여순 정렬, 관심 공고 즐겨찾기
- **채용 등록:** 병원 회원의 공고 등록·관리

### 2. 급구 게시판
- **긴급 채용:** 마감 임박 D-day 표시, 급여·담당업무·연락처 요약 카드

### 3. 익명 커뮤니티
- **익명 병원후기:** 평점 + 직종·지역 태그 기반 근무 후기 (작성 시 익명 닉네임 자동 생성)
- **익명 수다방:** 일상·고민상담·병원생활·이직취업·진료케이스 등 카테고리별 게시판
- **열람 권한:** 후기 상세는 로그인 회원 전용

### 4. 회원 시스템
- **개인/기업 분리 가입:** 치과 종사자(직종 선택)와 병원 회원 별도 플로우
- **SNS 로그인, 아이디 찾기/비밀번호 재설정, 알림**

### 5. 관리자 시스템
- **대시보드:** Recharts 기반 운영 지표 시각화
- **회원/콘텐츠/운영/고객지원 관리**

## 📁 프로젝트 구조

```
WEB/
├── src/
│   ├── app/               # 화면 (App Router)
│   │   ├── jobs/          # 채용정보 목록/상세/등록
│   │   ├── urgents/       # 급구 게시판
│   │   ├── reviews/       # 익명 병원후기
│   │   ├── talks/         # 익명 수다방
│   │   ├── search/        # 통합 검색
│   │   ├── signup/        # 개인/기업 회원가입
│   │   ├── mypage/        # 마이페이지
│   │   └── notifications/ # 알림
│   ├── components/        # 공용 컴포넌트
│   ├── lib/               # API 클라이언트, 유틸
│   └── stores/            # Zustand 스토어

ADMIN/
└── src/app/
    ├── dashboard/         # 운영 대시보드 (Recharts)
    ├── members/           # 회원 관리
    ├── contents/          # 콘텐츠 관리 (후기/수다방/공고)
    ├── ops/               # 운영 관리
    └── support/           # 고객지원
```

## 🎯 주요 기술적 도전

1. **퍼블리싱 HTML → Next.js 이식:** 디자인 토큰(`--brand`, `--ink`, `--surface` 등)을 보존하며 정적 퍼블리싱을 App Router 구조로 완전 이식
2. **익명 커뮤니티 설계:** 글마다 익명 닉네임을 자동 생성하면서도 본인 글 식별("내 글")이 가능한 익명성 모델 구현
3. **XSS 방어:** 사용자 생성 콘텐츠 전반에 DOMPurify 새니타이징 적용 (QA 단계에서 XSS 공격 시나리오 검증)
4. **개인/기업 이원화 회원 모델:** 직종 기반 개인 회원과 병원 회원의 가입·권한·기능 분리 설계

> **서버 소스**는 보안상 비공개입니다.
