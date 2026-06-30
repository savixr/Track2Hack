import { useEffect, useState } from 'react'
import { supabase, getLocalUserId } from '../lib/supabase'
import { fmtDate } from '../lib/dateHelpers'
import { Plus, Check, Archive, Loader2 } from 'lucide-react'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('active')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState('weekly')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const localUserId = getLocalUserId()
    const { data } = await supabase.from('goals').select('*').eq('user_id', localUserId).order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }

  const createGoal = async () => {
    if (!title.trim()) return
    setSaving(true)
    const localUserId = getLocalUserId()
    await supabase.from('goals').insert({
      user_id: localUserId,
      title: title.trim(),
      description: description.trim() || null,
      goal_type: goalType,
      target_date: targetDate || null,
    })
    setTitle(''); setDescription(''); setTargetDate(''); setGoalType('weekly')
    setShowForm(false)
    setSaving(false)
    load()
  }

  const updateProgress = async (id, progress) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, progress } : g)))
    await supabase.from('goals').update({ progress, status: progress >= 100 ? 'completed' : 'active' }).eq('id', id)
  }

  const setStatus = async (id, status) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, status } : g)))
    await supabase.from('goals').update({ status }).eq('id', id)
  }

  const filtered = goals.filter((g) => g.status === filter)

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-semibold text-slate-ink">Goals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus size={16} /> New goal
        </button>
      </div>

      {showForm && (
        <div className="bg-paper-warm border border-paper-line rounded-xl p-5 mb-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete TryHackMe Web Fundamentals path"
            className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust resize-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-paper border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-soft hover:text-slate-ink px-3 py-2">Cancel</button>
            <button onClick={createGoal} disabled={saving} className="flex items-center gap-2 bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {['active', 'completed', 'abandoned'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
              filter === s ? 'bg-rust/10 border-rust/40 text-rust' : 'border-paper-line text-slate-soft hover:text-slate-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-soft">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-soft">No {filter} goals.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <div key={g.id} className="bg-paper-warm border border-paper-line rounded-xl p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-paper-line text-slate-soft capitalize">{g.goal_type}</span>
                    {g.target_date && <span className="text-xs text-slate-soft">Due {fmtDate(g.target_date, 'MMM d')}</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-ink">{g.title}</p>
                  {g.description && <p className="text-xs text-slate-soft mt-1">{g.description}</p>}
                </div>
                {g.status === 'active' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setStatus(g.id, 'completed')} title="Mark completed" className="text-slate-soft hover:text-rust p-1">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setStatus(g.id, 'abandoned')} title="Abandon" className="text-slate-soft hover:text-red-600 p-1">
                      <Archive size={16} />
                    </button>
                  </div>
                )}
              </div>
              {g.status === 'active' && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-1.5 bg-paper-line rounded-full overflow-hidden">
                    <div className="h-full bg-rust transition-all" style={{ width: `${g.progress}%` }} />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={g.progress}
                    onChange={(e) => updateProgress(g.id, parseInt(e.target.value))}
                    className="w-20 sm:w-24 accent-rust"
                  />
                  <span className="text-xs text-slate-soft w-10 text-right">{g.progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
