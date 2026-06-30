/**
 * FileUploader — supports images + documents
 *
 * Allowed:  PDF, PPTX, XLSX/XLS, DOC/DOCX, ZIP, PNG, JPG/JPEG, SVG, GIF, WEBP
 * Rejected: anything else (shown as an inline error)
 *
 * Security:
 *  - Client-side MIME + extension whitelist (belt)
 *  - File size cap: 25 MB per file (Supabase free-tier safe)
 *  - Path includes userId so storage RLS still applies
 *  - Signed URLs expire after 1 hour
 */
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, X, Loader2, FileText, Image as ImageIcon, Maximize2, File } from 'lucide-react'
import ImageLightbox from './ImageLightbox'

// ── allowed types ─────────────────────────────────────────────────────────
const ALLOWED = {
  // images
  'image/png':  { ext: ['png'],        label: 'Image',    group: 'image' },
  'image/jpeg': { ext: ['jpg','jpeg'], label: 'Image',    group: 'image' },
  'image/gif':  { ext: ['gif'],        label: 'Image',    group: 'image' },
  'image/webp': { ext: ['webp'],       label: 'Image',    group: 'image' },
  'image/svg+xml': { ext: ['svg'],     label: 'SVG',      group: 'image' },
  // documents
  'application/pdf': { ext: ['pdf'],   label: 'PDF',      group: 'doc' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    { ext: ['pptx'], label: 'PPTX', group: 'doc' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    { ext: ['xlsx'], label: 'XLSX', group: 'doc' },
  'application/vnd.ms-excel':
    { ext: ['xls'],  label: 'XLS',  group: 'doc' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    { ext: ['docx'], label: 'DOCX', group: 'doc' },
  'application/msword':
    { ext: ['doc'],  label: 'DOC',  group: 'doc' },
  'application/zip':         { ext: ['zip'], label: 'ZIP', group: 'doc' },
  'application/x-zip-compressed': { ext: ['zip'], label: 'ZIP', group: 'doc' },
  'application/octet-stream': { ext: ['zip','pdf'], label: 'File', group: 'doc' }, // fallback
}

const ALLOWED_EXTS = new Set(
  Object.values(ALLOWED).flatMap(v => v.ext)
)

const MAX_SIZE_MB = 25

function isAllowed(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTS.has(ext)) return false
  // also check MIME if browser supplies it
  if (file.type && !ALLOWED[file.type]) {
    // some zips arrive as application/octet-stream — allow by extension
    if (!['zip','pdf'].includes(ext)) return false
  }
  return true
}

function fileIcon(fileType) {
  if (!fileType) return File
  if (fileType.startsWith('image/')) return ImageIcon
  return FileText
}

function fileLabel(fileName) {
  const ext = fileName.split('.').pop().toUpperCase()
  return ext
}

// ── component ─────────────────────────────────────────────────────────────
export default function FileUploader({ userId, entryId, files, onChange }) {
  const inputRef   = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [errors,    setErrors]    = useState([])
  const [previews,  setPreviews]  = useState({})
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const handleFiles = async (fileList) => {
    setErrors([])
    setUploading(true)
    const newFiles = []
    const errs     = []

    for (const file of fileList) {
      // validation
      if (!isAllowed(file)) {
        errs.push(`"${file.name}" — unsupported type. Allowed: PDF, PPTX, XLSX/XLS, DOC/DOCX, ZIP, images.`)
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errs.push(`"${file.name}" exceeds ${MAX_SIZE_MB} MB limit.`)
        continue
      }

      const ext  = file.name.split('.').pop().toLowerCase()
      const path = `${userId}/${entryId || 'temp'}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

      const { error } = await supabase.storage.from('journal-files').upload(path, file)
      if (error) {
        errs.push(`"${file.name}" — upload failed: ${error.message}`)
        continue
      }

      newFiles.push({ file_path: path, file_name: file.name, file_type: file.type || `application/${ext}`, caption: '' })

      // pre-fetch signed URL for images
      if (file.type.startsWith('image/')) {
        const { data: signed } = await supabase.storage.from('journal-files').createSignedUrl(path, 3600)
        if (signed) setPreviews(p => ({ ...p, [path]: signed.signedUrl }))
      }
    }

    if (errs.length) setErrors(errs)
    onChange([...files, ...newFiles])
    setUploading(false)
  }

  const removeFile = async (path) => {
    await supabase.storage.from('journal-files').remove([path])
    onChange(files.filter(f => f.file_path !== path))
    setPreviews(p => { const n = {...p}; delete n[path]; return n })
  }

  const updateCaption = (path, caption) => {
    onChange(files.map(f => f.file_path === path ? {...f, caption} : f))
  }

  // lazy-load signed URLs for image files that already exist in DB
  const ensurePreview = async (file) => {
    if (previews[file.file_path]) return
    if (!file.file_type?.startsWith('image/') && !file.file_name?.match(/\.(png|jpe?g|gif|webp|svg)$/i)) return
    const { data } = await supabase.storage.from('journal-files').createSignedUrl(file.file_path, 3600)
    if (data) setPreviews(p => ({ ...p, [file.file_path]: data.signedUrl }))
  }
  files.forEach(f => ensurePreview(f))

  const isImage = (f) =>
    f.file_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.file_name)

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-paper-line rounded-lg p-6 text-center cursor-pointer hover:border-slate-soft/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.pptx,.xlsx,.xls,.doc,.docx,.zip,.png,.jpg,.jpeg,.gif,.webp,.svg"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />
        {uploading ? (
          <Loader2 size={20} className="mx-auto text-slate-soft animate-spin" />
        ) : (
          <>
            <Upload size={20} className="mx-auto text-slate-soft mb-2" />
            <p className="text-sm text-slate-soft">Drop files here or click to upload</p>
            <p className="text-xs text-slate-soft/60 mt-1">PDF · PPTX · XLSX/XLS · DOC/DOCX · ZIP · PNG · JPG · JPEG · SVG · max {MAX_SIZE_MB} MB</p>
          </>
        )}
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">{e}</p>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {files.map((f) => {
            const img = isImage(f)
            const Icon = fileIcon(f.file_type)
            return (
              <div key={f.file_path} className="bg-paper border border-paper-line rounded-lg overflow-hidden">
                {img && previews[f.file_path] ? (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(previews[f.file_path])}
                    className="relative w-full h-32 group block"
                  >
                    <img src={previews[f.file_path]} alt={f.file_name} className="w-full h-32 object-cover" />
                    <span className="absolute inset-0 bg-slate-ink/0 group-hover:bg-slate-ink/30 flex items-center justify-center transition-colors">
                      <Maximize2 size={16} className="text-paper opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-24 flex flex-col items-center justify-center text-slate-soft gap-1">
                    <Icon size={22} />
                    <span className="text-xs font-mono">{fileLabel(f.file_name)}</span>
                  </div>
                )}
                <div className="p-2 flex items-center gap-2">
                  <input
                    value={f.caption || ''}
                    onChange={(e) => updateCaption(f.file_path, e.target.value)}
                    placeholder={img ? 'Caption (optional)' : f.file_name}
                    className="flex-1 bg-paper-warm border border-paper-line rounded text-xs text-slate-ink px-2 py-1 focus:outline-none focus:border-rust truncate"
                  />
                  <button type="button" onClick={() => removeFile(f.file_path)} className="text-slate-soft hover:text-red-600 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  )
}
