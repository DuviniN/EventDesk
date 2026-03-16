import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import ThemeToggle from "./components/common/ThemeToggle";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <div className="fixed bottom-5 right-5 z-[70]">
        <ThemeToggle />
      </div>
    </BrowserRouter>
  );
}

