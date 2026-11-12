import { ArrowUpRight, BookOpen, Briefcase, CalendarDays, Check, CircleDot, Clock3, Home, NotebookPen, Pencil, User } from 'lucide-react'
import { Button, ProgressBar } from './Primitives.jsx'
import { categoryColor } from '../utils/categoryColor.js'
import { formatDate } from '../utils/dates.js'

const categoryIcons = {
  Kuliah: BookOpen,
  Belajar: NotebookPen,
  Pribadi: User,
  Rumah: Home,
  Kerja: Briefcase,
  Lainnya: CalendarDays,
}

export function AnimatedContainer({ as: Element = 'div', className = '', index = 0, style, children, ...props }) {
  return <Element className={`dashboard-reveal ${className}`.trim()} style={{ ...style, '--reveal-index': index }} {...props}>{children}</Element>
}

export function StatisticCard({ label, value, note, icon: Icon, onClick, accent = false, index = 0 }) {
  return (
    <button type="button" className={`dashboard-reveal metric-card${accent ? ' metric-card-accent' : ''}`} onClick={onClick} aria-label={`${label}: ${value}. ${note}`} style={{ '--reveal-index': index }}>
      <span className="metric-icon"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
      <ArrowUpRight size={16} className="metric-arrow" aria-hidden="true" />
    </button>
  )
}

export function ProgressCard({ completion, completed, total, remaining }) {
  return (
    <div className="dashboard-progress-card">
      <div className="progress-card-top"><span className="progress-card-label">PROGRES HARI INI</span><span className="progress-card-mark"><CircleDot size={16} aria-hidden="true" />Hari ini</span></div>
      <div className="progress-card-summary"><strong>{completion}<span>%</span></strong><div><span>Rencana harian</span><strong>{total ? `${completed} dari ${total} tugas selesai` : 'Belum ada tugas terjadwal'}</strong></div></div>
      <ProgressBar value={completion} label="Persentase tugas hari ini selesai" showValue={false} />
      <div className="progress-card-foot"><span><Check size={14} aria-hidden="true" />{completed} selesai</span><span>{remaining} tersisa</span></div>
    </div>
  )
}

export function QuickActionButton({ icon: Icon, variant = 'secondary', className = '', children, ...props }) {
  return <Button variant={variant} className={`quick-action-button ${className}`.trim()} {...props}><span className="quick-action-icon"><Icon size={17} strokeWidth={1.9} aria-hidden="true" /></span>{children}</Button>
}

export function ScheduleCard({ item, today, onEdit }) {
  const Icon = categoryIcons[item.category] ?? CalendarDays
  const colors = categoryColor(item.category)
  const status = item.date === today ? 'Hari ini' : 'Terjadwal'
  return (
    <article className="schedule-card" style={{ '--event-border': colors.border, '--event-background': colors.background, '--event-ink': colors.ink }}>
      <div className="schedule-time"><strong>{item.startTime}</strong><span>{formatDate(item.date, { day: 'numeric', month: 'short' })}</span></div>
      <span className="schedule-rule" aria-hidden="true" />
      <div className="schedule-copy"><strong>{item.title}</strong><div className="schedule-meta"><span className="schedule-category"><Icon size={13} aria-hidden="true" />{item.category}</span><span><Clock3 size={13} aria-hidden="true" />Sampai {item.endTime}</span></div></div>
      <div className="schedule-trailing"><span className="schedule-status">{status}</span><button className="icon-button subtle-icon" type="button" aria-label={`Ubah jadwal ${item.title}`} onClick={onEdit}><Pencil size={15} /></button></div>
    </article>
  )
}

export function RoutineItem({ routine, complete, onToggle }) {
  return (
    <li className={`routine-item${complete ? ' is-complete' : ''}`}>
      <button type="button" className="check-control" aria-label={`${complete ? 'Batalkan' : 'Tandai'} ${routine.title}`} aria-pressed={complete} onClick={onToggle}>
        <span className={`checkbox-visual${complete ? ' checked' : ''}`}>{complete && <Check size={13} />}</span>
        <span className="routine-item-copy"><strong className={complete ? 'routine-done' : ''}>{routine.title}</strong><small>{routine.category}</small></span>
      </button>
      <span className="routine-item-time">{routine.time ? <><Clock3 size={13} aria-hidden="true" />{routine.time}</> : 'Hari ini'}</span>
    </li>
  )
}
