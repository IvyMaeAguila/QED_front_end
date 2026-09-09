import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./features/auth/context/authContext";
import { ToastProvider } from "./shared/context/ToastContext";
import { ForceChangePasswordGate } from "@shared/components/manage_password/ForceChangePasswordGate";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
          <ForceChangePasswordGate />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
