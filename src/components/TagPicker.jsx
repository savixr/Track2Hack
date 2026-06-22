import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Plus } from 'lucide-react'

export default function TagPicker({ allTags, selectedIds, onChange, userId, onTagCreated }) {
  const [newTag, setNewTag] = useState('')
  const [adding, setAdding] = useState(false)

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const createTag = async () => {
    const name = newTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name) return
    setAdding(true)
    const { data, error } = await supabase.from('tags').insert({ user_id: userId, name }).select().single()
    setAdding(false)
    if (!error && data) {
      onTagCreated(data)
      onChange([...selectedIds, data.id])
      setNewTag('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {allTags.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
            selectedIds.includes(t.id)
              ? 'bg-rust/10 border-rust/40 text-rust'
              : 'border-paper-line text-slate-soft hover:text-slate-ink'
          }`}
        >
          #{t.name}
          {selectedIds.includes(t.id) && <X size={10} />}
        </button>
      ))}
      <div className="flex items-center gap-1">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), createTag())}
          placeholder="new tag"
          className="text-xs bg-paper border border-paper-line rounded-full px-2.5 py-1 w-20 focus:outline-none focus:border-rust text-slate-ink"
        />
        <button type="button" onClick={createTag} disabled={adding} className="text-slate-soft hover:text-rust">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
