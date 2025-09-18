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

## 데이터베이스 관리

### PostgreSQL 함수 관리
- **함수 정의**: `src/sql/functions/` 폴더에서 관리
- **배포 방법**: Supabase Dashboard → SQL Editor에서 함수 실행
- **RPC 호출**: React에서 `supabase.rpc('function_name', params)` 사용

### 최적화 기법
- **쿼리 통합**: 여러 테이블 조회 시 PostgreSQL 함수로 통합하여 1회 호출
- **타입 캐스팅**: VARCHAR → TEXT 명시적 캐스팅으로 안전한 타입 변환
- **예약어 처리**: `position` 등 예약어는 큰따옴표로 감싸기

## 개발 규칙

- 한국어 사용
- 데이터베이스 스키마 변경 시 schema.sql에 반영
- SQL 함수 수정 시 src/sql/ 폴더에 반영
- 성능 최적화 시 RPC 함수 우선 고려

## 핵심 설계 원칙

- **낙관적 UI**: 모든 사용자 액션은 즉시 UI 반영 → 백그라운드 DB 저장 → 실패시 롤백
- **Position 관리**: `fractional-indexing` 사용으로 순서 변경 시 DB 부하 최소화
