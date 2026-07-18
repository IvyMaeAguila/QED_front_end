import { AppRouter } from './routes/AppRouter'
import { AuthProvider } from './shared/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}