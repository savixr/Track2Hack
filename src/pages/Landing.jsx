import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import FloatingClock from '../components/three/FloatingClock'
import { Menu, X, Flame, Clock, Tag } from 'lucide-react'

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="bg-paper text-slate-ink font-mono min-h-screen">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between py-6 sm:py-7 border-b border-paper-line relative">
          <Logo />
          <div className="hidden md:flex gap-9 text-[13px] text-slate-soft">
            <a href="#why" className="hover:text-rust transition-colors">Why a logbook</a>
            <a href="#features" className="hover:text-rust transition-colors">Features</a>
            <a href="#proof" className="hover:text-rust transition-colors">Proof of work</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-[13px] font-semibold px-5 py-2.5 border-[1.5px] border-slate-ink rounded-full hover:bg-slate-ink hover:text-paper transition-colors">
              Sign in
            </Link>
            <ThemeToggle />
          </div>
          <button className="md:hidden text-slate-ink" onClick={() => setNavOpen(true)}>
            <Menu size={22} />
          </button>

          {navOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-paper flex flex-col px-6 py-6">
              <div className="flex items-center justify-between mb-10">
                <Logo />
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <button onClick={() => setNavOpen(false)} className="text-slate-ink">
                    <X size={22} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-6 text-base">
                <a href="#why" onClick={() => setNavOpen(false)}>Why a logbook</a>
                <a href="#features" onClick={() => setNavOpen(false)}>Features</a>
                <a href="#proof" onClick={() => setNavOpen(false)}>Proof of work</a>
                <Link to="/login" onClick={() => setNavOpen(false)} className="mt-4 text-center bg-slate-ink text-paper rounded-lg py-3 font-semibold">
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Hero */}
        <section className="pt-16 sm:pt-[90px]">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
            <div>
              <div className="text-xs tracking-[0.18em] uppercase text-rust font-semibold mb-6 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rust inline-block" />
                Day 1 of however long it takes
              </div>
              <h1 className="font-serif font-semibold leading-[1.04] tracking-tight mb-7 text-[clamp(32px,7vw,78px)] max-w-[900px]">
                Every exploit you understand started as <em className="italic font-normal text-rust">a note you almost didn't write down.</em>
              </h1>
              <p className="text-base leading-relaxed text-slate-soft max-w-[540px] mb-10">
                A private daily logbook for your path into cyber security — notes, commands, screenshots and proof,
                organized into a record you can track, search, and eventually show off.
              </p>
              <div className="flex items-center gap-6 flex-wrap mb-0">
                <Link to="/login" className="bg-slate-ink text-paper text-sm font-semibold px-8 py-4 rounded inline-flex items-center gap-2.5 border-[1.5px] border-slate-ink hover:bg-rust hover:border-rust hover:-translate-y-0.5 transition-all">
                  Start today's entry →
                </Link>
                <a href="#features" className="text-[13px] font-semibold text-slate-soft border-b-[1.5px] border-paper-line pb-1 hover:text-slate-ink hover:border-slate-ink transition-colors">
                  See what's inside
                </a>
              </div>
            </div>

            {/* Snapshot card — desktop only, shows what the habit looks like at a glance */}
            <div className="hidden lg:block">
              <SnapshotCard />
            </div>
          </div>

          {/* Logbook strip */}
          <div className="flex gap-4.5 overflow-x-auto pb-4 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-[50px] sm:pt-[70px] [scrollbar-width:none]">
            <LogCard date="Jun 09 — Day 142" title="SQL injection on DVWA, low security" tags={['#web', '#sqli']} hours="2.5 hrs" extra="3 screenshots" rotate="-rotate-[1.2deg]" />
            <LogCard date="Jun 08 — Day 141" title="Nmap scan types — SYN vs connect" tags={['#networking', '#recon']} hours="1.5 hrs" extra="1 snippet" rotate="rotate-[0.8deg]" />
            <LogCard date="Jun 07 — Day 140" title="TryHackMe: Linux privilege escalation" tags={['#linux', '#privesc']} hours="3 hrs" extra="4 screenshots" rotate="-rotate-[0.6deg]" />
            <LogCard date="Jun 06 — Day 139" title="Burp Suite intercept & repeater basics" tags={['#burpsuite', '#web']} hours="2 hrs" extra="2 snippets" rotate="rotate-[1.1deg]" />
            <LogCard date="Jun 05 — Day 138" title="Setting up a Kali VM & first nmap scan" tags={['#setup', '#kali']} hours="1 hr" extra="2 screenshots" rotate="-rotate-[0.4deg]" />
          </div>
        </section>

        {/* Why a logbook */}
        <section id="why" className="pt-[50px] sm:pt-[70px] pb-16 sm:pb-[100px] border-b border-paper-line">
          <div className="text-xs tracking-[0.18em] uppercase text-rust font-semibold mb-5">Why keep a logbook</div>
          <h2 className="font-serif font-semibold leading-tight max-w-[720px] mb-10 sm:mb-[60px] text-[clamp(26px,4.5vw,46px)]">
            Hacking is mostly remembering what you tried, what failed, and why it finally worked.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-paper-line border border-paper-line">
            <WhyCard num="01 — Memory" title="Your past self is your best reference">
              Six months from now you'll forget the exact flag, the exact payload, the exact command. A dated entry brings it all back in seconds.
            </WhyCard>
            <WhyCard num="02 — Momentum" title="Streaks make the habit visible">
              A short entry every day beats a long one once a week. Seeing the streak grow is what keeps you opening the laptop on the hard days.
            </WhyCard>
            <WhyCard num="03 — Evidence" title="Proof you can point to later">
              Screenshots, commands, and write-ups stack into a portfolio. When someone asks "what have you been doing," you have an answer with receipts.
            </WhyCard>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pt-[50px] sm:pt-[70px] pb-16 sm:pb-[100px] border-b border-paper-line">
          <div className="text-xs tracking-[0.18em] uppercase text-rust font-semibold mb-5">What's inside</div>
          <h2 className="font-serif font-semibold leading-tight max-w-[720px] mb-10 sm:mb-[60px] text-[clamp(26px,4.5vw,46px)]">
            Built around one entry per day — everything else is built around that.
          </h2>
          <div className="flex flex-col">
            <FeatureRow tag="Entries" title="Notes, code, and screenshots together">
              Write what you learned in markdown, paste the commands you ran with syntax highlighting, and drag in screenshots as proof — all in one entry, tagged by topic.
            </FeatureRow>
            <FeatureRow tag="Goals" title="Weekly and monthly targets">
              Set a goal for the week — finish a TryHackMe room, complete a module — and track progress with a simple slider. Mark it done or move on.
            </FeatureRow>
            <FeatureRow tag="Stats" title="Daily, weekly & monthly tracking" last>
              See your current streak, hours logged today, this week, and this month, and which topics you've spent the most time on.
            </FeatureRow>
          </div>
        </section>

        {/* Proof of work — intentionally a fixed dark "ink stamp" panel,
            doesn't invert with theme so contrast stays correct either way */}
        <section id="proof" className="pt-[50px] sm:pt-[70px] pb-16 sm:pb-[100px] -mx-5 sm:-mx-8 px-5 sm:px-8 bg-[#1C1F26] text-[#F7F4ED] border-b border-paper-line">
          <div className="text-xs tracking-[0.18em] uppercase text-[#E07A4A] font-semibold mb-5">Proof of work</div>
          <h2 className="font-serif font-semibold leading-tight max-w-[720px] mb-10 sm:mb-[60px] text-[clamp(26px,4.5vw,46px)] text-[#F7F4ED]">
            Small entries, every day, add up to something you can show.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-9">
            <ProofStat num="142" label="days logged so far this year" />
            <ProofStat num="7.5" label="hours of practice last week" />
            <ProofStat num="38" label="topics tracked & tagged" />
            <ProofStat num="216" label="screenshots saved as proof" />
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="py-20 sm:py-[110px] text-center px-5 sm:px-8">
        <h2 className="font-serif font-semibold leading-[1.1] max-w-[700px] mx-auto mb-7 text-[clamp(28px,6vw,58px)]">
          Your next entry starts <em className="italic font-normal text-rust">the moment you sign in.</em>
        </h2>
        <p className="text-[15px] text-slate-soft mb-10">Free, private, and yours — no one sees it unless you choose to share it.</p>
        <Link to="/login" className="bg-slate-ink text-paper text-sm font-semibold px-8 py-4 rounded inline-flex items-center gap-2.5 border-[1.5px] border-slate-ink hover:bg-rust hover:border-rust hover:-translate-y-0.5 transition-all">
          Create your logbook →
        </Link>
      </div>

      {/* Footer */}
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <footer className="py-10 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-soft">
          <span>Track2Hack — a personal cyber security learning journal</span>
          <span>Day one is today.</span>
        </footer>
      </div>

      <FloatingClock hideUntilScroll={700} />
    </div>
  )
}

