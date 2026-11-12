import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarClock, Check, CheckSquare2, CircleDot, FilePlus2, Flag, ListTodo, NotebookPen, Pencil, Plus } from 'lucide-react'
import { AddButton, Button, EmptyState, PageHeading, ProgressBar } from '../components/Primitives.jsx'
import Select from '../components/Select.jsx'
import { RoutineForm, ScheduleForm, TaskForm } from '../components/Forms.jsx'
import Modal, { ModalCancelButton } from '../components/Modal.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDate, getGreeting, todayISO, mondayOf, addDays } from '../utils/dates.js'
import { nextTaskOccurrence } from '../utils/recurrence.js'

export default function Dashboard({ onNavigate }) {
  const data = useWorkspace()
  const [modal, setModal] = useState('')
  const [editRecord, setEditRecord] = useState(null)
  const [noteError, setNoteError] = useState('')
  const today = todayISO()
  const weekday = new Date(`${today}T12:00:00`).getDay()
  const scheduledToday = data.tasks.filter(task => task.dueDate === today || task.startDate === today)
  const todayTasks = scheduledToday.filter(task => task.status !== 'Completed')
  const completedToday = scheduledToday.filter(task => task.status === 'Completed').length
  const totalToday = scheduledToday.length
  const overdue = data.tasks.filter(task => task.dueDate && task.dueDate < today && task.status !== 'Completed')
  const completion = totalToday ? Math.round(completedToday / totalToday * 100) : 0
  const todayRoutines = data.routines.filter(routine => (routine.days ?? []).includes(weekday))
  const doneRoutines = todayRoutines.filter(routine => (routine.completedDates ?? []).includes(today)).length
  const weekStart = mondayOf(today)
  const weekEnd = addDays(weekStart, 6)
  const activeGoals = data.goals.filter(goal => goal.endDate >= weekStart && goal.startDate <= weekEnd)
  const upcomingSchedules = [...data.schedules].filter(item => item.date >= today).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)).slice(0, 4)
  const quickNotes = [...data.notes].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt)).slice(0, 3)
  const widget = name => data.settings.dashboardWidgets.includes(name)

  const saveTask = value => {
    let repeated = false
    if (editRecord) {
      const updated = { ...editRecord, ...value, completedAt: value.status === 'Completed' ? (editRecord.completedAt ?? new Date().toISOString()) : null }
      data.updateTask(editRecord.id, { ...value, completedAt: updated.completedAt })
      if (value.status === 'Completed' && editRecord.status !== 'Completed') {
        const next = nextTaskOccurrence(updated)
        if (next) { data.createTask(next); repeated = true }
      }
    } else {
      const created = data.createTask({ ...value, completedAt: value.status === 'Completed' ? new Date().toISOString() : null })
      if (value.status === 'Completed') {
        const next = nextTaskOccurrence(created)
        if (next) { data.createTask(next); repeated = true }
      }
    }
    data.notify(repeated ? 'Tugas disimpan dan jadwal berikutnya dibuat.' : editRecord ? 'Tugas diperbarui.' : 'Tugas ditambahkan.')
    setModal(''); setEditRecord(null)
  }
  const saveSchedule = value => {
    if (editRecord) data.updateSchedule(editRecord.id, value)
    else data.createSchedule(value)
    data.notify(editRecord ? 'Jadwal diperbarui.' : 'Jadwal ditambahkan.')
    setModal(''); setEditRecord(null)
  }
  const saveRoutine = value => {
    if (editRecord) data.updateRoutine(editRecord.id, value)
    else data.createRoutine({ ...value, completedDates: [] })
    data.notify(editRecord ? 'Rutinitas diperbarui.' : 'Rutinitas ditambahkan.')
    setModal(''); setEditRecord(null)
  }
  const quickNote = () => { setNoteError(''); setModal('note') }
  const saveQuickNote = event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const content = String(form.get('content') ?? '').trim()
    if (!title && !content) { setNoteError('Tulis judul atau isi catatan terlebih dahulu.'); return }
    data.createNote({ title, content, category: String(form.get('category') ?? data.settings.noteCategories[0]), pinned: false })
    setModal('')
    onNavigate('notes')
    data.notify('Catatan disimpan.')
  }

  const toggleRoutine = routine => {
    const dates = routine.completedDates ?? []
    const next = dates.includes(today) ? dates.filter(value => value !== today) : [...dates, today]
    data.updateRoutine(routine.id, { completedDates: next })
  }

  const metrics = useMemo(() => [
    { label: 'Tugas hari ini', value: totalToday, note: `${completedToday} selesai`, icon: ListTodo, action: 'tasks' },
    { label: 'Belum selesai', value: todayTasks.length, note: `${overdue.length} terlambat`, icon: CheckSquare2, action: 'tasks' },
    { label: 'Rutinitas hari ini', value: `${doneRoutines}/${todayRoutines.length}`, note: 'sudah dijalani', icon: CircleDot, action: 'routines' },
  ], [totalToday, completedToday, todayTasks.length, overdue.length, doneRoutines, todayRoutines.length])

  return (
    <>
      <PageHeading eyebrow="DAYFLOW / HARI INI" title={`${getGreeting()}${data.profile.name ? `, ${data.profile.name}` : ''}.`} description="Pilih satu hal untuk memulai. Sisanya bisa menyusul." />

      <section className="dashboard-intro">
        <div className="intro-date"><span className="dayline" aria-hidden="true" /><span>{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
        <div className="intro-progress"><span className="intro-progress-label">Penyelesaian hari ini</span><strong>{completion}%</strong><ProgressBar value={completion} label="Persentase tugas hari ini selesai" showValue={false} /></div>
      </section>

      {widget('summary') && <section className="metric-grid" aria-label="Ringkasan hari ini">
        {metrics.map(({ label, value, note, icon: Icon, action }) => <button type="button" key={label} className="metric-card" onClick={() => onNavigate(action)}>
          <span className="metric-icon"><Icon size={18} aria-hidden="true" /></span><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span><ArrowUpRight size={16} className="metric-arrow" aria-hidden="true" />
        </button>)}
        <button type="button" className={`metric-card metric-card-accent${overdue.length ? ' has-overdue' : ''}`} onClick={() => onNavigate('tasks')}>
          <span className="metric-icon"><CalendarClock size={18} aria-hidden="true" /></span><span className="metric-label">Perlu perhatian</span><strong className="metric-value">{overdue.length}</strong><span className="metric-note">tugas melewati tenggat</span><ArrowUpRight size={16} className="metric-arrow" aria-hidden="true" />
        </button>
      </section>}

      <section className="quick-actions" aria-label="Aksi cepat">
        <span className="quick-actions-label">Mulai sesuatu</span>
        <div className="quick-action-list">
          <Button onClick={() => { setEditRecord(null); setModal('task') }}><Plus size={17} />Tambah tugas</Button>
          <Button variant="secondary" onClick={() => { setEditRecord(null); setModal('schedule') }}><CalendarClock size={17} />Jadwalkan</Button>
          <Button variant="secondary" onClick={quickNote}><FilePlus2 size={17} />Catatan</Button>
          <Button variant="secondary" onClick={() => { setEditRecord(null); setModal('routine') }}><CircleDot size={17} />Rutinitas</Button>
        </div>
      </section>

      <div className="dashboard-columns">
        {widget('schedule') && <section className="panel panel-schedule">
          <div className="panel-heading"><div><p className="eyebrow">WAKTU BERIKUTNYA</p><h2>Jadwal mendatang</h2></div><button type="button" className="text-link" onClick={() => onNavigate('calendar')}>Buka kalender <ArrowUpRight size={15} /></button></div>
          {upcomingSchedules.length ? <div className="schedule-list">{upcomingSchedules.map(item => <div className="schedule-row" key={item.id}>
            <div className="schedule-time"><strong>{item.startTime}</strong><span>{formatDate(item.date, { day: 'numeric', month: 'short' })}</span></div>
            <span className="schedule-rule" aria-hidden="true" />
            <div className="schedule-copy"><strong>{item.title}</strong><span>{item.category} · sampai {item.endTime}</span></div>
            <button className="icon-button subtle-icon" type="button" aria-label={`Ubah jadwal ${item.title}`} onClick={() => { setEditRecord(item); setModal('schedule') }}><Pencil size={15} /></button>
          </div>)}</div> : <EmptyState icon={CalendarClock} title="Belum ada jadwal" detail="Tambahkan kegiatan agar waktunya terlihat di sini." compact action={<Button variant="secondary" onClick={() => setModal('schedule')}>Tambah jadwal</Button>} />}
        </section>}

        {widget('routines') && <section className="panel panel-routines">
          <div className="panel-heading"><div><p className="eyebrow">LANGKAH KECIL</p><h2>Rutinitas hari ini</h2></div><button type="button" className="text-link" onClick={() => onNavigate('routines')}>Lihat semua <ArrowUpRight size={15} /></button></div>
          {todayRoutines.length ? <>
            <div className="routine-summary"><div><strong>{doneRoutines}</strong><span> dari {todayRoutines.length} selesai</span></div><ProgressBar value={Math.round(doneRoutines / todayRoutines.length * 100)} label="Rutinitas selesai hari ini" /></div>
            <ul className="routine-checklist">{todayRoutines.slice(0, 4).map(routine => {
              const complete = (routine.completedDates ?? []).includes(today)
              return <li key={routine.id}><button type="button" className="check-control" aria-label={`${complete ? 'Batalkan' : 'Tandai'} ${routine.title}`} aria-pressed={complete} onClick={() => toggleRoutine(routine)}><span className={`checkbox-visual${complete ? ' checked' : ''}`}>{complete && <Check size={13} />}</span><span className={complete ? 'routine-done' : ''}>{routine.title}</span></button>{routine.time && <time>{routine.time}</time>}</li>
            })}</ul>
          </> : <EmptyState icon={CircleDot} title="Ruang ini masih kosong" detail="Buat rutinitas yang ingin Anda jaga hari ini." compact action={<Button variant="secondary" onClick={() => setModal('routine')}>Tambah rutinitas</Button>} />}
        </section>}

        {widget('goals') && <section className="panel panel-goals">
          <div className="panel-heading"><div><p className="eyebrow">MINGGU INI</p><h2>Target mingguan</h2></div><button type="button" className="text-link" onClick={() => onNavigate('goals')}>Lihat target <ArrowUpRight size={15} /></button></div>
          {activeGoals.length ? <div className="goal-list dashboard-goal-list">{activeGoals.slice(0, 3).map(goal => {
            const value = Math.min(100, Math.round((goal.current ?? 0) / Math.max(1, goal.target) * 100))
            return <button type="button" className="dashboard-goal" key={goal.id} onClick={() => onNavigate('goals')}><span className="goal-title-line"><strong>{goal.title}</strong><span>{goal.current ?? 0}/{goal.target}</span></span><ProgressBar value={value} label={`Progres ${goal.title}`} showValue={false} /></button>
          })}</div> : <EmptyState icon={Flag} title="Belum ada target" detail="Pilih satu hasil yang ingin Anda capai minggu ini." compact action={<Button variant="secondary" onClick={() => onNavigate('goals')}>Atur target</Button>} />}
        </section>}

        {widget('notes') && <section className="panel panel-notes">
          <div className="panel-heading"><div><p className="eyebrow">SIMPAN UNTUK NANTI</p><h2>Catatan cepat</h2></div><button type="button" className="text-link" onClick={() => onNavigate('notes')}>Buka catatan <ArrowUpRight size={15} /></button></div>
          {quickNotes.length ? <div className="quick-note-list">{quickNotes.map(note => <button type="button" className="quick-note" key={note.id} onClick={() => onNavigate('notes')}><span className="quick-note-category">{note.category}</span><strong>{note.title || 'Tanpa judul'}</strong><span>{(note.content ?? '').slice(0, 90) || 'Belum ada isi catatan.'}</span></button>)}</div> : <EmptyState icon={NotebookPen} title="Belum ada catatan" detail="Simpan ide atau detail yang ingin Anda ingat." compact action={<Button variant="secondary" onClick={quickNote}>Buat catatan</Button>} />}
        </section>}
      </div>

      {modal === 'task' && <TaskForm categories={data.settings.taskCategories} priorities={data.settings.priorities} task={editRecord} onSave={saveTask} onClose={() => { setModal(''); setEditRecord(null) }} />}
      {modal === 'schedule' && <ScheduleForm categories={data.settings.scheduleCategories} schedule={editRecord} onSave={saveSchedule} onClose={() => { setModal(''); setEditRecord(null) }} />}
      {modal === 'routine' && <RoutineForm categories={data.settings.routineCategories} routine={editRecord} onSave={saveRoutine} onClose={() => { setModal(''); setEditRecord(null) }} />}
      {modal === 'note' && <Modal title="Catatan baru" onClose={() => setModal('')}><form className="form-stack" onSubmit={saveQuickNote}><label className="field"><span className="field-label">Judul</span><input name="title" autoFocus maxLength={140} placeholder="Beri judul bila perlu" /></label><label className="field"><span className="field-label">Isi catatan</span><textarea name="content" rows="5" placeholder="Tulis yang ingin Anda ingat" /></label><label className="field"><span className="field-label">Kategori</span><Select name="category" options={data.settings.noteCategories} aria-label="Kategori catatan" /></label>{noteError && <p className="form-error" role="alert">{noteError}</p>}<div className="form-actions"><ModalCancelButton /><Button type="submit">Simpan catatan</Button></div></form></Modal>}
    </>
  )
}
