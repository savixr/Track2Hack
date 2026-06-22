import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { Loader2 } from 'lucide-react'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper font-mono px-4 relative">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-4">
            <Logo />
          </Link>
          <h1 className="font-serif text-xl font-semibold text-slate-ink">Set a new password</h1>
          <p className="text-sm text-slate-soft mt-1 text-center">Choose something you haven't used before</p>
        </div>

        {done ? (
          <div className="bg-paper-warm border border-paper-line rounded-xl p-6 text-center">
            <p className="text-sm text-moss">Password updated. Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-paper-warm border border-paper-line rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-soft mb-1.5">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-soft mb-1.5">Confirm password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Update password
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-soft mt-6">
          <Link to="/login" className="hover:text-slate-ink underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
