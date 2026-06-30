import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import FloatingClock from './three/FloatingClock'
import { playClick, playClose } from '../lib/sounds'
import { LayoutDashboard, BookOpen, Target, BarChart3, Lock, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/app',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/journal', label: 'Journal',   icon: BookOpen },
  { to: '/app/goals',   label: 'Goals',     icon: Target },
  { to: '/app/stats',   label: 'Stats',     icon: BarChart3 },
]

export default function Layout() {
  const { lockScreen } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLock = () => {
    setMobileOpen(false)
    lockScreen()
  }

  const NavContent = () => (
    <>
      <button
        onClick={() => { navigate('/app'); setMobileOpen(false) }}
        className="px-2 mb-8 text-left"
      >
        <Logo />
        <p className="text-[11px] text-slate-soft leading-tight mt-1 ml-[38px]">Personal Journal</p>
      </button>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => { playClick(); setMobileOpen(false) }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-rust/10 text-rust font-medium'
                  : 'text-slate-soft hover:text-slate-ink hover:bg-paper-warm'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between px-3 py-2 mb-1">
        <span className="text-xs text-slate-soft">Theme</span>
        <ThemeToggle />
      </div>

      <button
        onClick={handleLock}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-soft hover:text-slate-ink hover:bg-paper-warm transition-colors"
      >
        <Lock size={16} />
        Lock
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-paper font-mono">
      <FloatingClock />

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-paper-line bg-paper sticky top-0 z-30">
        <button onClick={() => navigate('/app')}>
          <Logo />
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => { playClick(); setMobileOpen(true) }} className="text-slate-ink p-1">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-slate-ink/40" onClick={() => { playClose(); setMobileOpen(false) }} />
          <div className="relative w-64 bg-paper border-r border-paper-line p-4 flex flex-col h-full">
            <button onClick={() => { playClose(); setMobileOpen(false) }} className="absolute top-4 right-4 text-slate-soft">
              <X size={20} />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 border-r border-paper-line flex-col p-4 shrink-0 min-h-screen sticky top-0">
          <NavContent />
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
