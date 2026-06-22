import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a link to reset your password.')
      }
      setLoading(false)
      return
    }

    const action = mode === 'signin' ? signIn : signUp
    const { error } = await action(email, password)

    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setMessage('Check your email to confirm your account, then sign in.')
    }
    setLoading(false)
  }

  const heading = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Start your logbook' : 'Reset your password'
  const subheading = mode === 'forgot'
    ? "Enter your email and we'll send you a reset link"
    : 'Track your path into cyber security'

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
          <h1 className="font-serif text-xl font-semibold text-slate-ink">{heading}</h1>
          <p className="text-sm text-slate-soft mt-1 text-center">{subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper-warm border border-paper-line rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-soft mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-soft">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-rust hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-moss">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {mode === 'forgot' ? (
          <p className="text-center text-sm text-slate-soft mt-4">
            <button onClick={() => switchMode('signin')} className="text-rust hover:underline font-medium">
              ← Back to sign in
            </button>
          </p>
        ) : (
          <p className="text-center text-sm text-slate-soft mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-rust hover:underline font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}

        <p className="text-center text-xs text-slate-soft mt-6">
          <Link to="/" className="hover:text-slate-ink underline">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
