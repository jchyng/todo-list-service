# SQL 관리 가이드

이 폴더는 Supabase PostgreSQL 데이터베이스의 커스텀 SQL 함수를 관리합니다.

## 📁 폴더 구조

```
sql/
├── functions/           # 데이터베이스 함수 정의
│   └── get_user_menus.sql
└── README.md           # 이 문서
```

## 🛠️ 사용 방법

### 1. 함수 배포
1. Supabase Dashboard 접속
2. SQL Editor로 이동
3. `functions/` 폴더의 함수 파일 내용을 복사하여 실행

### 2. 함수 수정
1. `functions/` 폴더의 해당 함수 파일 수정
2. Supabase SQL Editor에서 수정된 함수 실행

## 📋 현재 함수 목록

### `get_user_menus(p_user_id UUID)`
- **목적**: 사용자의 모든 메뉴(그룹, 목록) 조회 최적화
- **반환**: type, id, name, color, position, parent_id
- **사용법**: React에서 `supabase.rpc('get_user_menus', { p_user_id })`

## 🔧 개발 가이드

### 새 함수 추가 시
1. `functions/` 폴더에 함수 정의 파일 생성
2. React 서비스에서 RPC 호출 구현
3. 이 README 업데이트

## ⚠️ 주의사항
- 함수 수정 시 기존 사용자에게 영향이 없도록 주의
- 성능에 영향을 줄 수 있는 변경사항은 충분한 테스트 필요
- 함수 삭제 시 React 코드에서 먼저 사용 중단 확인