# Track2Hack

A personal daily learning journal for tracking your path into cyber security — notes, code snippets, screenshots as proof, goals, and daily/weekly/monthly stats. Private by design: only you can see your data.

## Stack
- React + Vite + Tailwind CSS v4
- Supabase (Postgres database, Auth, Storage for screenshots)
- react-router-dom, recharts, react-markdown, react-syntax-highlighter
- three.js + @react-three/fiber for the interactive 3D logbook

## Features
- **Landing page** — a styled marketing/intro page at `/` describing the app, with sign-in CTA
- **3D interactive logbook** — a draggable, rotatable 3D notebook model appears as a hero piece on the landing page and as a small floating, collapsible widget across the Dashboard, Journal, Goals, and Stats pages. Click and drag to spin it; it auto-rotates gently when idle. Lazy-loaded so it doesn't affect initial page load.
- **Light / dark mode** — toggle in the sidebar (app), top nav (landing), and login screen. Persists across sessions (saved to localStorage) and falls back to system preference on first visit. Every page, chart, and the 3D scene all repaint correctly.
- **Daily entries grouped by date** — the Journal groups entries under their exact calendar date (e.g. `17/06/2026`), each rendered as its own clearly separated block with a day-of-week label and total hours logged that day — multiple entries on the same day nest underneath.
- **Code snippets** — multiple per entry, syntax highlighted, with descriptions
- **Screenshots** — drag-and-drop upload as proof, with captions; click any screenshot to view it full-size in a lightbox or open it in a new tab
- **Goals** — weekly/monthly/custom goals with progress sliders
- **Dashboard** — streak counter, weekly/monthly hours, recent entries, active goals
- **Stats** — daily / weekly / monthly tabs with hours logged, entries logged, and top topics
- **Fully responsive** — sidebar nav collapses into a mobile drawer with a hamburger menu; 3D widget hides on very small screens
- **Session handling** — signing out fully clears the Supabase session and redirects to login

## Routes
- `/` — public landing page (clicking the logo always returns here)
- `/login` — sign in / sign up
- `/app` — dashboard (requires login; clicking the logo in the app returns here)
- `/app/journal`, `/app/journal/new`, `/app/journal/:id`, `/app/journal/:id/edit`
- `/app/goals`, `/app/stats`

## Setup

### 1. Create a Supabase project
Go to supabase.com, create a new project, and note your Project URL and anon public key (Settings > API).

### 2. Run the database schema
Open the Supabase SQL Editor and run the contents of `supabase/schema.sql`. This creates all tables, row-level security policies (private to each user — no public sharing), and the storage bucket for screenshots.

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Install and run
```bash
npm install
npm run dev
```

### 5. Sign up
Open the app, sign up with your email and password. Supabase will send a confirmation email (check Auth settings if you want to disable email confirmation for personal use — Authentication > Providers > Email > toggle "Confirm email" off).

## Deploy
Push to GitHub and deploy on Vercel or Netlify:
- Build command: `npm run build`
- Output directory: `dist`
- Add the same env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's environment settings

## Usage tips
- Create tags as you go (e.g. `#networking`, `#burpsuite`, `#ctf`, `#oscp-prep`) to organize entries and see topic breakdowns in Stats.
- The streak counter on the dashboard counts consecutive days with at least one entry.
- Goals support a 0-100% progress slider; mark them completed or abandoned when done.
- Use the Daily / Weekly / Monthly tabs on the Stats page to zoom in or out on your progress.

## Project structure
```
src/
  components/
    three/        LogbookModel, LogbookScene, FloatingLogbook (3D logbook)
    Layout.jsx, Logo.jsx, ThemeToggle.jsx
    TagPicker.jsx, CodeSnippetEditor.jsx, FileUploader.jsx, ImageLightbox.jsx
  context/        AuthContext (Supabase session), ThemeContext (light/dark)
  lib/            Supabase client, date helper functions
  pages/          route-level pages (Landing, Login, Dashboard, Journal, EntryEditor, EntryView, Goals, Stats)
supabase/
  schema.sql      full database schema, RLS policies (private only), storage bucket setup
```
