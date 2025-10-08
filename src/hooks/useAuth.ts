import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { createDefaultSystemList } from "@/services/todoMenu";
import type { User, Session, OAuthResponse } from "@supabase/supabase-js";
import { authLogger } from "@/lib/logger";

// -------------------------------------------------------------- useAuth Hook

/**
  Supabase 세션 관리 프로세스
  1. 로그인 
  2. access_token : localstorage, refresh_token : Cookie에 저장
  3. getSession() 호출 시 localstorage의 access_token을 이용해 세션 복원 시도(별도의 네트워크 요청 없이 로컬에서 세션 객체 생성)
  4. access_token이 만료된 경우, 쿠키의 refresh_token을 이용해 새로운 access_token 발급 시도(네트워크 요청 발생)
  5. 새로운 access_token 발급에 실패한 경우 -> 1번으로
  6. refresh token도 만료된 경우 -> 1번으로
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트 마운트 시 세션 체크
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setState(session);
    };
    initializeAuth();

    // 인증 상태 변화 구독 => 유저 정보가 변경되면 자동으로 세션과 유저 상태 업데이트
    // 예) SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY 등
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState(session);

      authLogger.info("Auth state changed", { event, hasSession: !!session });
      // 사용자가 로그인한 경우 신규 사용자 여부를 확인하고 신규 사용자에게 필요한 로직 실행
      if (event === "SIGNED_IN" && session?.user) {
        // await을 사용하면 기다려야 하기 때문에 then() 사용으로 기다리지 않고 비동기로 처리 (avatar 렌더링 지연 방지)
        checkIfNewUser().then((isNew) => {
          if (isNew) handleNewUserSetup(session.user.id);
        });
      }
    });

    // 언마운트 시(페이지 전환, 컴포넌트 제거 등) 구독 해제
    return () => subscription.unsubscribe();
  }, []);

  const setState = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  };

  // 구글 OAuth 로그인
  const signInWithOAuth = async ({
    providerName,
  }: {
    providerName: "google" | "kakao" | "github";
  }): Promise<{ data?: OAuthResponse; error?: Error | null }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: providerName,
        options: {
          redirectTo: `${window.location.origin}`, //origin: 프로토콜 + 호스트명 + 포트번호 = root URL
        },
      });

      if (error) throw error;

      return { data: data as unknown as OAuthResponse };
    } catch (error) {
      authLogger.error("로그인 실패", { error, providerName });
      return { error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      authLogger.error("로그아웃 실패", { error });
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signInWithOAuth,
    signOut,
  };
}

// -------------------------------------------------------------- Helper Functions

/* 신규 사용자인지 확인하는 헬퍼 함수 */
const checkIfNewUser = async (): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return false;

    const { data: existingUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    return existingUser ? false : true;
  } catch (error) {
    authLogger.error("신규 사용자 확인 중 오류", { error });
    return false;
  }
};

/* 신규 사용자 초기화 처리 헬퍼 함수 */
const handleNewUserSetup = async (userId: string): Promise<void> => {
  // 1. 사용자 정보 저장
  await signUpWithOAuth();

  // 2. 기본 시스템 리스트 생성
  await createDefaultSystemList(userId);
};

// OAuth 회원가입 = auth.user 정보를 그대로 저장
const signUpWithOAuth = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) throw new Error("No authenticated user found");

    // 사용자 정보를 데이터베이스에 저장
    const { error } = await supabase.from("users").insert([
      {
        id: user.id,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    authLogger.error("사용자 정보 저장 실패", { error });
    throw error;
  }
};
