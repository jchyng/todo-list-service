import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/routes";
import { ToastContainer } from "@/components/ToastContainer";

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
