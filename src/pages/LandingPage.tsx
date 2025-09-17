import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const { user, loading, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/todo");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      {/* Header with Google Login */}
      <header className="w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <GoogleLoginBtn
            onClick={() => signInWithOAuth({ providerName: "google" })}
            loading={loading}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold mb-4">Todo App</h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in with Google to access your todos.
          </p>
        </div>
      </main>
    </div>
  );
}

const GoogleLoginBtn = ({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) => {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={loading}
    >
      <img
        className="w-4 h-4"
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        loading="lazy"
        alt="google logo"
      />
      <span>{loading ? "Signing in..." : "Login with Google"}</span>
    </button>
  );
};