function SnapshotCard() {
  return (
    <div className="w-full bg-paper-warm border border-paper-line rounded-xl p-5 rotate-[1.2deg] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-slate-soft tracking-wide">Day 142 · today</span>
        <span className="text-[9px] font-bold tracking-[0.12em] text-moss border border-moss px-1.5 py-0.5 rounded uppercase whitespace-nowrap">Logged</span>
      </div>
      <div className="flex items-center gap-2.5 mb-4">
        <Flame size={18} className="text-rust" />
        <div>
          <div className="font-serif text-lg font-semibold leading-none text-slate-ink">12-day streak</div>
          <div className="text-[11px] text-slate-soft mt-1">longest: 31 days</div>
        </div>
      </div>
      <div className="border-t border-dashed border-paper-line pt-4 space-y-2.5">
        <div className="flex items-center gap-2 text-[12px] text-slate-soft">
          <Clock size={13} className="text-slate-soft shrink-0" />
          <span>2.5 hrs logged today</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-soft">
          <Tag size={13} className="text-slate-soft shrink-0" />
          <span>#web, #sqli this week</span>
        </div>
      </div>
    </div>
  )
}

function LogCard({ date, title, tags, hours, extra, rotate }) {
  return (
    <div className={`flex-none w-[230px] sm:w-[260px] bg-paper-warm border border-paper-line rounded-md p-4 sm:p-5 ${rotate}`}>
      <div className="flex justify-between items-start mb-3.5">
        <span className="text-[11px] text-slate-soft tracking-wide">{date}</span>
        <span className="text-[9px] font-bold tracking-[0.12em] text-moss border border-moss px-1.5 py-0.5 rounded uppercase -rotate-6 whitespace-nowrap">Proof attached</span>
      </div>
      <div className="font-serif text-[17px] font-semibold mb-2.5 leading-snug">{title}</div>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {tags.map((t) => (
          <span key={t} className="text-[10px] text-rust bg-rust-soft px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
      <div className="text-[11px] text-slate-soft border-t border-dashed border-paper-line pt-3 flex justify-between">
        <span>{hours}</span>
        <span>{extra}</span>
      </div>
    </div>
  )
}

function WhyCard({ num, title, children }) {
  return (
    <div className="bg-paper p-7 sm:p-9 px-6 sm:px-8">
      <div className="text-xs text-slate-soft mb-10 sm:mb-[60px] tracking-wide">{num}</div>
      <h3 className="font-serif text-[21px] font-semibold mb-3">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-slate-soft">{children}</p>
    </div>
  )
}

function FeatureRow({ tag, title, children, last }) {
  return (
    <div className={`grid md:grid-cols-[100px_1fr_1fr] gap-4 md:gap-10 py-7 sm:py-9 border-t border-paper-line items-center ${last ? 'border-b' : ''}`}>
      <span className="text-[11px] text-rust font-bold tracking-[0.08em] uppercase">{tag}</span>
      <h3 className="font-serif text-xl sm:text-2xl font-semibold">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-slate-soft">{children}</p>
    </div>
  )
}

function ProofStat({ num, label }) {
  return (
    <div>
      <div className="font-serif text-[clamp(32px,5vw,56px)] font-semibold text-[#E8C9B8] leading-none mb-3">{num}</div>
      <div className="text-xs text-[#B8C0CC] tracking-wide leading-relaxed">{label}</div>
    </div>
  )
}
