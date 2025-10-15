# CLAUDE.md

React 19 + TypeScript 기반의 할 일 관리 애플리케이션

## 기술 스택

- **프론트엔드**: React 19, Vite, TypeScript
- **스타일링**: Tailwind CSS, Shadcn UI
- **백엔드**: Supabase (인증, 데이터베이스, Edge Functions)
- **라우팅**: React Router DOM v7

## 아키텍처 구조

### 서비스 레이어 (역할별 모듈화)

```
src/
├── services/
│   ├── todoItem/          # 할 일 아이템 관리
│   │   ├── crud.ts        # 생성, 조회, 수정, 삭제
│   │   ├── completion.ts  # 완료 상태 관리
│   │   ├── position.ts    # 순서 변경
│   │   └── utils.ts       # 공통 유틸리티
│   ├── todoMenu/          # 메뉴 관리 (그룹/리스트)
│   │   ├── groups.ts      # 그룹 생성, 해제
│   │   ├── lists.ts       # 리스트 생성, 수정, 삭제
│   │   └── menu.ts        # 메뉴 조회, 카운트
│   ├── recurrence/        # 반복 규칙 관리
│   │   ├── converters.ts  # RepeatConfig ↔ RecurrenceRule 변환
│   │   └── crud.ts        # 반복 규칙 CRUD
│   └── systemTodoService.ts  # 시스템 메뉴(오늘, 중요)
├── hooks/
│   ├── useAuth.ts              # 인증 상태 관리
│   ├── useTodoMenuData.ts      # 메뉴 데이터 로딩
│   └── useTodoMenuActions.ts   # 메뉴 액션 (낙관적 업데이트)
├── contexts/
│   ├── AuthContext.tsx         # 전역 인증 상태
│   └── TodoMenuContext.tsx     # 전역 메뉴 상태
└── utils/
    ├── optimisticHelpers.ts    # 낙관적 업데이트 헬퍼
    ├── authUtils.ts            # 인증 유틸리티
    └── serviceUtils.ts         # 공통 서비스 유틸
```

## 핵심 설계 원칙

### 1. 낙관적 UI (Optimistic UI)

**모든 사용자 액션은 즉시 UI에 반영**
- UI 즉시 업데이트 → 백그라운드 DB 저장 → 실패 시 롤백
- React의 `useOptimistic`, `startTransition` 활용
- `utils/optimisticHelpers.ts`에서 공통 패턴 제공 (`executeOptimisticUpdate` 함수)

### 2. 모듈화 및 단일 책임 원칙

**역할별 파일 분리로 유지보수성 향상**
- 각 파일은 100-150줄 내외
- 하나의 파일은 하나의 책임만 담당
- 기능별 폴더 구조로 확장 용이

### 3. Fractional Indexing (Position 관리)

**PostgreSQL 함수에서 순서 계산 자동 처리**
- 클라이언트: "A 뒤에 추가" 요청만 전송
- 서버: `generate_position_between` RPC 함수로 자동 계산
- 장점: 프론트엔드 부하 최소화, 타입 안전성

### 4. 타입 안전성

**TypeScript 엄격 모드 + 명확한 타입 정의**
- 모든 서비스 함수는 `ServiceResult<T>` 반환
- DB 스키마와 일치하는 타입 정의
- `any` 사용 최소화

## 개발 가이드

### 명령어

```bash
npm run dev    # 개발 서버 (http://localhost:5173)
npm run build  # 프로덕션 빌드
npm run lint   # ESLint 검사
```

### 코드 컨벤션

- **Import 경로**: `@/*` 별칭 사용 (예: `@/services/todoItem`)
- **명명 규칙**: camelCase (함수/변수), PascalCase (컴포넌트/타입)
- **파일 구조**: 기능별 폴더 → 역할별 파일

### 데이터베이스 작업

**PostgreSQL 함수 관리**
- 정의: `src/sql/functions/` 폴더
- 배포: Supabase Dashboard SQL Editor 또는 MCP Supabase
- 호출: `supabase.rpc('function_name', params)`

**주요 RPC 함수**
- `generate_position_between`: Position 계산
- `get_user_menus_with_positions`: 사용자 메뉴 통합 조회
- `get_system_menu_counts`: 시스템 메뉴 카운트
- `create_next_recurring_task`: 다음 반복 작업 생성

### 새 기능 추가 시

1. **서비스 함수 작성** (`services/` 폴더)
   - CRUD 로직과 비즈니스 로직 분리
   - `ServiceResult<T>` 타입으로 통일된 응답

2. **커스텀 훅 작성** (`hooks/` 폴더)
   - 상태 관리 로직 캡슐화
   - 낙관적 업데이트 패턴 적용

3. **컴포넌트에서 사용**
   - 훅을 통해 데이터 및 액션 접근
   - UI는 상태에만 집중

## 주요 특징

- 실시간 동기화 (Supabase Realtime)
- 반복 작업 관리 (간소화된 5가지 옵션)
- 드래그 앤 드롭 메뉴 정렬
- 다크 모드 지원
- 반응형 디자인
