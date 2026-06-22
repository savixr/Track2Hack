import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, subDays, eachDayOfInterval, parseISO, subWeeks, eachWeekOfInterval, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { calcStreak } from '../lib/dateHelpers'
import { playClick } from '../lib/sounds'

const COLORS = ['#C2491D', '#4F6F52', '#3D4A5C', '#E8C9B8', '#1C1F26', '#8a93a3']

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

export default function Stats() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('daily')
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: entriesData }, { data: tagsData }] = await Promise.all([
        supabase.from('entries').select('entry_date, hours_spent, tag_ids, difficulty').eq('user_id', user.id),
        supabase.from('tags').select('*').eq('user_id', user.id),
      ])
      setEntries(entriesData || [])
      setTags(tagsData || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="p-5 sm:p-8 text-slate-soft text-sm">Loading...</div>

  const streak = calcStreak(entries.map((e) => e.entry_date))
  const today = new Date()

  const totalHours = entries.reduce((sum, e) => sum + (e.hours_spent || 0), 0)
  const avgDifficulty = entries.length
    ? (entries.reduce((s, e) => s + (e.difficulty || 0), 0) / (entries.filter((e) => e.difficulty).length || 1)).toFixed(1)
    : 0

  // ---- Daily: last 14 days, hours per day ----
  const last14 = eachDayOfInterval({ start: subDays(today, 13), end: today })
  const dailyData = last14.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const dayEntries = entries.filter((e) => e.entry_date === key)
    return {
      label: format(d, 'MMM d'),
      hours: parseFloat(dayEntries.reduce((s, e) => s + (e.hours_spent || 0), 0).toFixed(1)),
      entries: dayEntries.length,
    }
  })
  const todayKey = format(today, 'yyyy-MM-dd')
  const todayEntries = entries.filter((e) => e.entry_date === todayKey)
  const todayHours = todayEntries.reduce((s, e) => s + (e.hours_spent || 0), 0)

  // ---- Weekly: last 8 weeks ----
  const weeks = eachWeekOfInterval({ start: subWeeks(today, 7), end: today }, { weekStartsOn: 1 })
  const weeklyData = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEntries = entries.filter((e) => {
      const d = parseISO(e.entry_date)
      return d >= weekStart && d <= weekEnd
    })
    return {
      label: format(weekStart, 'MMM d'),
      hours: parseFloat(weekEntries.reduce((s, e) => s + (e.hours_spent || 0), 0).toFixed(1)),
      entries: weekEntries.length,
    }
  })
  const thisWeek = weeklyData[weeklyData.length - 1]

  // ---- Monthly: last 6 months ----
  const months = eachMonthOfInterval({ start: subMonths(today, 5), end: today })
  const monthlyData = months.map((m) => {
    const mStart = startOfMonth(m)
    const mEnd = endOfMonth(m)
    const monthEntries = entries.filter((e) => {
      const d = parseISO(e.entry_date)
      return d >= mStart && d <= mEnd
    })
    return {
      label: format(m, 'MMM'),
      hours: parseFloat(monthEntries.reduce((s, e) => s + (e.hours_spent || 0), 0).toFixed(1)),
      entries: monthEntries.length,
    }
  })
  const thisMonth = monthlyData[monthlyData.length - 1]

  // tag distribution (overall)
  const tagCounts = {}
  entries.forEach((e) => {
    ;(e.tag_ids || []).forEach((tid) => {
      tagCounts[tid] = (tagCounts[tid] || 0) + 1
    })
  })
  const tagData = Object.entries(tagCounts)
    .map(([tid, count]) => ({ name: tags.find((t) => t.id === tid)?.name || 'unknown', value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const activeData = tab === 'daily' ? dailyData : tab === 'weekly' ? weeklyData : monthlyData
  const dailyInterval = isNarrow ? 3 : 1
  const xInterval = tab === 'daily' ? dailyInterval : 0
  const activeSummary =
    tab === 'daily'
      ? { hours: todayHours.toFixed(1), entries: todayEntries.length, label: 'today' }
      : tab === 'weekly'
      ? { hours: thisWeek?.hours.toFixed(1) ?? '0.0', entries: thisWeek?.entries ?? 0, label: 'this week' }
      : { hours: thisMonth?.hours.toFixed(1) ?? '0.0', entries: thisMonth?.entries ?? 0, label: 'this month' }

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold text-slate-ink mb-6">Stats</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <SummaryCard label="Total entries" value={entries.length} />
        <SummaryCard label="Total hours logged" value={totalHours.toFixed(1)} />
        <SummaryCard label="Current streak" value={`${streak} days`} />
        <SummaryCard label="Avg. difficulty" value={`${avgDifficulty}/5`} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { playClick(); setTab(t.key) }}
            className={`text-xs sm:text-sm px-3.5 py-2 rounded-full border transition-colors ${
              tab === t.key ? 'bg-rust/10 border-rust/40 text-rust font-medium' : 'border-paper-line text-slate-soft hover:text-slate-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-paper-warm border border-paper-line rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-slate-ink">
            Hours per {tab === 'daily' ? 'day (last 14 days)' : tab === 'weekly' ? 'week (last 8 weeks)' : 'month (last 6 months)'}
          </h2>
          <span className="text-xs text-slate-soft">
            {activeSummary.hours}h logged {activeSummary.label} · {activeSummary.entries} entries
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={activeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0D9C8" />
            <XAxis dataKey="label" stroke="#3D4A5C" fontSize={11} interval={xInterval} />
            <YAxis stroke="#3D4A5C" fontSize={12} />
            <Tooltip contentStyle={{ background: '#F1ECE0', border: '1px solid #E0D9C8', borderRadius: 8, fontSize: 12, color: '#1C1F26' }} />
            <Bar dataKey="hours" fill="#C2491D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-paper-warm border border-paper-line rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-ink mb-4">
            Entries per {tab === 'daily' ? 'day' : tab === 'weekly' ? 'week' : 'month'}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activeData}>
              <XAxis dataKey="label" stroke="#3D4A5C" fontSize={10} interval={xInterval} />
              <YAxis stroke="#3D4A5C" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#F1ECE0', border: '1px solid #E0D9C8', borderRadius: 8, fontSize: 12, color: '#1C1F26' }} />
              <Bar dataKey="entries" fill="#4F6F52" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-paper-warm border border-paper-line rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-ink mb-4">Top topics</h2>
          {tagData.length === 0 ? (
            <p className="text-sm text-slate-soft">Tag your entries to see a breakdown here.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tagData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                  {tagData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#F1ECE0', border: '1px solid #E0D9C8', borderRadius: 8, fontSize: 12, color: '#1C1F26' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-paper-warm border border-paper-line rounded-xl p-4">
      <p className="text-xs text-slate-soft mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-semibold text-slate-ink">{value}</p>
    </div>
  )
}
