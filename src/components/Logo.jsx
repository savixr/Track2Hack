export default function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 text-[15px] font-semibold tracking-wide text-slate-ink ${className}`}>
      <span className="w-7 h-7 border-[1.5px] border-slate-ink rounded text-[10px] font-bold flex items-center justify-center -rotate-3 bg-paper shrink-0">
        T2H
      </span>
      Track2Hack
    </span>
  )
}
