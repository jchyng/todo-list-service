import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/routes";
import { ToastContainer } from "@/components/ToastContainer";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
