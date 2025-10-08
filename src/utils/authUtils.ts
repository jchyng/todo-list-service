import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { ServiceResult } from "./serviceUtils";

/**
 * 현재 세션 가져오기
 */
export async function getCurrentSession(): Promise<ServiceResult<Session>> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!session) {
    return { success: false, error: "인증이 필요합니다" };
  }

  return { success: true, data: session };
}

/**
 * 인증 필수 체크 (간편 버전)
 */
export async function requireAuth(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
