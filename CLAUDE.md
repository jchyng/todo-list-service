# CLAUDE.md

React 19 + TypeScript 기반의 할 일 관리 애플리케이션

## 개발 명령어

- **개발 서버**: `npm run dev`
- **빌드**: `npm run build`
- **린트**: `npm run lint`

## 기술 스택

- **프론트엔드**: React 19, Vite, TypeScript
- **스타일링**: Tailwind CSS, Shadcn
- **백엔드**: Supabase (인증, 데이터베이스)
- **라우팅**: React Router DOM v7

#### 컴포넌트 구조

src/
├── components/ # 공유 UI 컴포넌트
│ ├── ui/ # Radix 기반 디자인 시스템 컴포넌트
│ ├── Header.tsx # 검색 및 사용자 메뉴가 포함된 메인 네비게이션
│ ├── UserAvatar.tsx # 사용자 프로필 아바타 컴포넌트
│ └── ToastContainer.tsx # 전역 토스트 알림
├── pages/
│ ├── LandingPage.tsx # 공개 랜딩 페이지
│ ├── todo/ # 할 일 애플리케이션 페이지
│ │ ├── index.tsx # 메인 할 일 페이지 레이아웃
│ │ └── components/ # 할 일 관련 컴포넌트
│ │ └── Sidebar/ # 메뉴가 포함된 사이드바 네비게이션
└── hooks/
├── useAuth.ts # 인증 훅
└── useToast.ts # 토스트 알림 훅

### 라우트 구조

`/` - 랜딩 페이지 (공개)
`/todo` - 메인 할 일 애플리케이션 (보호됨)
`/calendar` - 캘린더 뷰 (보호됨, 플레이스홀더)
`*` - 404 페이지

## 코드 컨벤션

- `@/*` 경로 별칭으로 src/\* import
- 역할 별 함수 분리와 코드 재사용

## 개발 규칙

- 한국어 사용
- 데이터베이스 스키마 변경 시 schema.sql에 반영
