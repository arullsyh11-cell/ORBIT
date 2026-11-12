import { useMemo, useState } from 'react'
import { CalendarDays, Check, Circle, Clock3, Pencil, Search, Trash2 } from 'lucide-react'
import { AddButton, Button, EmptyState, PageHeading } from '../components/Primitives.jsx'
import Select from '../components/Select.jsx'
import { TaskForm } from '../components/Forms.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDate, todayISO } from '../utils/dates.js'
import { nextTaskOccurrence } from '../utils/recurrence.js'

const views = [
  { id: 'all', label: 'Semua tugas' }, { id: 'today', label: 'Hari ini' }, { id: 'upcoming', label: 'Mendatang' },
  { id: 'completed', label: 'Selesai' }, { id: 'overdue', label: 'Terlambat' },
]

export default function Tasks() {
  const data = useWorkspace()
  const [view, setView] = useState('all')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua kategori')
  const [priority, setPriority] = useState('Semua prioritas')
  const [status, setStatus] = useState('Semua status')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const today = todayISO()

  const filtered = useMemo(() => data.tasks.filter(task => {
    if (view === 'today' && task.dueDate !== today && task.startDate !== today) return false
    if (view === 'upcoming' && (!task.dueDate || task.dueDate <= today || task.status === 'Completed')) return false
    if (view === 'completed' && task.status !== 'Completed') return false
    if (view === 'overdue' && (!task.dueDate || task.dueDate >= today || task.status === 'Completed')) return false
    if (category !== 'Semua kategori' && task.category !== category) return false
    if (priority !== 'Semua prioritas' && task.priority !== priority) return false
    if (status !== 'Semua status' && task.status !== status) return false
    const needle = search.trim().toLocaleLowerCase('id-ID')
    return !needle || `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase('id-ID').includes(needle)
  }).sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return 1
    if (b.status === 'Completed' && a.status !== 'Completed') return -1
    return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') || a.title.localeCompare(b.title, 'id')
  }), [data.tasks, view, today, category, priority, status, search])

  const save = value => {
    let repeatNotice = false
    if (editing) {
      const completedAt = value.status === 'Completed' ? (editing.completedAt ?? new Date().toISOString()) : null
      const updated = { ...editing, ...value, completedAt }
      data.updateTask(editing.id, { ...value, completedAt })
      if (value.status === 'Completed' && editing.status !== 'Completed') {
        const next = nextTaskOccurrence(updated)
        if (next) { data.createTask(next); repeatNotice = true }
      }
      data.notify(repeatNotice ? 'Tugas diperbarui dan jadwal berikutnya dibuat.' : 'Tugas diperbarui.')
    } else {
      const created = data.createTask({ ...value, completedAt: value.status === 'Completed' ? new Date().toISOString() : null })
      if (value.status === 'Completed') {
        const next = nextTaskOccurrence(created)
        if (next) { data.createTask(next); repeatNotice = true }
      }
      data.notify(repeatNotice ? 'Tugas disimpan dan jadwal berikutnya dibuat.' : 'Tugas ditambahkan.')
    }
    setEditing(null); setModal(false)
  }

  const toggle = task => {
    const complete = task.status !== 'Completed'
    data.updateTask(task.id, { status: complete ? 'Completed' : 'To Do', completedAt: complete ? new Date().toISOString() : null })
    const next = complete ? nextTaskOccurrence(task) : null
    if (next) data.createTask(next)
    if (!complete) {
      const pendingOccurrence = data.tasks.find(item => item.repeatSourceId === task.id && item.status !== 'Completed')
      if (pendingOccurrence) data.deleteTask(pendingOccurrence.id)
    }
    data.notify(next ? `Tugas selesai. Berikutnya jatuh pada ${formatDate(next.dueDate)}.` : complete ? 'Tugas ditandai selesai.' : 'Tugas dikembalikan ke daftar.')
  }

  const toggleSubtask = (task, subtask) => {
    data.updateTask(task.id, { subtasks: task.subtasks.map(item => item.id === subtask.id ? { ...item, done: !item.done } : item) })
  }

  const remove = task => {
    if (!window.confirm(`Hapus tugas “${task.title}”? Tindakan ini tidak dapat dibatalkan.`)) return
    data.deleteTask(task.id)
    data.notify('Tugas dihapus.')
  }

  const countFor = id => data.tasks.filter(task => {
    if (id === 'all') return true
    if (id === 'today') return task.dueDate === today || task.startDate === today
    if (id === 'upcoming') return task.dueDate > today && task.status !== 'Completed'
    if (id === 'completed') return task.status === 'Completed'
    return task.dueDate && task.dueDate < today && task.status !== 'Completed'
  }).length

  return (
    <>
      <PageHeading eyebrow="TUGAS / RUANG KERJA" title="Satu per satu." description="Catat yang perlu dikerjakan, lalu pilih langkah berikutnya." action={<AddButton onClick={() => { setEditing(null); setModal(true) }}>Tugas baru</AddButton>} />
      <div className="task-toolbar">
        <div className="search-field"><Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor="task-search">Cari tugas</label><input id="task-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari tugas atau detail" /></div>
        <div className="filter-group">
          <Select id="task-category" aria-label="Filter kategori tugas" value={category} onChange={event => setCategory(event.target.value)} options={['Semua kategori', ...data.settings.taskCategories]} />
          <Select id="task-priority" aria-label="Filter prioritas" value={priority} onChange={event => setPriority(event.target.value)} options={['Semua prioritas', ...data.settings.priorities]} />
          <Select id="task-status" aria-label="Filter status tugas" value={status} onChange={event => setStatus(event.target.value)} options={['Semua status', 'To Do', 'In Progress', 'Completed']} />
        </div>
      </div>
      <div className="tab-strip" role="tablist" aria-label="Tampilan tugas">{views.map(item => <button type="button" role="tab" aria-selected={view === item.id} className={`tab-button${view === item.id ? ' active' : ''}`} key={item.id} onClick={() => setView(item.id)}>{item.label}<span>{countFor(item.id)}</span></button>)}</div>

      {filtered.length ? <section className="task-list" aria-label={views.find(item => item.id === view)?.label}>
        {filtered.map(task => {
          const isComplete = task.status === 'Completed'
          const isOverdue = task.dueDate && task.dueDate < today && !isComplete
          return <article className={`task-row${isComplete ? ' task-completed' : ''}${isOverdue ? ' task-overdue' : ''}`} key={task.id}>
            <button className="task-completion" type="button" role="checkbox" aria-checked={isComplete} aria-label={`${isComplete ? 'Tandai belum selesai' : 'Tandai selesai'}: ${task.title}`} onClick={() => toggle(task)}><span className={`checkbox-visual${isComplete ? ' checked' : ''}`}>{isComplete && <Check size={13} />}</span></button>
            <div className="task-main"><div className="task-title-row"><h2>{task.title}</h2><span className={`priority-tag priority-${task.priority?.toLowerCase() ?? 'sedang'}`}>{task.priority}</span></div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-meta"><span>{task.category}</span><span className="meta-dot" aria-hidden="true" />{task.dueDate ? <span className={isOverdue ? 'overdue-copy' : ''}><CalendarDays size={14} />{formatDate(task.dueDate, { day: 'numeric', month: 'short' })}{isOverdue ? ' · terlambat' : ''}</span> : <span><CalendarDays size={14} />Tanpa tenggat</span>}{task.repeat !== 'Tidak berulang' && <span><Clock3 size={14} />{task.repeat}</span>}{task.reminder && <span><Clock3 size={14} />Ada pengingat</span>}</div>
              {task.subtasks?.length > 0 && <div className="subtask-list">{task.subtasks.map(subtask => <label key={subtask.id} className={`subtask-row${subtask.done ? ' subtask-done' : ''}`}><input type="checkbox" checked={Boolean(subtask.done)} onChange={() => toggleSubtask(task, subtask)} /><span>{subtask.title}</span></label>)}</div>}
            </div>
            <div className="task-status-label">{task.status}</div>
            <div className="row-actions"><button className="icon-button" type="button" aria-label={`Ubah tugas ${task.title}`} onClick={() => { setEditing(task); setModal(true) }}><Pencil size={16} /></button><button className="icon-button danger-hover" type="button" aria-label={`Hapus tugas ${task.title}`} onClick={() => remove(task)}><Trash2 size={16} /></button></div>
          </article>
        })}
      </section> : <EmptyState icon={Circle} title={search || category !== 'Semua kategori' || priority !== 'Semua prioritas' || status !== 'Semua status' ? 'Tidak ada tugas yang cocok' : view === 'completed' ? 'Belum ada tugas selesai' : view === 'overdue' ? 'Tidak ada tugas terlambat' : 'Daftar ini masih kosong'} detail={search || category !== 'Semua kategori' || priority !== 'Semua prioritas' || status !== 'Semua status' ? 'Coba ubah kata pencarian atau filter.' : 'Tambahkan tugas agar rencana Anda punya tempat.'} action={<AddButton onClick={() => { setEditing(null); setModal(true) }}>Tambah tugas</AddButton>} />}

      {modal && <TaskForm task={editing} categories={data.settings.taskCategories} priorities={data.settings.priorities} onSave={save} onClose={() => { setModal(false); setEditing(null) }} />}
    </>
  )
}
