import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import EntryEditor from './pages/EntryEditor'
import EntryView from './pages/EntryView'
import Goals from './pages/Goals'
import Stats from './pages/Stats'

function AuthGate() {
  const { authed, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-slate-soft text-sm font-mono">
        Loading…
      </div>
    )
  }

  if (!authed) return <Login />

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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Redirect root → app (no public landing in single-user mode) */}
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* Everything lives under /app — AuthGate handles lock screen */}
            <Route path="/app/*" element={<AuthGate />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
