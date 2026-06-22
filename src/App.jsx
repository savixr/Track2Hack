import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import EntryEditor from './pages/EntryEditor'
import EntryView from './pages/EntryView'
import Goals from './pages/Goals'
import Stats from './pages/Stats'

function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate-soft text-sm font-mono">Loading...</div>
  }

  if (!user) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="journal" element={<Journal />} />
        <Route path="journal/new" element={<EntryEditor />} />
        <Route path="journal/:id" element={<EntryView />} />
        <Route path="journal/:id/edit" element={<EntryEditor />} />
        <Route path="goals" element={<Goals />} />
        <Route path="stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  )
}

function LoginOrRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen bg-paper flex items-center justify-center text-slate-soft text-sm font-mono">Loading...</div>
  }
  if (user) return <Navigate to="/app" replace />
  return <Login />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />

          {/* Login (also reachable directly) */}
          <Route
            path="/login"
            element={
              <AuthProvider>
                <LoginOrRedirect />
              </AuthProvider>
            }
          />

          {/* Password reset — landed on from the emailed recovery link */}
          <Route
            path="/reset-password"
            element={
              <AuthProvider>
                <ResetPassword />
              </AuthProvider>
            }
          />

          {/* Authenticated app */}
          <Route
            path="/app/*"
            element={
              <AuthProvider>
                <AuthGate />
              </AuthProvider>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
