import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { ToastProvider } from "./shared/context/ToastContext";
import { TeachersProvider } from "./features/profiles/admin/pages/classes/context/TeachersContext";
import { ForceChangePasswordGate } from "@shared/components/manage_password/ForceChangePasswordGate";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <TeachersProvider>
            <AppRouter />
            <ForceChangePasswordGate />
          </TeachersProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}