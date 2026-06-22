import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, X, Loader2, ImageOff, Maximize2 } from 'lucide-react'
import ImageLightbox from './ImageLightbox'

export default function FileUploader({ userId, entryId, files, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState({})
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const handleFiles = async (fileList) => {
    setUploading(true)
    const newFiles = []
    for (const file of fileList) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${entryId || 'temp'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('journal-files').upload(path, file)
      if (!error) {
        newFiles.push({ file_path: path, file_name: file.name, file_type: file.type, caption: '' })
        const { data: signed } = await supabase.storage.from('journal-files').createSignedUrl(path, 3600)
        if (signed) setPreviews((p) => ({ ...p, [path]: signed.signedUrl }))
      }
    }
    onChange([...files, ...newFiles])
    setUploading(false)
  }

  const removeFile = async (path) => {
    await supabase.storage.from('journal-files').remove([path])
    onChange(files.filter((f) => f.file_path !== path))
  }

  const updateCaption = (path, caption) => {
    onChange(files.map((f) => (f.file_path === path ? { ...f, caption } : f)))
  }

  const ensurePreview = async (path) => {
    if (previews[path]) return
    const { data } = await supabase.storage.from('journal-files').createSignedUrl(path, 3600)
    if (data) setPreviews((p) => ({ ...p, [path]: data.signedUrl }))
  }

  files.forEach((f) => ensurePreview(f.file_path))

  return (
    <div>
      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)) }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-paper-line rounded-lg p-6 text-center cursor-pointer hover:border-slate-soft/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />
        {uploading ? (
          <Loader2 size={20} className="mx-auto text-slate-soft animate-spin" />
        ) : (
          <>
            <Upload size={20} className="mx-auto text-slate-soft mb-2" />
            <p className="text-sm text-slate-soft">Drop screenshots here or click to upload</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {files.map((f) => (
            <div key={f.file_path} className="bg-paper border border-paper-line rounded-lg overflow-hidden">
              {previews[f.file_path] ? (
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
                <div className="w-full h-32 flex items-center justify-center text-slate-soft">
                  <ImageOff size={20} />
                </div>
              )}
              <div className="p-2 flex items-center gap-2">
                <input
                  value={f.caption || ''}
                  onChange={(e) => updateCaption(f.file_path, e.target.value)}
                  placeholder="Caption (optional)"
                  className="flex-1 bg-paper-warm border border-paper-line rounded text-xs text-slate-ink px-2 py-1 focus:outline-none focus:border-rust"
                />
                <button type="button" onClick={() => removeFile(f.file_path)} className="text-slate-soft hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  )
}
