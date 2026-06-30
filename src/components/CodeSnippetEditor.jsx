import { Trash2 } from 'lucide-react'

const LANGUAGES = ['bash', 'python', 'javascript', 'sql', 'php', 'powershell', 'c', 'plaintext', 'yaml', 'json', 'html']

export default function CodeSnippetEditor({ snippets, onChange }) {
  const update = (idx, field, value) => {
    const next = [...snippets]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  const remove = (idx) => {
    onChange(snippets.filter((_, i) => i !== idx))
  }

  const add = () => {
    onChange([...snippets, { language: 'bash', code: '', description: '' }])
  }

  return (
    <div className="space-y-3">
      {snippets.map((s, idx) => (
        <div key={idx} className="bg-paper border border-paper-line rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <select
              value={s.language}
              onChange={(e) => update(idx, 'language', e.target.value)}
              className="bg-paper-warm border border-paper-line rounded text-xs text-slate-ink px-2 py-1 focus:outline-none focus:border-rust"
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button type="button" onClick={() => remove(idx)} className="text-slate-soft hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
          <input
            value={s.description}
            onChange={(e) => update(idx, 'description', e.target.value)}
            placeholder="What does this code do? (optional)"
            className="w-full bg-paper-warm border border-paper-line rounded text-xs text-slate-ink px-2 py-1.5 mb-2 focus:outline-none focus:border-rust"
          />
          <textarea
            value={s.code}
            onChange={(e) => update(idx, 'code', e.target.value)}
            placeholder="Paste your code or commands here..."
            rows={4}
            className="w-full bg-slate-ink text-paper border border-paper-line rounded text-xs font-mono px-2 py-2 focus:outline-none focus:border-rust resize-y"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs text-rust hover:underline"
      >
        + Add code snippet
      </button>
    </div>
  )
}
