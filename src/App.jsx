import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import { Button } from './components/Primitives.jsx'
import { useWorkspace } from './context/WorkspaceContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tasks from './pages/Tasks.jsx'
import Calendar from './pages/Calendar.jsx'
import Routines from './pages/Routines.jsx'
import Notes from './pages/Notes.jsx'
import Goals from './pages/Goals.jsx'
import Settings from './pages/Settings.jsx'
import { formatLongDate, todayISO } from './utils/dates.js'

const pages = {
  dashboard: { title: 'Beranda', eyebrow: 'RUANG HARIAN' },
  tasks: { title: 'Tugas', eyebrow: 'DAFTAR KERJA' },
  calendar: { title: 'Kalender', eyebrow: 'WAKTU DAN RENCANA' },
  routines: { title: 'Rutinitas', eyebrow: 'KEBIASAAN HARIAN' },
  notes: { title: 'Catatan', eyebrow: 'RUANG PIKIRAN' },
  goals: { title: 'Target mingguan', eyebrow: 'ARAH MINGGU INI' },
  progress: { title: 'Progres', eyebrow: 'CATATAN PERKEMBANGAN' },
  settings: { title: 'Pengaturan', eyebrow: 'SESUAIKAN DAYFLOW' },
}
const Progress = lazy(() => import('./pages/Progress.jsx'))

export default function App() {
  const [active, setActive] = useState('dashboard')
  const { ready, settings, setSettings, storageError, toast, tasks, schedules, notify } = useWorkspace()
  const notifiedRef = useRef(new Set())
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme === 'dark' ? 'dark' : 'light'
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.content = settings.theme === 'dark' ? '#272D2F' : '#F6F7EB'
  }, [settings.theme])

  useEffect(() => {
    if (!settings.remindersEnabled || !('Notification' in window) || Notification.permission !== 'granted') return undefined
    const checkReminders = () => {
      const now = Date.now()
      const records = [...tasks.map(item => ({ ...item, kind: 'tugas' })), ...schedules.map(item => ({ ...item, kind: 'jadwal' }))]
      for (const record of records) {
        if (!record.reminder || (record.kind === 'tugas' && record.status === 'Completed') || notifiedRef.current.has(`${record.id}:${record.reminder}`)) continue
        const reminderAt = new Date(record.reminder).getTime()
        if (reminderAt <= now && now - reminderAt < 60_000) {
          notifiedRef.current.add(`${record.id}:${record.reminder}`)
          try {
            new Notification(`Pengingat ${record.kind} DayFlow`, { body: record.title })
          } catch {
            notify('Browser tidak dapat menampilkan pengingat ini.', 'error')
          }
        }
      }
    }
    checkReminders()
    const timer = window.setInterval(checkReminders, 15_000)
    return () => window.clearInterval(timer)
  }, [settings.remindersEnabled, tasks, schedules, notify])

  if (!ready) return <main className="loading-screen flex min-h-screen items-center justify-center gap-3" aria-live="polite"><span className="dayline" aria-hidden="true" />Memuat ruang DayFlow…</main>
  const page = pages[active] ?? pages.dashboard
  const Page = {
    dashboard: Dashboard, tasks: Tasks, calendar: Calendar, routines: Routines,
    notes: Notes, goals: Goals, progress: Progress, settings: Settings,
  }[active] ?? Dashboard

  return (
    <div className="app-shell min-h-screen">
      <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
      <Sidebar active={active} onNavigate={setActive} onSettings={() => setActive('settings')} />
      <main className="main-area" id="main-content">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="topbar-date">{formatLongDate(todayISO())}</span>
            <span className="topbar-divider" aria-hidden="true" />
            <span className="topbar-section">{page.title}</span>
          </div>
          <Button variant="quiet" className="theme-toggle" aria-label={`Aktifkan mode ${settings.theme === 'dark' ? 'terang' : 'gelap'}`} onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}>
            {settings.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}<span>{settings.theme === 'dark' ? 'Terang' : 'Gelap'}</span>
          </Button>
        </header>
        {storageError && <div className="storage-alert" role="alert">{storageError}<button type="button" onClick={() => setActive('settings')}>Buka pengaturan</button></div>}
            <div className="page-container"><div key={active} className="page-transition"><Suspense fallback={<div className="loading-panel" role="status" aria-live="polite"><span className="dayline" aria-hidden="true" />Memuat ringkasan progres…</div>}><Page onNavigate={setActive} /></Suspense></div></div>
        <footer className="app-footer"><span>DayFlow</span><span>Organize Your Day. Own Your Flow.</span></footer>
      </main>
      {toast && <div key={toast.id} className={`toast toast-${toast.tone}`} role="status" aria-live="polite">{toast.message}</div>}
    </div>
  )
}
