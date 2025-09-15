import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "@/pages/not-found";
import TodoPage from "@/pages/todo-page";
import LandingPage from "@/pages/LandingPage";
import { ProtectedRoute } from "@/pages/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/todo"
          element={
            <ProtectedRoute>
              <TodoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center">
                <h1 className="text-4xl font-bold">
                  Calendar Page (Coming Soon)
                </h1>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
