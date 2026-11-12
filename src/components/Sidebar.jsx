import { useEffect, useRef, useState } from 'react'
import { BarChart3, CalendarDays, CheckSquare2, CircleDot, FileText, Flag, Home, Menu, Settings, X } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext.jsx'

const navItems = [
  { id: 'dashboard', label: 'Beranda', icon: Home },
  { id: 'tasks', label: 'Tugas', icon: CheckSquare2 },
  { id: 'calendar', label: 'Kalender', icon: CalendarDays },
  { id: 'routines', label: 'Rutinitas', icon: CircleDot },
  { id: 'notes', label: 'Catatan', icon: FileText },
  { id: 'goals', label: 'Target mingguan', icon: Flag },
  { id: 'progress', label: 'Progres', icon: BarChart3 },
]
const mobilePrimaryItems = navItems.slice(0, 3)

function BrandIdentity({ compact = false }) {
  return (
    <div className={`brand-lockup${compact ? ' mobile-brand' : ''}`}>
      <img className="brand-logo" src="/assets/orbit-logo.png" width="40" height="40" alt="" />
      <span className="brand-copy">
        <span className="brand-name"><span className="brand-accent">O</span>RBIT</span>
        <span className="brand-tagline">Your Life, In Your Orbit.</span>
      </span>
    </div>
  )
}

function NavigationItem({ id, label, icon: Icon, active, onClick }) {
  return (
    <button className={`nav-item${active === id ? ' active' : ''}`} type="button" onClick={onClick} aria-current={active === id ? 'page' : undefined}>
      <span className="nav-icon"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span><span>{label}</span>
    </button>
  )
}

function Navigation({ active, onNavigate, onSettings, onClose, workspace, secondaryOnly = false }) {
  const visibleItems = secondaryOnly ? navItems.slice(3) : navItems
  return (
    <>
      <div className="brand-block">
        <BrandIdentity />
        <p className="brand-workspace">{workspace || 'Ruang pribadi'}</p>
        {onClose && <button className="icon-button mobile-close" type="button" onClick={onClose} aria-label="Tutup menu"><X size={19} /></button>}
      </div>
      <nav className="primary-nav" aria-label={secondaryOnly ? 'Navigasi lainnya' : 'Navigasi utama'}>
        <p className="nav-caption">{secondaryOnly ? 'LAINNYA' : 'MENU'}</p>
        {visibleItems.map(item => <NavigationItem key={item.id} {...item} active={active} onClick={() => { onNavigate(item.id); onClose?.() }} />)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="dayline" aria-hidden="true" /><span>Mulai dari satu hal hari ini.</span></div>
        <NavigationItem id="settings" label="Pengaturan" icon={Settings} active={active} onClick={() => { onSettings(); onClose?.() }} />
      </div>
    </>
  )
}

export default function Sidebar({ active, onNavigate, onSettings }) {
  const { profile } = useWorkspace()
  const [open, setOpen] = useState(false)
  const overlayRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const overlay = overlayRef.current
    const controls = () => [...overlay.querySelectorAll('button:not([disabled])')]
    controls()[0]?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = controls()
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [open])
  return (
    <>
      <aside className="sidebar desktop-sidebar"><Navigation active={active} onNavigate={onNavigate} onSettings={onSettings} workspace={profile.workspace} /></aside>
      <div className="mobile-nav-bar">
        <BrandIdentity compact />
        <button className="mobile-more-trigger" type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi lainnya"><Menu size={19} /><span>Lainnya</span></button>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Navigasi utama">
        {mobilePrimaryItems.map(({ id, label, icon: Icon }) => <button className={`mobile-nav-item${active === id ? ' active' : ''}`} key={id} type="button" onClick={() => onNavigate(id)} aria-current={active === id ? 'page' : undefined}><Icon size={19} strokeWidth={1.9} aria-hidden="true" /><span>{label}</span></button>)}
      </nav>
      {open && <div ref={overlayRef} className="mobile-nav-overlay" role="dialog" aria-modal="true" aria-label="Navigasi lainnya" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
        <aside className="sidebar mobile-sidebar"><Navigation active={active} onNavigate={onNavigate} onSettings={onSettings} onClose={() => setOpen(false)} workspace={profile.workspace} secondaryOnly /></aside>
      </div>}
    </>
  )
}
