import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { AddButton, Button, EmptyState, PageHeading } from '../components/Primitives.jsx'
import { ScheduleForm } from '../components/Forms.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { addDays, daysInMonth, formatDate, isoDate, monthLabel, todayISO } from '../utils/dates.js'
import { categoryColor } from '../utils/categoryColor.js'

const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function dateFor(year, month, day) {
  const date = new Date(year, month, day, 12)
  return isoDate(date)
}

export default function Calendar({ onNavigate }) {
  const data = useWorkspace()
  const today = todayISO()
  const [selected, setSelected] = useState(today)
  const [view, setView] = useState('month')
  const [editing, setEditing] = useState(null)
  const [modal, setModal] = useState(false)
  const selectedDate = new Date(`${selected}T12:00:00`)
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()

  const allEvents = useMemo(() => [
    ...data.schedules.map(item => ({ ...item, kind: 'schedule', time: item.startTime, eventDate: item.date })),
    ...data.tasks.filter(item => item.dueDate).map(item => ({ ...item, kind: 'task', time: '23:59', eventDate: item.dueDate })),
  ].sort((a, b) => `${a.eventDate} ${a.time}`.localeCompare(`${b.eventDate} ${b.time}`)), [data.schedules, data.tasks])
  const eventsFor = date => allEvents.filter(event => event.eventDate === date)
  const selectedEvents = eventsFor(selected)

  const monthDates = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
    const total = Math.ceil((firstWeekday + daysInMonth(year, month)) / 7) * 7
    const first = dateFor(year, month, 1 - firstWeekday)
    return Array.from({ length: total }, (_, index) => addDays(first, index))
  }, [year, month])

  const shift = amount => {
    if (view === 'month') setSelected(dateFor(year, month + amount, 1))
    else if (view === 'week') setSelected(addDays(selected, amount * 7))
    else setSelected(addDays(selected, amount))
  }

  const save = value => {
    if (editing) {
      data.updateSchedule(editing.id, value)
      data.notify('Jadwal diperbarui.')
    } else {
      data.createSchedule(value)
      data.notify('Jadwal ditambahkan.')
    }
    setModal(false); setEditing(null)
  }
  const remove = item => {
    if (!window.confirm(`Hapus jadwal “${item.title}”? Tindakan ini tidak dapat dibatalkan.`)) return
    data.deleteSchedule(item.id)
    data.notify('Jadwal dihapus.')
  }

  const eventLabel = event => event.kind === 'task' ? `${event.title} · Tenggat tugas` : `${event.title} · ${event.startTime}`
  const eventAction = event => {
    if (event.kind === 'task') return onNavigate('tasks')
    setEditing(event); setModal(true)
  }
  const headerLabel = view === 'month' ? monthLabel(year, month) : view === 'week' ? `${formatDate(selected, { day: 'numeric', month: 'short' })} sampai ${formatDate(addDays(selected, 6), { day: 'numeric', month: 'long', year: 'numeric' })}` : formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const weekStart = addDays(selected, -((selectedDate.getDay() + 6) % 7))
  const visibleDates = view === 'week' ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : view === 'day' ? [selected] : monthDates

  return (
    <>
      <PageHeading eyebrow="KALENDER / JADWAL" title="Beri ruang pada waktumu." description="Lihat kegiatan dan tenggat tugas dalam satu kalender." action={<AddButton onClick={() => { setEditing(null); setModal(true) }}>Jadwal baru</AddButton>} />
      <section className="calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-month-nav"><button className="icon-button" type="button" aria-label="Periode sebelumnya" onClick={() => shift(-1)}><ChevronLeft size={19} /></button><h2>{headerLabel}</h2><button className="icon-button" type="button" aria-label="Periode berikutnya" onClick={() => shift(1)}><ChevronRight size={19} /></button><Button variant="quiet" onClick={() => setSelected(today)}>Hari ini</Button></div>
          <div className="view-switch" role="group" aria-label="Tampilan kalender">{[['month', 'Bulan'], ['week', 'Minggu'], ['day', 'Hari']].map(([value, label]) => <button type="button" key={value} className={view === value ? 'selected' : ''} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>
        </div>
        {view === 'month' && <div className="month-grid">
          <div className="weekday-row">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
          <div className="month-days">{visibleDates.map(date => {
            const sameMonth = Number(date.slice(5, 7)) - 1 === month
            const dayEvents = eventsFor(date)
            return <div className={`calendar-cell${sameMonth ? '' : ' outside-month'}${date === today ? ' calendar-today' : ''}${selected === date ? ' calendar-selected' : ''}`} key={date}>
              <button className="calendar-date" type="button" aria-label={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${dayEvents.length} kegiatan`} aria-pressed={selected === date} onClick={() => setSelected(date)}>{Number(date.slice(8, 10))}</button>
              <div className="calendar-events">{dayEvents.slice(0, 2).map(event => <button className={`calendar-event ${event.kind === 'task' ? 'event-task' : 'event-schedule'}`} style={event.kind === 'schedule' ? { '--event-border': categoryColor(event.category).border, '--event-background': categoryColor(event.category).background, '--event-ink': categoryColor(event.category).ink } : undefined} type="button" key={`${event.kind}-${event.id}`} onClick={() => eventAction(event)} title={eventLabel(event)}>{event.kind === 'schedule' && <span>{event.startTime}</span>}{event.title}</button>)}{dayEvents.length > 2 && <span className="more-events">+{dayEvents.length - 2} lainnya</span>}</div>
            </div>
          })}</div>
        </div>}
        {view === 'week' && <div className="week-list">{visibleDates.map(date => <button type="button" className={`week-day${date === today ? ' is-today' : ''}${selected === date ? ' is-selected' : ''}`} key={date} aria-pressed={selected === date} onClick={() => setSelected(date)}>
          <span className="week-day-date"><span>{weekdays[(new Date(`${date}T12:00:00`).getDay() + 6) % 7]}</span><strong>{Number(date.slice(8, 10))}</strong></span>
          <span className="week-day-events">{eventsFor(date).length ? eventsFor(date).map(event => <span key={`${event.kind}-${event.id}`} className={`week-event ${event.kind === 'task' ? 'event-task' : 'event-schedule'}`} style={event.kind === 'schedule' ? { '--event-border': categoryColor(event.category).border, '--event-background': categoryColor(event.category).background, '--event-ink': categoryColor(event.category).ink } : undefined}><strong>{event.kind === 'schedule' ? event.startTime : 'Tenggat'}</strong>{event.title}</span>) : <span className="week-empty">Tidak ada agenda</span>}</span>
        </button>)}</div>}
        {view === 'day' && <div className="day-view"><div className="day-view-rail"><span className="dayline" aria-hidden="true" /><span>{formatDate(selected, { weekday: 'long' })}</span><strong>{Number(selected.slice(8, 10))}</strong></div><div className="day-agenda">{selectedEvents.length ? selectedEvents.map(event => <article className="day-agenda-row" key={`${event.kind}-${event.id}`}><time>{event.kind === 'task' ? 'Tenggat' : event.startTime}</time><span className={`agenda-marker ${event.kind}`} /><div><strong>{event.title}</strong><p>{event.kind === 'task' ? `Tugas · ${event.category}` : `${event.category} · sampai ${event.endTime}`}</p>{event.description && <p>{event.description}</p>}</div>{event.kind === 'schedule' && <div className="row-actions"><button type="button" className="icon-button" aria-label={`Ubah jadwal ${event.title}`} onClick={() => eventAction(event)}><Pencil size={16} /></button><button type="button" className="icon-button danger-hover" aria-label={`Hapus jadwal ${event.title}`} onClick={() => remove(event)}><Trash2 size={16} /></button></div>}</article>) : <EmptyState icon={CalendarDays} title="Hari ini masih lapang" detail="Tambahkan kegiatan atau tugas bertenggat untuk melihatnya di sini." action={<Button onClick={() => { setEditing(null); setModal(true) }}>Jadwalkan kegiatan</Button>} />}</div></div>}
        <div className="calendar-legend"><span><i className="legend-swatch schedule-swatch" />Kegiatan</span><span><i className="legend-swatch task-swatch" />Tenggat tugas</span></div>
      </section>
      <section className="selected-day-panel">
        <div className="panel-heading"><div><p className="eyebrow">HARI TERPILIH</p><h2>{formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}</h2></div><Button variant="secondary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={16} />Tambah jadwal</Button></div>
        {selectedEvents.length ? <div className="selected-events">{selectedEvents.map(event => <div className="selected-event" key={`${event.kind}-${event.id}`}><span className={`agenda-marker ${event.kind}`} /><div><strong>{event.title}</strong><span>{event.kind === 'task' ? `Tenggat tugas · ${event.category}` : `${event.startTime}-${event.endTime} · ${event.category}`}</span></div>{event.kind === 'schedule' && <div className="row-actions"><button type="button" className="icon-button" aria-label={`Ubah jadwal ${event.title}`} onClick={() => eventAction(event)}><Pencil size={15} /></button><button type="button" className="icon-button danger-hover" aria-label={`Hapus jadwal ${event.title}`} onClick={() => remove(event)}><Trash2 size={15} /></button></div>}</div>)}</div> : <p className="selected-empty">Belum ada kegiatan atau tenggat pada hari ini.</p>}
      </section>
      {modal && <ScheduleForm schedule={editing} categories={data.settings.scheduleCategories} selectedDate={selected} onSave={save} onClose={() => { setModal(false); setEditing(null) }} />}
    </>
  )
}
