import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN") {
        console.log("User signed in:", session?.user);
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (await isNewUser()) {
        //todo: 신규 사용자 생성 시 기본으로 필요한 todo list 생성
      }

      return { data, error: null };
    } catch (error) {
      console.error("Google 로그인 실패:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const isNewUser = async (): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return false;

    const createdAt = new Date(user.created_at).getTime();
    const lastSignInAt = new Date(
      user.last_sign_in_at ?? user.created_at
    ).getTime();

    return createdAt === lastSignInAt;
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };
}
