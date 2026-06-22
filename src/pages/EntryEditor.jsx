import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TagPicker from '../components/TagPicker'
import CodeSnippetEditor from '../components/CodeSnippetEditor'
import FileUploader from '../components/FileUploader'
import { format } from 'date-fns'
import { Save, Trash2, Loader2 } from 'lucide-react'

export default function EntryEditor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [hoursSpent, setHoursSpent] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [tagIds, setTagIds] = useState([])
  const [allTags, setAllTags] = useState([])
  const [snippets, setSnippets] = useState([])
  const [files, setFiles] = useState([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data: tagsData } = await supabase.from('tags').select('*').eq('user_id', user.id).order('name')
      setAllTags(tagsData || [])

      if (!isNew) {
        const [{ data: entry }, { data: snippetsData }, { data: filesData }] = await Promise.all([
          supabase.from('entries').select('*').eq('id', id).single(),
          supabase.from('code_snippets').select('*').eq('entry_id', id),
          supabase.from('entry_files').select('*').eq('entry_id', id),
        ])
        if (entry) {
          setEntryDate(entry.entry_date)
          setTitle(entry.title)
          setNotes(entry.notes || '')
          setHoursSpent(entry.hours_spent || '')
          setDifficulty(entry.difficulty || 3)
          setTagIds(entry.tag_ids || [])
        }
        setSnippets((snippetsData || []).map((s) => ({ id: s.id, language: s.language, code: s.code, description: s.description || '' })))
        setFiles((filesData || []).map((f) => ({ id: f.id, file_path: f.file_path, file_name: f.file_name, file_type: f.file_type, caption: f.caption || '' })))
      }
      setLoading(false)
    }
    load()
  }, [user, id, isNew])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      title: title.trim(),
      notes,
      hours_spent: hoursSpent ? parseFloat(hoursSpent) : 0,
      difficulty,
      tag_ids: tagIds,
    }

    let entryId = id
    if (isNew) {
      const { data, error } = await supabase.from('entries').insert(payload).select().single()
      if (error) { setSaving(false); return }
      entryId = data.id
    } else {
      const { error } = await supabase.from('entries').update(payload).eq('id', entryId)
      if (error) { setSaving(false); return }
    }

    const existingIds = snippets.filter((s) => s.id).map((s) => s.id)
    await supabase.from('code_snippets').delete().eq('entry_id', entryId).not('id', 'in', `(${existingIds.length ? existingIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    for (const s of snippets) {
      if (!s.code.trim()) continue
      if (s.id) {
        await supabase.from('code_snippets').update({ language: s.language, code: s.code, description: s.description }).eq('id', s.id)
      } else {
        await supabase.from('code_snippets').insert({ entry_id: entryId, user_id: user.id, language: s.language, code: s.code, description: s.description })
      }
    }

    for (const f of files) {
      if (f.id) {
        await supabase.from('entry_files').update({ caption: f.caption }).eq('id', f.id)
      } else {
        await supabase.from('entry_files').insert({ entry_id: entryId, user_id: user.id, file_path: f.file_path, file_name: f.file_name, file_type: f.file_type, caption: f.caption })
      }
    }

    setSaving(false)
    navigate(`/app/journal/${entryId}`)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this entry permanently?')) return
    if (files.length) await supabase.storage.from('journal-files').remove(files.map((f) => f.file_path))
    await supabase.from('entries').delete().eq('id', id)
    navigate('/app/journal')
  }

  if (loading) return <div className="p-5 sm:p-8 text-slate-soft text-sm">Loading...</div>

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-2">
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-slate-ink">{isNew ? 'New entry' : 'Edit entry'}</h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-600/10 rounded-lg px-3 py-2 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-ink hover:bg-rust text-paper text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-soft mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SQL Injection basics with DVWA"
              className="w-full bg-paper-warm border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-soft mb-1.5">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-paper-warm border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-soft mb-1.5">Hours spent</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              placeholder="2"
              className="w-full bg-paper-warm border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink focus:outline-none focus:border-rust"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-soft mb-1.5">Difficulty</label>
            <div className="flex items-center gap-1.5 h-[38px]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDifficulty(n)}
                  className={`w-8 h-8 rounded-lg text-xs border transition-colors ${
                    difficulty === n ? 'bg-rust/10 border-rust/40 text-rust' : 'border-paper-line text-slate-soft hover:text-slate-ink'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-soft mb-1.5">Tags</label>
          <TagPicker allTags={allTags} selectedIds={tagIds} onChange={setTagIds} userId={user.id} onTagCreated={(t) => setAllTags([...allTags, t])} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-soft mb-1.5">Notes (markdown supported)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you learn today? Concepts, links, key takeaways..."
            rows={8}
            className="w-full bg-paper-warm border border-paper-line rounded-lg px-3 py-2 text-sm text-slate-ink font-mono focus:outline-none focus:border-rust resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-soft mb-1.5">Code / commands</label>
          <CodeSnippetEditor snippets={snippets} onChange={setSnippets} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-soft mb-1.5">Screenshots / proof</label>
          <FileUploader userId={user.id} entryId={id} files={files} onChange={setFiles} />
        </div>
      </div>
    </div>
  )
}
