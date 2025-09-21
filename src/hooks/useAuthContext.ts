import { useContext, createContext } from "react";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOAuth: (params: {
    providerName: "google" | "kakao" | "github";
  }) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuthContext는 AuthProvider 내에서만 사용할 수 있습니다"
    );
  }

  return context;
}