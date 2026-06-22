import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { fmtDate } from '../lib/dateHelpers'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ImageLightbox from '../components/ImageLightbox'
import { Edit, ArrowLeft, Clock, Maximize2 } from 'lucide-react'

export default function EntryView() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [entry, setEntry] = useState(null)
  const [snippets, setSnippets] = useState([])
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState([])
  const [imageUrls, setImageUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: entryData }, { data: snippetsData }, { data: filesData }, { data: tagsData }] = await Promise.all([
        supabase.from('entries').select('*').eq('id', id).single(),
        supabase.from('code_snippets').select('*').eq('entry_id', id),
        supabase.from('entry_files').select('*').eq('entry_id', id),
        supabase.from('tags').select('*').eq('user_id', user.id),
      ])
      setEntry(entryData)
      setSnippets(snippetsData || [])
      setFiles(filesData || [])
      setTags(tagsData || [])

      const urls = {}
      for (const f of filesData || []) {
        const { data: signed } = await supabase.storage.from('journal-files').createSignedUrl(f.file_path, 3600)
        if (signed) urls[f.id] = signed.signedUrl
      }
      setImageUrls(urls)
      setLoading(false)
    }
    load()
  }, [user, id])

  if (loading) return <div className="p-5 sm:p-8 text-slate-soft text-sm">Loading...</div>
  if (!entry) return <div className="p-5 sm:p-8 text-slate-soft text-sm">Entry not found.</div>

  const entryTags = (entry.tag_ids || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean)

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-2">
        <button onClick={() => navigate('/app/journal')} className="flex items-center gap-2 text-sm text-slate-soft hover:text-slate-ink transition-colors">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to journal</span>
        </button>
        <button
          onClick={() => navigate(`/app/journal/${id}/edit`)}
          className="flex items-center gap-2 bg-paper-warm hover:bg-paper-line border border-paper-line text-slate-ink text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          <Edit size={16} /> Edit
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 text-xs text-slate-soft mb-2 flex-wrap">
          <span>{fmtDate(entry.entry_date)}</span>
          {entry.hours_spent > 0 && <span className="flex items-center gap-1"><Clock size={12} /> {entry.hours_spent}h</span>}
          {entry.difficulty && <span>Difficulty: {entry.difficulty}/5</span>}
        </div>
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-slate-ink mb-2">{entry.title}</h1>
        {entryTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {entryTags.map((t) => (
              <span key={t.id} className="text-xs px-2.5 py-1 rounded-full border border-paper-line text-rust">#{t.name}</span>
            ))}
          </div>
        )}
      </div>

      {entry.notes && (
        <div className="prose-invert mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.notes}</ReactMarkdown>
        </div>
      )}

      {snippets.length > 0 && (
        <div className="mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-ink">Code & commands</h2>
          {snippets.map((s) => (
            <div key={s.id}>
              {s.description && <p className="text-sm text-slate-soft mb-1">{s.description}</p>}
              <SyntaxHighlighter language={s.language} style={vscDarkPlus} customStyle={{ borderRadius: 8, fontSize: 13, margin: 0 }}>
                {s.code}
              </SyntaxHighlighter>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-ink mb-3">Screenshots / proof</h2>
          <div className="grid grid-cols-2 gap-3">
            {files.map((f) => (
              <div key={f.id} className="bg-paper-warm border border-paper-line rounded-lg overflow-hidden">
                {imageUrls[f.id] && (
                  <button
                    type="button"
                    onClick={() => setLightbox({ url: imageUrls[f.id], caption: f.caption })}
                    className="relative w-full block group"
                  >
                    <img src={imageUrls[f.id]} alt={f.file_name} className="w-full h-auto" />
                    <span className="absolute inset-0 bg-slate-ink/0 group-hover:bg-slate-ink/30 flex items-center justify-center transition-colors">
                      <Maximize2 size={18} className="text-paper opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                )}
                {f.caption && <p className="text-xs text-slate-soft p-2">{f.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {lightbox && <ImageLightbox url={lightbox.url} caption={lightbox.caption} onClose={() => setLightbox(null)} />}
    </div>
  )
}
