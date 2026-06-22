import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calcStreak, currentWeekRange, currentMonthRange, fmtDate } from '../lib/dateHelpers'
import { format } from 'date-fns'
import { Flame, BookOpen, Target, Clock, Plus, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [goals, setGoals] = useState([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: entriesData }, { data: goalsData }] = await Promise.all([
        supabase.from('entries').select('id, entry_date, title, hours_spent, tag_ids').eq('user_id', user.id).order('entry_date', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(3),
      ])
      setEntries(entriesData || [])
      setGoals(goalsData || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return <div className="p-6 sm:p-8 text-slate-soft text-sm">Loading...</div>
  }

  const streak = calcStreak(entries.map((e) => e.entry_date))
  const { start: weekStart, end: weekEnd } = currentWeekRange()
  const { start: monthStart, end: monthEnd } = currentMonthRange()

  const weekEntries = entries.filter((e) => {
    const d = new Date(e.entry_date)
    return d >= weekStart && d <= weekEnd
  })
  const monthEntries = entries.filter((e) => {
    const d = new Date(e.entry_date)
    return d >= monthStart && d <= monthEnd
  })

  const weekHours = weekEntries.reduce((sum, e) => sum + (e.hours_spent || 0), 0)
  const monthHours = monthEntries.reduce((sum, e) => sum + (e.hours_spent || 0), 0)

  const recentEntries = entries.slice(0, 5)

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-ink">Dashboard</h1>
          <p className="text-sm text-slate-soft mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => navigate('/app/journal/new')}
          className="flex items-center justify-center gap-2 bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus size={16} />
          New entry
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard icon={Flame} label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} accent />
        <StatCard icon={BookOpen} label="Total entries" value={entries.length} />
        <StatCard icon={Clock} label="This week" value={`${weekHours.toFixed(1)}h`} sub={`${weekEntries.length} entries`} />
        <StatCard icon={Target} label="This month" value={`${monthHours.toFixed(1)}h`} sub={`${monthEntries.length} entries`} />
      </div>

      <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
        {/* Recent entries */}
        <div className="md:col-span-2 bg-paper-warm border border-paper-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-ink">Recent entries</h2>
            <button onClick={() => navigate('/app/journal')} className="text-xs text-rust flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentEntries.length === 0 ? (
            <EmptyState onAction={() => navigate('/app/journal/new')} />
          ) : (
            <div className="space-y-1">
              {recentEntries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/app/journal/${e.id}`)}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-paper transition-colors"
                >
                  <div>
                    <p className="text-sm text-slate-ink">{e.title}</p>
                    <p className="text-xs text-slate-soft">{fmtDate(e.entry_date)}</p>
                  </div>
                  {e.hours_spent ? <span className="text-xs text-slate-soft">{e.hours_spent}h</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active goals */}
        <div className="bg-paper-warm border border-paper-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-ink">Active goals</h2>
            <button onClick={() => navigate('/app/goals')} className="text-xs text-rust flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-slate-soft">No active goals yet. <button onClick={() => navigate('/app/goals')} className="text-rust hover:underline">Create one</button>.</p>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-ink truncate">{g.title}</p>
                    <span className="text-xs text-slate-soft">{g.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-paper-line rounded-full overflow-hidden">
                    <div className="h-full bg-rust" style={{ width: `${g.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-paper-warm border border-paper-line rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent ? 'text-rust' : 'text-slate-soft'} />
        <p className="text-xs text-slate-soft">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-semibold text-slate-ink">{value}</p>
      {sub && <p className="text-xs text-slate-soft mt-0.5">{sub}</p>}
    </div>
  )
}

function EmptyState({ onAction }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-slate-soft mb-3">No entries yet. Start logging your learning today.</p>
      <button onClick={onAction} className="text-sm text-rust hover:underline">
        Create your first entry
      </button>
    </div>
  )
}
