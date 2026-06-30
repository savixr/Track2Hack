import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getLocalUserId } from '../lib/supabase'
import { fmtDate } from '../lib/dateHelpers'
import { Plus, Search, Image as ImageIcon, Code2 } from 'lucide-react'

export default function Journal() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [allTags, setAllTags] = useState([])
  const [activeTag, setActiveTag] = useState(null)

  useEffect(() => {
    const localUserId = getLocalUserId()
    const load = async () => {
      const [{ data: entriesData }, { data: tagsData }, { data: filesData }, { data: snippetsData }] = await Promise.all([
        supabase.from('entries').select('*').eq('user_id', localUserId).order('entry_date', { ascending: false }),
        supabase.from('tags').select('*').eq('user_id', localUserId),
        supabase.from('entry_files').select('entry_id').eq('user_id', localUserId),
        supabase.from('code_snippets').select('entry_id').eq('user_id', localUserId),
      ])
      setAllTags(tagsData || [])

      const fileEntryIds = new Set((filesData || []).map((f) => f.entry_id))
      const codeEntryIds = new Set((snippetsData || []).map((s) => s.entry_id))
      setEntries(
        (entriesData || []).map((e) => ({
          ...e,
          hasFiles: fileEntryIds.has(e.id),
          hasCode: codeEntryIds.has(e.id),
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  const tagMap = Object.fromEntries(allTags.map((t) => [t.id, t]))

  // All the text a single entry should be searchable by: title, notes, its
  // tag/topic names, and several spellings of its date (exact date, day of
  // week, month name) so "Monday", "June", "17/06" or "#sqli" all work from
  // the one search box.
  const searchableText = (e) => {
    const tagNames = (e.tag_ids || []).map((tid) => tagMap[tid]?.name).filter(Boolean)
    let dateVariants
    try {
      dateVariants = [
        e.entry_date,
        fmtDate(e.entry_date, 'dd/MM/yyyy'),
        fmtDate(e.entry_date, 'MM/dd/yyyy'),
        fmtDate(e.entry_date, 'MMM d, yyyy'),
        fmtDate(e.entry_date, 'MMMM d, yyyy'),
        fmtDate(e.entry_date, 'EEEE'), // e.g. Monday
        fmtDate(e.entry_date, 'EEE'), // e.g. Mon
        fmtDate(e.entry_date, 'MMMM'), // e.g. June
        fmtDate(e.entry_date, 'MMM'), // e.g. Jun
      ]
    } catch {
      dateVariants = [e.entry_date]
    }
    return [e.title, e.notes || '', ...tagNames, ...dateVariants].join(' ').toLowerCase()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      const matchesSearch = !q || searchableText(e).includes(q)
      const matchesTag = !activeTag || (e.tag_ids || []).includes(activeTag)
      return matchesSearch && matchesTag
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, search, activeTag, allTags])

  const grouped = filtered.reduce((acc, e) => {
    const key = e.entry_date // exact date, e.g. 2026-06-17
    acc[key] = acc[key] || []
    acc[key].push(e)
    return acc
  }, {})
  const sortedDateKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-semibold text-slate-ink">Journal</h1>
        <button
          onClick={() => navigate('/app/journal/new')}
          className="flex items-center justify-center gap-2 bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus size={16} />
          New entry
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, notes, date, day, or topic..."
            className="w-full bg-paper-warm border border-paper-line rounded-lg pl-9 pr-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              !activeTag ? 'bg-rust/10 border-rust/40 text-rust' : 'border-paper-line text-slate-soft hover:text-slate-ink'
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTag(activeTag === t.id ? null : t.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                activeTag === t.id ? 'bg-rust/10 border-rust/40 text-rust' : 'border-paper-line text-slate-soft hover:text-slate-ink'
              }`}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-soft">Loading...</p>
      ) : sortedDateKeys.length === 0 ? (
        entries.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-paper-line rounded-xl">
            <p className="text-sm text-slate-soft mb-3">No entries found.</p>
            <button onClick={() => navigate('/app/journal/new')} className="text-sm text-rust hover:underline">
              Create your first entry
            </button>
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-paper-line rounded-xl">
            <p className="text-sm text-slate-soft mb-3">
              No entries match "{search}"{activeTag ? ' for this topic' : ''}.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveTag(null) }}
              className="text-sm text-rust hover:underline"
            >
              Clear search
            </button>
          </div>
        )
      ) : (
        <div className="space-y-7">
          {sortedDateKeys.map((dateKey) => {
            const items = grouped[dateKey]
            const dayHours = items.reduce((sum, e) => sum + (e.hours_spent || 0), 0)
            return (
              <div key={dateKey}>
                {/* Date separator — each calendar day is its own distinct block */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-serif text-base font-semibold text-slate-ink shrink-0">
                    {fmtDate(dateKey, 'dd/MM/yyyy')}
                  </span>
                  <span className="text-xs text-slate-soft shrink-0">{fmtDate(dateKey, 'EEEE')}</span>
                  <span className="h-px flex-1 bg-paper-line" />
                  {dayHours > 0 && <span className="text-xs text-slate-soft shrink-0">{dayHours}h logged</span>}
                </div>

                <div className="space-y-1 border-l-2 border-paper-line pl-4">
                  {items.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/app/journal/${e.id}`)}
                      className="w-full text-left bg-paper-warm border border-paper-line rounded-lg px-4 py-3 hover:border-slate-soft/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-sm font-medium text-slate-ink truncate">{e.title}</p>
                        {e.hours_spent > 0 && <span className="text-xs text-slate-soft shrink-0">{e.hours_spent}h</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-soft flex-wrap">
                        {e.hasFiles && <span className="flex items-center gap-1"><ImageIcon size={12} /> screenshots</span>}
                        {e.hasCode && <span className="flex items-center gap-1"><Code2 size={12} /> code</span>}
                        {(e.tag_ids || []).slice(0, 3).map((tid) => tagMap[tid] && (
                          <span key={tid} className="text-rust">#{tagMap[tid].name}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
