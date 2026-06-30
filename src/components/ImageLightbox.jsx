import { useCallback, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { playClose } from '../lib/sounds'

export default function ImageLightbox({ url, caption, onClose }) {
  const handleClose = useCallback(() => {
    playClose()
    onClose()
  }, [onClose])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && handleClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-ink/85 flex items-center justify-center p-4 sm:p-8"
      onClick={handleClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-paper bg-slate-ink/60 hover:bg-slate-ink/80 border border-paper/20 rounded-lg px-3 py-2 transition-colors"
        >
          <ExternalLink size={14} /> Open in new tab
        </a>
        <button
          onClick={handleClose}
          className="text-paper bg-slate-ink/60 hover:bg-slate-ink/80 border border-paper/20 rounded-lg p-2 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt={caption || 'Screenshot'} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        {caption && <p className="text-paper text-sm mt-3 text-center">{caption}</p>}
      </div>
    </div>
  )
}
