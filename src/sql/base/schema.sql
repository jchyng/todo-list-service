-- 사용자 프로필 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,                         -- auth.users.id와 동일
    isInitialized BOOLEAN DEFAULT FALSE          -- 기본 시스템 메뉴 생성 여부
);

