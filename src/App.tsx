import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./features/auth/context/authContext";
import { ToastProvider } from "./shared/context/ToastContext";
import { NotificationProvider } from "@shared/notification/NotificationContext";
import { ForceChangePasswordGate } from "@shared/components/manage_password/ForceChangePasswordGate";
import { SettingsProvider } from "./features/profiles/admin/pages/settings/context/SettingsContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <NotificationProvider>
              <AppRouter />
              <ForceChangePasswordGate />
            </NotificationProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
