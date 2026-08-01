import { AppRouter } from './routes/AppRouter'
import { AuthProvider } from './shared/AuthContext'
import { ToastProvider } from './features/profiles/admin/pages/studentrecords/context/ToastContext'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  )
}