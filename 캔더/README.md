# 캔더 (Candour)

"당신의 이력서가 스스로 답합니다" — AI 이력서 대변인 서비스 (구직자·HR 웹 + 관리자 웹)

> 🤖 **AI Native Development** — 이 프로젝트는 Claude Code 기반 AI Native 환경에서 기획·개발·QA·배포 전 과정을 AI 에이전트와 협업하며 개발했습니다. 또한 **서비스 자체가 Claude API 기반 AI 제품**입니다.

| 항목 | 내용 |
|------|------|
| **개발 기간** | 2026.07 ~ 진행 중 |
| **역할** | 풀스택 단독 개발 (기획, 프론트엔드, 백엔드, AI 파이프라인, 배포) |
| **상태** | 운영 중, 기능 고도화 진행 중 |
| **사이트** | [candour.mingle.company](https://candour.mingle.company) |
| **개발 방식** | `🤖 AI Native` Claude Code 협업 개발 + Claude API 제품 |

## 💬 프로젝트 개요

구직자가 이력서(PDF)를 업로드하고 공개 링크를 만들면, 인사담당자가 그 링크로 접속해 **AI 대변인과 실시간 대화**하며 지원자에 대해 질문할 수 있는 서비스입니다. AI는 이력서 원문을 근거로 답변하며, 답변마다 **출처 페이지 인용**이 달리고 우측 PDF 뷰어에서 해당 페이지가 하이라이트됩니다.

## 🛠 기술 스택

### WEB (구직자 · HR 웹)
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** styled-jsx (SSR 레지스트리), Tailwind CSS 4
- **PDF:** pdfjs-dist (이력서 뷰어 · 페이지 인용 하이라이트)
- **Payment:** Toss Payments SDK (빌링키 카드 등록 → 저장 카드 크레딧 결제)
- **Authentication:** 카카오 소셜 로그인

### ADMIN (관리자 웹)
- **Framework:** Next.js 15, TypeScript
- **UI:** Ant Design, TipTap (법무 문서 에디터)
- **차트:** Recharts (사용량 통계)

### Backend (비공개)
- **Runtime:** Node.js, Express, Sequelize
- **AI:** Claude API 기반 AI 대변인 (이력서 파싱 · 근거 인용 답변)
- **Infra:** Docker + nginx 리버스 프록시

### 주요 라이브러리
```json
{
  "@tosspayments/tosspayments-sdk": "^2.7.1", // 빌링키 결제
  "pdfjs-dist": "^6.2.108",                   // PDF 이력서 뷰어
  "next": "16.2.10",                          // App Router + 파일 컨벤션 OG
  "antd": "^6.4.3",                           // 관리자 UI
  "recharts": "^2.15.4"                       // 사용량 통계
}
```

## ✨ 주요 기능

### 1. AI 대변인 대화 (HR 화면)
- **실시간 채팅:** 인사담당자가 지원자에 대해 자유롭게 질문
- **근거 인용:** 답변마다 "○○.pdf n페이지 근거" 인용 칩 표시
- **PDF 연동:** 인용 클릭 시 우측 PDF 뷰어가 해당 페이지로 이동·하이라이트
- **사실·중립 모드:** 이력서에 없는 내용은 지어내지 않는 답변 정책

### 2. 이력서 · 프로필 관리 (구직자)
- **PDF 업로드:** 이력서·포트폴리오 자료 관리
- **이력서로 자동 채우기:** AI가 PDF를 파싱해 프로필 자동 완성
- **연락처 공개 제어:** 이메일·휴대폰의 HR 노출 여부 토글

### 3. 공개 링크 공유
- **링크 발급:** `/l/[slug]` 공개 링크, `/r/[token]` 열람 토큰 링크
- **OG 미리보기:** 링크 공유 시 카드형 미리보기 (Next.js 파일 컨벤션 OG 이미지)

### 4. 크레딧 & 결제
- **빌링키 결제:** 토스페이먼츠 카드 등록 → 저장 카드로 리다이렉트 없는 즉시 결제
- **크레딧 시스템:** 대화 사용량 기반 크레딧 차감·충전

### 5. 관리자 시스템
- **회원/사용량/법무 문서/운영 관리**, Recharts 사용량 대시보드

## 📁 프로젝트 구조

```
WEB/
├── src/
│   ├── app/
│   │   ├── dashboard/         # 구직자 대시보드 (링크·프로필·자료·대화·크레딧)
│   │   ├── l/[slug]/          # HR 공개 링크 (AI 대변인 화면)
│   │   ├── r/[token]/         # 열람 토큰 링크
│   │   ├── login/             # 소셜 로그인
│   │   └── registry.tsx       # styled-jsx SSR 레지스트리
│   ├── components/
│   │   ├── ChatWorkspace.tsx  # AI 대변인 채팅 워크스페이스
│   │   ├── PdfViewer.tsx      # PDF 뷰어 (인용 하이라이트)
│   │   └── LoginBackdrop.tsx  # 로그인 인터랙티브 배경
│   └── lib/                   # API 클라이언트, siteUrl 헬퍼

ADMIN/
└── src/app/
    ├── dashboard/             # 운영 대시보드
    ├── members/               # 회원 관리
    ├── usage/                 # 사용량 통계 (Recharts)
    └── legal/                 # 법무 문서 관리 (TipTap)
```

## 🎯 주요 기술적 도전

1. **AI 근거 인용 파이프라인:** AI 답변과 PDF 원문 페이지를 연결하는 인용 시스템 — 답변 신뢰도를 UI로 보증하는 설계
2. **토스 빌링키 단일 결제 경로:** 카드 등록(빌링키) → 저장 카드 결제로 리다이렉트 없는 결제 UX 구현, CSP 위반 실측 수집으로 결제 도메인 허용 목록 확정
3. **styled-jsx SSR 최적화:** 배포 빌드에서만 발생하는 초기 스타일 누락을 SSR 레지스트리로 해결 (로컬 재현 불가 이슈 추적)
4. **Next.js 파일 컨벤션 OG:** 세그먼트별 OG 메타데이터 병합 함정을 정적 import 방식으로 해결
5. **프롬프트 신뢰성 설계:** 이력서에 없는 내용을 답하지 않는 사실·중립 AI 대변인 정책 구현

> **서버 소스**(Claude API 파이프라인 포함)는 보안상 비공개입니다.
