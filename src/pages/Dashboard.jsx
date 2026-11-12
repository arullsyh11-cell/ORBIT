import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, CalendarClock, CheckSquare2, CircleDot, FilePlus2, Flag, ListTodo, NotebookPen, Plus } from 'lucide-react'
import { Button, EmptyState, ProgressBar } from '../components/Primitives.jsx'
import Select from '../components/Select.jsx'
import { AnimatedContainer, ProgressCard, QuickActionButton, RoutineItem, ScheduleCard, StatisticCard } from '../components/DashboardWidgets.jsx'
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
    { label: 'Rutinitas hari ini', value: `${doneRoutines}/${todayRoutines.length}`, note: `${doneRoutines} dari ${todayRoutines.length} selesai`, icon: CircleDot, action: 'routines' },
    { label: 'Perlu perhatian', value: overdue.length, note: overdue.length ? 'tugas melewati tenggat' : 'semua tenggat terkendali', icon: CalendarClock, action: 'tasks', accent: true },
  ], [totalToday, completedToday, todayTasks.length, overdue.length, doneRoutines, todayRoutines.length])

  return (
    <>
      <AnimatedContainer as="section" className="dashboard-hero" index={0} aria-label="Ringkasan hari ini">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">ORBIT / HARI INI</p>
          <h1>{getGreeting()}{data.profile.name ? `, ${data.profile.name}` : ''}.</h1>
          <p className="dashboard-hero-description">Hari ini, mulailah dari satu langkah kecil.</p>
          <div className="dashboard-date"><CalendarDays size={16} aria-hidden="true" /><time dateTime={today}>{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</time></div>
        </div>
        <ProgressCard completion={completion} completed={completedToday} total={totalToday} remaining={todayTasks.length} />
      </AnimatedContainer>

      {widget('summary') && <section className="metric-grid" aria-label="Ringkasan hari ini">
        {metrics.map(({ label, value, note, icon, action, accent }, index) => <StatisticCard key={label} label={label} value={value} note={note} icon={icon} accent={accent} index={index + 1} onClick={() => onNavigate(action)} />)}
      </section>}

      <AnimatedContainer as="section" className="quick-actions" index={2} aria-label="Aksi cepat">
        <div className="quick-actions-heading"><p className="eyebrow">MULAI DARI SINI</p><span>Pilih langkah berikutnya</span></div>
        <div className="quick-action-list">
          <QuickActionButton icon={Plus} variant="primary" onClick={() => { setEditRecord(null); setModal('task') }}>Tambah tugas</QuickActionButton>
          <QuickActionButton icon={CalendarClock} onClick={() => { setEditRecord(null); setModal('schedule') }}>Jadwalkan</QuickActionButton>
          <QuickActionButton icon={FilePlus2} onClick={quickNote}>Catatan</QuickActionButton>
          <QuickActionButton icon={CircleDot} onClick={() => { setEditRecord(null); setModal('routine') }}>Rutinitas</QuickActionButton>
        </div>
      </AnimatedContainer>

      <div className="dashboard-columns">
        {widget('schedule') && <AnimatedContainer as="section" className="panel panel-schedule" index={3}>
          <div className="panel-heading"><div><p className="eyebrow">WAKTU BERIKUTNYA</p><h2>Jadwal mendatang</h2></div><button type="button" className="text-link" onClick={() => onNavigate('calendar')}>Buka kalender <ArrowUpRight size={15} /></button></div>
          {upcomingSchedules.length ? <div className="schedule-list">{upcomingSchedules.map(item => <ScheduleCard key={item.id} item={item} today={today} onEdit={() => { setEditRecord(item); setModal('schedule') }} />)}</div> : <EmptyState icon={CalendarClock} title="Belum ada jadwal" detail="Tambahkan kegiatan agar waktunya terlihat di sini." compact action={<Button variant="secondary" onClick={() => setModal('schedule')}>Tambah jadwal</Button>} />}
        </AnimatedContainer>}

        {widget('routines') && <AnimatedContainer as="section" className="panel panel-routines" index={4}>
          <div className="panel-heading"><div><p className="eyebrow">LANGKAH KECIL</p><h2>Rutinitas hari ini</h2></div><button type="button" className="text-link" onClick={() => onNavigate('routines')}>Lihat semua <ArrowUpRight size={15} /></button></div>
          {todayRoutines.length ? <>
            <div className="routine-summary"><div><strong>{doneRoutines}</strong><span> dari {todayRoutines.length} selesai</span></div><ProgressBar value={Math.round(doneRoutines / todayRoutines.length * 100)} label="Rutinitas selesai hari ini" /></div>
            <ul className="routine-checklist">{todayRoutines.slice(0, 4).map(routine => {
              const complete = (routine.completedDates ?? []).includes(today)
              return <RoutineItem key={routine.id} routine={routine} complete={complete} onToggle={() => toggleRoutine(routine)} />
            })}</ul>
          </> : <EmptyState icon={CircleDot} title="Ruang ini masih kosong" detail="Buat rutinitas yang ingin Anda jaga hari ini." compact action={<Button variant="secondary" onClick={() => setModal('routine')}>Tambah rutinitas</Button>} />}
        </AnimatedContainer>}

        {widget('goals') && <AnimatedContainer as="section" className="panel panel-goals" index={5}>
          <div className="panel-heading"><div><p className="eyebrow">MINGGU INI</p><h2>Target mingguan</h2></div><button type="button" className="text-link" onClick={() => onNavigate('goals')}>Lihat target <ArrowUpRight size={15} /></button></div>
          {activeGoals.length ? <div className="goal-list dashboard-goal-list">{activeGoals.slice(0, 3).map(goal => {
            const value = Math.min(100, Math.round((goal.current ?? 0) / Math.max(1, goal.target) * 100))
            return <button type="button" className="dashboard-goal" key={goal.id} onClick={() => onNavigate('goals')}><span className="goal-title-line"><strong>{goal.title}</strong><span>{goal.current ?? 0}/{goal.target}</span></span><ProgressBar value={value} label={`Progres ${goal.title}`} showValue={false} /></button>
          })}</div> : <EmptyState icon={Flag} title="Belum ada target" detail="Pilih satu hasil yang ingin Anda capai minggu ini." compact action={<Button variant="secondary" onClick={() => onNavigate('goals')}>Atur target</Button>} />}
        </AnimatedContainer>}

        {widget('notes') && <AnimatedContainer as="section" className="panel panel-notes" index={6}>
          <div className="panel-heading"><div><p className="eyebrow">SIMPAN UNTUK NANTI</p><h2>Catatan cepat</h2></div><button type="button" className="text-link" onClick={() => onNavigate('notes')}>Buka catatan <ArrowUpRight size={15} /></button></div>
          {quickNotes.length ? <div className="quick-note-list">{quickNotes.map(note => <button type="button" className="quick-note" key={note.id} onClick={() => onNavigate('notes')}><span className="quick-note-category">{note.category}</span><strong>{note.title || 'Tanpa judul'}</strong><span>{(note.content ?? '').slice(0, 90) || 'Belum ada isi catatan.'}</span></button>)}</div> : <EmptyState icon={NotebookPen} title="Belum ada catatan" detail="Simpan ide atau detail yang ingin Anda ingat." compact action={<Button variant="secondary" onClick={quickNote}>Buat catatan</Button>} />}
        </AnimatedContainer>}
      </div>

      {modal === 'task' && <TaskForm categories={data.settings.taskCategories} priorities={data.settings.priorities} task={editRecord} onSave={saveTask} onClose={() => { setModal(''); setEditRecord(null) }} />}
      {modal === 'schedule' && <ScheduleForm categories={data.settings.scheduleCategories} schedule={editRecord} onSave={saveSchedule} onClose={() => { setModal(''); setEditRecord(null) }} />}
      {modal === 'routine' && <RoutineForm categories={data.settings.routineCategories} routine={editRecord} onSave={saveRoutine} onClose={() => { setModal(''); setEditRecord(null) }} />}
      {modal === 'note' && <Modal title="Catatan baru" onClose={() => setModal('')}><form className="form-stack" onSubmit={saveQuickNote}><label className="field"><span className="field-label">Judul</span><input name="title" autoFocus maxLength={140} placeholder="Beri judul bila perlu" /></label><label className="field"><span className="field-label">Isi catatan</span><textarea name="content" rows="5" placeholder="Tulis yang ingin Anda ingat" /></label><label className="field"><span className="field-label">Kategori</span><Select name="category" options={data.settings.noteCategories} aria-label="Kategori catatan" /></label>{noteError && <p className="form-error" role="alert">{noteError}</p>}<div className="form-actions"><ModalCancelButton /><Button type="submit">Simpan catatan</Button></div></form></Modal>}
    </>
  )
}
