import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./shared/AuthContext";
import { ToastProvider } from "./features/profiles/admin/pages/studentrecords/context/ToastContext";
import { TeachersProvider } from "./features/profiles/admin/pages/classes/context/TeachersContext";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <TeachersProvider>
            <AppRouter />
          </TeachersProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}