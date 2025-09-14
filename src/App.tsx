import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/not-found";
import TodoPage from "./pages/todo-page";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-background">
              <main className="max-w-7xl mx-auto px-4 flex items-center justify-center flex-1 h-screen">
                <h1 className="text-4xl font-bold text-foreground">Home</h1>
              </main>
            </div>
          }
        />
        <Route path="/todo" element={<TodoPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
